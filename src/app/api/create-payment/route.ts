// src/app/api/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { gerarCPFValido } from '@/lib/utils'
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService'
import { UtmifyOrderPayload } from '@/interfaces/utmify'
import { PaymentPayload } from '@/interfaces/types'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

/* ===================== TRIBOPAY CONFIG ===================== */
const TRIBOPAY_BASE = 'https://api.tribopay.com.br/api/public/v1'

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`)
  return value
}

function getTriboPayToken() {
  return getRequiredEnv('TRIBOPAY_API_TOKEN')
}

function getOfferHash() {
  return getRequiredEnv('TRIBOPAY_OFFER_HASH_CLIENT')
}

function onlyDigits(s: string) {
  return (s || '').replace(/\D/g, '')
}

function safeJsonParse<T>(v: string): T | null {
  try {
    return JSON.parse(v) as T
  } catch {
    return null
  }
}

/** valores em centavos */
function toCents(amount: any) {
  const parsed = parseFloat(String(amount))
  if (isNaN(parsed) || parsed <= 0) return null
  return Math.round(parsed * 100)
}

/** customer mínimo */
function buildCustomer(body: any, finalCpf: string) {
  const phone = onlyDigits(body?.phone || body?.phone_number || '')
  const phoneBR = phone.startsWith('55') ? phone : `55${phone}`

  const customer: any = {
    name: body?.name,
    email: body?.email,
    phone_number: phoneBR,
    document: finalCpf,
  }

  const maybe = (k: string) => (body?.[k] ? body[k] : undefined)
  ;['street_name', 'number', 'complement', 'neighborhood', 'city', 'state', 'zip_code'].forEach((k) => {
    const v = maybe(k)
    if (v !== undefined) customer[k] = v
  })

  return customer
}

function buildTracking(utmQuery?: Record<string, any>, fallbackSrc?: string) {
  const utm = utmQuery || {}
  return {
    src: utm['src'] || utm['utm_source'] || fallbackSrc || '',
    utm_source: utm['utm_source'] || '',
    utm_medium: utm['utm_medium'] || '',
    utm_campaign: utm['utm_campaign'] || '',
    utm_term: utm['utm_term'] || '',
    utm_content: utm['utm_content'] || '',
    sck: utm['sck'] || '',
  }
}

function pickCore(data: any) {
  return data?.data || data?.transaction || data
}

/**
 * Se vier dataURL, tira o prefixo e deixa só base64 puro.
 */
function stripDataUrlPrefix(v: any) {
  if (!v || typeof v !== 'string') return null
  const m = v.match(/^data:image\/png;base64,(.+)$/i)
  return m ? m[1] : v
}

/**
 * Gera QR base64 SEMPRE (PNG) a partir do texto (copy/paste).
 * Retorna base64 "puro" (sem data:image/png;base64, ...)
 */
async function ensureQrBase64FromText(qrText: string | null, existingBase64: string | null) {
  const cleaned = stripDataUrlPrefix(existingBase64)
  if (cleaned) return cleaned

  if (!qrText) return null

  // gera dataURL png
  const dataUrl = await QRCode.toDataURL(qrText, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  })

  return stripDataUrlPrefix(dataUrl)
}

/**
 * Normaliza PIX:
 * - pega qr text de vários lugares (incluindo offer.pix_qr_code)
 * - pega base64 se existir (incluindo offer.qr_code_base64)
 */
function normalizeTriboPayPix(data: any) {
  const core = pickCore(data)
  const offer = core?.offer || data?.offer || null
  const pix = core?.pix || core?.payment?.pix || data?.pix || offer?.pix || {}

  const transaction_hash =
    core?.transaction_hash ||
    core?.hash ||
    data?.transaction_hash ||
    data?.hash ||
    offer?.transaction_hash ||
    offer?.hash ||
    null

  const status =
    core?.status ||
    data?.status ||
    core?.payment_status ||
    offer?.payment_status ||
    core?.payment_status ||
    'pending'

  const amount = core?.amount ?? data?.amount ?? offer?.amount ?? null
  const payment_method = core?.payment_method || data?.payment_method || offer?.payment_method || 'pix'

  const qrCodeText =
    pix?.qr_code_text ||
    pix?.qrCodeText ||
    pix?.qr_code ||
    pix?.copy_paste ||
    pix?.pix_qr_code ||
    pix?.pix_qrcode ||
    // ✅ seu caso real:
    offer?.pix_qr_code ||
    offer?.pix_qrcode ||
    // outros:
    core?.pix_qr_code ||
    core?.qr_code ||
    data?.pix_qr_code ||
    data?.qr_code ||
    null

  const qrCodeImageBase64 =
    pix?.qr_code_image_base64 ||
    pix?.qrCodeImageBase64 ||
    pix?.qr_code_image ||
    pix?.qr_code_base64 ||
    pix?.qrCodeBase64 ||
    // ✅ seu caso real:
    offer?.qr_code_base64 ||
    offer?.qr_code_image_base64 ||
    // outros:
    core?.qr_code_base64 ||
    data?.qr_code_base64 ||
    null

  const expiresAt =
    pix?.expires_at ||
    pix?.expiresAt ||
    offer?.expires_at ||
    offer?.expiresAt ||
    core?.expires_at ||
    core?.expiresAt ||
    data?.expires_at ||
    data?.expiresAt ||
    null

  return {
    transaction_hash,
    status,
    amount,
    payment_method,
    pix: {
      qrCodeText: qrCodeText ? String(qrCodeText) : null,
      qrCodeImageBase64: qrCodeImageBase64 ? String(qrCodeImageBase64) : null,
      expiresAt,
    },
    // NÃO retornar raw pro front (vaza dados pessoais)
  }
}

/* ===================== POST: CREATE PIX TRANSACTION ===================== */
export async function POST(request: NextRequest) {
  let requestBody: PaymentPayload

  try {
    requestBody = await request.json()

    const { name, email, phone, amount, items, externalId, utmQuery, plan } = requestBody as any

    const apiToken = getTriboPayToken()
    const offerHash = getOfferHash()

    const amountInCents = toCents(amount)
    if (!amountInCents) {
      return NextResponse.json({ error: 'Valor do pagamento inválido.' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Itens do pedido inválidos.' }, { status: 400 })
    }

    const finalCpf = String((requestBody as any).cpf || gerarCPFValido()).replace(/\D/g, '')
    const tracking = buildTracking(utmQuery, externalId ? String(externalId) : undefined)

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

    const cart = items.map((item: any) => ({
      product_hash: item.product_hash || item.hash || item.id || `prod_${Date.now()}`,
      title: item.title || item.name || 'Produto',
      cover: item.cover ?? null,
      price: Math.round(Number(item.unitPrice || item.price || 0) * 100) || amountInCents,
      quantity: Number(item.quantity || 1),
      operation_type: Number(item.operation_type || 1),
      tangible: Boolean(item.tangible ?? false),
    }))

    const customer = buildCustomer(
      {
        name,
        email,
        phone,
        ...(requestBody as any),
      },
      finalCpf,
    )

    const postbackUrl = process.env.TRIBOPAY_POSTBACK_URL || undefined

    const payloadForTriboPay: any = {
      amount: amountInCents,
      offer_hash: offerHash,
      payment_method: 'pix',
      customer,
      cart,
      installments: 1,
      expire_in_days: 1,
      transaction_origin: 'api',
      tracking: {
        src: tracking.src,
        utm_source: tracking.utm_source,
        utm_medium: tracking.utm_medium,
        utm_campaign: tracking.utm_campaign,
        utm_term: tracking.utm_term,
        utm_content: tracking.utm_content,
      },
      ...(postbackUrl ? { postback_url: postbackUrl } : {}),
    }

    const url = `${TRIBOPAY_BASE}/transactions?api_token=${encodeURIComponent(apiToken)}`
    const triboRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payloadForTriboPay),
    })

    const text = await triboRes.text()
    const triboData = safeJsonParse<any>(text) || { raw: text }

    if (!triboRes.ok) {
      // ⚠️ aqui também não devolvo payload completo (pode vir com dados pessoais)
      return NextResponse.json(
        {
          error: triboData?.error || triboData?.message || 'Falha na TriboPay.',
        },
        { status: triboRes.status },
      )
    }

    const normalized = normalizeTriboPayPix(triboData)

    // ✅ GARANTE base64 mesmo se TriboPay não mandar
    const ensuredBase64 = await ensureQrBase64FromText(
      normalized.pix.qrCodeText,
      normalized.pix.qrCodeImageBase64,
    )

    const pixForFront = {
      qrCodeText: normalized.pix.qrCodeText,
      qrCodeImageBase64: ensuredBase64, // ✅ agora não fica null (se qrCodeText existir)
      expiresAt: normalized.pix.expiresAt,
    }

    // ===================== UTMIFY (mantido) =====================
    if (normalized.transaction_hash) {
      const utmParams = utmQuery || {}

      const utmifyPayload: UtmifyOrderPayload = {
        orderId: normalized.transaction_hash,
        platform: 'RecargaJogo',
        paymentMethod: 'pix',
        status: 'waiting_payment',
        createdAt: formatToUtmifyDate(new Date()),
        approvedDate: null,
        refundedAt: null,
        customer: {
          name,
          email,
          phone: onlyDigits(phone || ''),
          document: finalCpf,
          country: 'BR',
          ip,
        },
        products: items.map((item: any) => ({
          id: item.id || `prod_${Date.now()}`,
          name: item.title,
          planId: plan || null,
          planName: plan || null,
          quantity: item.quantity,
          priceInCents: Math.round((item.unitPrice || 0) * 100),
        })),
        trackingParameters: {
          src: utmParams['src'] || utmParams['utm_source'] || null,
          sck: utmParams['sck'] || null,
          utm_source: utmParams['utm_source'] || null,
          utm_campaign: utmParams['utm_campaign'] || null,
          utm_medium: utmParams['utm_medium'] || null,
          utm_content: utmParams['utm_content'] || null,
          utm_term: utmParams['utm_term'] || null,
        },
        commission: {
          totalPriceInCents: amountInCents,
          gatewayFeeInCents: 0,
          userCommissionInCents: amountInCents,
          currency: 'BRL',
        },
        isTest: false,
      }

      try {
        await sendOrderToUtmify(utmifyPayload)
      } catch (utmifyError: any) {
        console.error(`Erro ao enviar pedido pendente ${normalized.transaction_hash} para Utmify:`, utmifyError)
      }
    }

    // ✅ resposta pro front: SOMENTE o necessário (sem producer / sem customer / sem raw)
    return NextResponse.json(
      {
        transaction_hash: normalized.transaction_hash,
        status: normalized.status,
        amount: normalized.amount ?? amountInCents,
        payment_method: 'pix',
        pix: pixForFront,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('[create-payment POST] Erro fatal:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno do servidor.' }, { status: 500 })
  }
}

/* ===================== GET: CHECK STATUS ===================== */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const transactionHash = searchParams.get('transaction_hash') || searchParams.get('hash')

  if (!transactionHash) {
    return NextResponse.json({ error: 'transaction_hash é obrigatório.' }, { status: 400 })
  }

  try {
    const apiToken = getTriboPayToken()

    const tryUrls = [
      `${TRIBOPAY_BASE}/transactions/${encodeURIComponent(transactionHash)}?api_token=${encodeURIComponent(apiToken)}`,
      `${TRIBOPAY_BASE}/transactions?api_token=${encodeURIComponent(apiToken)}&transaction_hash=${encodeURIComponent(
        transactionHash,
      )}`,
    ]

    let lastErr: any = null

    for (const url of tryUrls) {
      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
      const text = await res.text()
      const data = safeJsonParse<any>(text) || { raw: text }

      if (!res.ok) {
        lastErr = { status: res.status }
        continue
      }

      const normalized = normalizeTriboPayPix(data)

      const ensuredBase64 = await ensureQrBase64FromText(
        normalized.pix.qrCodeText,
        normalized.pix.qrCodeImageBase64,
      )

      return NextResponse.json(
        {
          transaction_hash: normalized.transaction_hash || transactionHash,
          status: normalized.status,
          amount: normalized.amount ?? null,
          payment_method: normalized.payment_method || 'pix',
          pix: {
            qrCodeText: normalized.pix.qrCodeText,
            qrCodeImageBase64: ensuredBase64,
            expiresAt: normalized.pix.expiresAt,
          },
          paid_at: (pickCore(data) as any)?.paid_at || (pickCore(data) as any)?.approved_at || null,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ error: 'Falha ao consultar status na TriboPay.', details: lastErr }, { status: 502 })
  } catch (error: any) {
    console.error('[create-payment GET] Erro interno:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno do servidor.' }, { status: 500 })
  }
}
