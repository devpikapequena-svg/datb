import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string
type PlanKey = 'client' | 'empresarial'

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function normalizeStatus(s: any) {
  const v = String(s || '').toLowerCase()
  if (v === 'paid' || v === 'pago') return 'paid'
  if (v === 'pending' || v === 'pendente' || v === 'awaiting' || v === 'waiting_payment') return 'pending'
  if (v === 'canceled' || v === 'cancelled' || v === 'refunded' || v === 'failed') return 'failed'
  return 'unknown'
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as
      | { plan?: PlanKey; transaction_hash?: string; externalId?: string | null }
      | null

    const plan = body?.plan
    const transactionHash = body?.transaction_hash
    const externalId = body?.externalId ?? null

    if (!plan || (plan !== 'client' && plan !== 'empresarial')) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
    }
    if (!transactionHash || typeof transactionHash !== 'string') {
      return NextResponse.json({ error: 'transaction_hash ausente.' }, { status: 400 })
    }

    // ✅ confirma no gateway (server-side) usando seu GET
    const host = req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${proto}://${host}`

    const verifyUrl = `${baseUrl}/api/create-payment?transaction_hash=${encodeURIComponent(transactionHash)}`
    const verifyRes = await fetch(verifyUrl, { method: 'GET', cache: 'no-store' })
    const verifyData = await verifyRes.json().catch(() => null)

    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Não foi possível verificar pagamento.' }, { status: 400 })
    }

    const st = normalizeStatus(verifyData?.status)
    if (st !== 'paid') {
      return NextResponse.json(
        { error: 'Pagamento ainda não confirmado.', status: verifyData?.status },
        { status: 409 },
      )
    }

    await connectDB()

    const user = await User.findById(decoded.id).select('_id plan planLastTransactionHash planPaidAt planExpiresAt')
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    // ✅ idempotência: mesma transação = já aplicado
    if ((user as any).planLastTransactionHash && String((user as any).planLastTransactionHash) === transactionHash) {
      return NextResponse.json({
        ok: true,
        alreadyApplied: true,
        plan: user.plan,
        planPaidAt: (user as any).planPaidAt || null,
        planExpiresAt: (user as any).planExpiresAt || null,
      })
    }

    const now = new Date()
    const expiresAt = addDays(now, 30)

    // ✅ grava garantindo salvar campos extras mesmo se schema não tiver
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          plan,
          planPaidAt: now,
          planExpiresAt: expiresAt,
          planLastTransactionHash: transactionHash,
          planExternalId: externalId,
        },
      },
      { strict: false } as any,
    )

    // lê de volta pra responder certinho
    const updated = await User.findById(user._id).select('plan planPaidAt planExpiresAt')

    return NextResponse.json({
      ok: true,
      plan: updated?.plan || plan,
      planPaidAt: (updated as any)?.planPaidAt || now,
      planExpiresAt: (updated as any)?.planExpiresAt || expiresAt,
    })
  } catch (err) {
    console.error('BILLING ACTIVATE ERROR', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
