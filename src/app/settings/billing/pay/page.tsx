'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Shield, QrCode, Copy, Loader2, CheckCircle2, X } from 'lucide-react'

/* ===================== TYPES ===================== */
type PlanKey = 'client' | 'empresarial'
type PayStatusUI = 'awaiting' | 'paid' | 'pending' | 'failed'

type StoredContext = {
  plan: PlanKey
  externalId?: string
  transaction_hash: string
  createdAt: string
  amount: number
  customer: { name: string; email: string; phone: string }
  pix?: {
    qrCodeText?: string | null
    qrCodeImageBase64?: string | null
    expiresAt?: string | null
  }
}

/* ===================== THEME ===================== */
const BG = '#090909'
const ACCENT = '#3ECFB0'
const BRAND = 'DataBase'

function normalizeStatus(s: any): PayStatusUI {
  const v = String(s || '').toLowerCase()
  if (v === 'paid' || v === 'pago') return 'paid'
  if (v === 'pending' || v === 'pendente' || v === 'awaiting' || v === 'waiting_payment') return 'pending'
  if (v === 'canceled' || v === 'cancelled' || v === 'refunded' || v === 'failed') return 'failed'
  return 'awaiting'
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function SoftDivider() {
  return (
    <div className="relative my-5 h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

function FullscreenLoader() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center" style={{ background: BG }}>
      <div className="h-10 w-10 rounded-full border border-white/10 border-t-white/50 animate-spin" />
    </main>
  )
}

export default function BillingPayPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const forcePaid = sp.get('forcePaid') === '1'

  const planParam = (sp.get('plan') || '').toLowerCase()
  const plan = (planParam === 'client' || planParam === 'empresarial' ? planParam : null) as PlanKey | null

  const transactionHashQS = sp.get('transaction_hash') || ''

  const [ctx, setCtx] = useState<StoredContext | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [status, setStatus] = useState<PayStatusUI>('awaiting')
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)
  const [redirected, setRedirected] = useState(false)

  // ✅ trava anti-flood: 1x por pagamento (mesmo com re-render)
  const activateOnceRef = useRef(false)

  const pixText = ctx?.pix?.qrCodeText || ''
  const pixImg = ctx?.pix?.qrCodeImageBase64 || ''
  const expiresAt = ctx?.pix?.expiresAt || ''

  const expiresLabel = useMemo(() => {
    if (!expiresAt) return null
    try {
      return new Date(expiresAt).toLocaleString('pt-BR')
    } catch {
      return null
    }
  }, [expiresAt])

  const attemptKey = useMemo(() => {
    const th = ctx?.transaction_hash || ''
    return th ? `billing_activate_attempted:${th}` : ''
  }, [ctx?.transaction_hash])

  /* ===================== LOAD CONTEXT ===================== */
  useEffect(() => {
    if (!plan) {
      router.replace('/plans')
      return
    }

    const raw = sessionStorage.getItem('last_payment_context')
    if (!raw) {
      setErr('Pagamento não encontrado.')
      return
    }

    try {
      const parsed = JSON.parse(raw) as StoredContext
      const th = parsed?.transaction_hash

      if (!parsed || !th || (transactionHashQS && th !== transactionHashQS)) {
        setErr('Pagamento inválido ou expirado.')
        return
      }

      setCtx(parsed)
    } catch {
      setErr('Erro ao carregar pagamento.')
    }
  }, [plan, router, transactionHashQS])

  /* ===================== STATUS (polling ou force) ===================== */
  useEffect(() => {
    const th = ctx?.transaction_hash ?? ''
    if (!th) return

    // ✅ FORCE: não chama create-payment (zera flood)
    if (forcePaid) {
      setStatus('paid')
      setChecking(false)
      return
    }

    let alive = true
    let timer: any = null

    async function tick() {
      try {
        setChecking(true)
        const url = `/api/create-payment?transaction_hash=${encodeURIComponent(th)}`
        const res = await fetch(url, { method: 'GET', credentials: 'include' })
        const data = await res.json().catch(() => null)
        if (!alive) return

        if (res.ok) {
          const next = normalizeStatus(data?.status)
          setStatus(next)

          if (next === 'paid') {
            if (timer) clearInterval(timer)
            timer = null
          }
        }
      } catch {
        // ignore
      } finally {
        if (alive) setChecking(false)
      }
    }

    tick()
    timer = setInterval(tick, 10000)

    return () => {
      alive = false
      if (timer) clearInterval(timer)
    }
  }, [ctx?.transaction_hash, forcePaid])

  /* ===================== ACTIVATE (uma vez por hash) ===================== */
  useEffect(() => {
    if (!ctx) return
    if (status !== 'paid') return
    if (activated) return
    if (activating) return

    // ✅ trava por ref + por sessionStorage (refresh)
    if (activateOnceRef.current) return
    if (attemptKey && sessionStorage.getItem(attemptKey) === '1') return

    activateOnceRef.current = true
    if (attemptKey) sessionStorage.setItem(attemptKey, '1')

    ;(async () => {
      try {
        setActivating(true)
        setErr(null)

        // ✅ AQUI é o fix: manda forcePaid pela QUERY (igual sua API)
        const url = forcePaid ? '/api/billing/activate?forcePaid=1' : '/api/billing/activate'

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            plan: ctx.plan,
            transaction_hash: ctx.transaction_hash,
            externalId: ctx.externalId || null,
          }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          // ✅ se falhar, libera a trava pra tentar de novo
          activateOnceRef.current = false
          if (attemptKey) sessionStorage.removeItem(attemptKey)

          throw new Error(data?.error || 'Falha ao ativar o plano.')
        }

        setActivated(true)
      } catch (e: any) {
        setErr(e?.message || 'Erro ao ativar o plano.')
      } finally {
        setActivating(false)
      }
    })()
  }, [status, ctx, activated, activating, attemptKey, forcePaid])

  /* ===================== REDIRECT ===================== */
  useEffect(() => {
    if (!ctx) return
    if (redirected) return
    if (status !== 'paid') return
    if (!activated) return

    setRedirected(true)

    const qs = new URLSearchParams()
    qs.set('plan', ctx.plan)
    if (ctx.externalId) qs.set('externalId', ctx.externalId)
    qs.set('transaction_hash', ctx.transaction_hash)
    if (forcePaid) qs.set('forcePaid', '1')

    router.replace(`/settings/billing/success?${qs.toString()}`)
  }, [status, ctx, activated, redirected, router, forcePaid])

  async function copyPix() {
    if (!pixText) return
    try {
      await navigator.clipboard.writeText(pixText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setErr('Erro ao copiar.')
    }
  }

  function StatusPill() {
    const base = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px]'

    if (status === 'paid') {
      return (
        <div className={base} style={{ borderColor: `${ACCENT}55`, background: 'rgba(62,207,176,0.12)' }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: ACCENT }} />
          <span className="text-white/85">Pago</span>
        </div>
      )
    }

    if (status === 'failed') {
      return (
        <div className={base} style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.10)' }}>
          <X className="h-4 w-4 text-red-200" />
          <span className="text-red-200">Falhou</span>
        </div>
      )
    }

    if (status === 'pending') {
      return (
        <div className={base} style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
          <Loader2 className="h-4 w-4 animate-spin text-white/60" />
          <span className="text-white/70">Aguardando</span>
        </div>
      )
    }

    return (
      <div className={base} style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
        <QrCode className="h-4 w-4 text-white/55" />
        <span className="text-white/70">Gerado</span>
      </div>
    )
  }

  if (!plan) return null
  if (!ctx && !err) return <FullscreenLoader />

  return (
    <main className="min-h-screen w-full text-white" style={{ background: BG }}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-140px] h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}22, transparent 70%)` }}
        />
      </div>

      <header className="sticky top-0 z-20 w-full border-b border-white/5 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center px-4 md:px-6">
          <button
            type="button"
            onClick={() => router.push(`/settings/billing?plan=${plan}`)}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white/85"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-medium tracking-[-0.01em]">
            <span style={{ color: ACCENT }}>{BRAND}</span>
          </div>

          <div className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-white/55">
            <Shield className="h-4 w-4" style={{ color: ACCENT }} />
            Pagamento seguro
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:mb-8 md:flex-row md:items-end">
          <div>
            <p className="text-[12px] text-white/50">Checkout</p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">Pagamento via PIX</h1>
            <p className="mt-2 max-w-[760px] text-[13px] text-white/55">
              Use o QR Code ou copie o código PIX para concluir a assinatura.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[12px] text-white/55">
              {activating ? 'Ativando plano' : checking ? 'Verificando status' : 'Status'}
            </div>
            <StatusPill />
          </div>
        </div>

        {!ctx ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white/70" />
              <p className="text-[13px] text-white/70">Carregando pagamento</p>
            </div>
            {err && <p className="mt-3 text-[12px] text-red-200">{err}</p>}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[22px] border border-white/10">
              <div className="px-5 pt-5 md:px-6 md:pt-6">
                <p className="text-[14px] font-medium text-white/85">QR Code</p>
                <p className="mt-1 text-[12px] text-white/45">Abra o app do seu banco e escaneie o código.</p>
                <SoftDivider />
              </div>

              <div className="px-5 pb-5 md:px-6 md:pb-6">
                <div className="grid place-items-center rounded-2xl p-5">
                  {pixImg ? (
                    <img
                      alt="QR Code PIX"
                      className="h-[280px] w-[280px] rounded-2xl bg-white p-3"
                      src={pixImg.startsWith('data:image') ? pixImg : `data:image/png;base64,${pixImg}`}
                    />
                  ) : (
                    <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-white/10">
                      <QrCode className="h-10 w-10 text-white/50" />
                    </div>
                  )}
                </div>

                {expiresLabel ? <p className="mt-4 text-[11px] text-white/40">Expira em: {expiresLabel}</p> : null}
                {err ? <p className="mt-4 text-[12px] text-red-300">{err}</p> : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[22px] border border-white/10">
                <div className="p-5 md:p-6">
                  <p className="text-[12px] text-white/60">Código PIX</p>

                  <div className="mt-3 rounded-2xl border border-white/10 p-4">
                    <p className="break-all text-[12px] leading-relaxed text-white/80">{pixText || '-'}</p>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={copyPix}
                      disabled={!pixText}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 text-[13px] transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10">
                <div className="p-5 md:p-6">
                  <p className="text-[12px] text-white/60">Resumo</p>

                  <div className="mt-4">
                    <p className="text-[14px] font-medium text-white/85">{ctx.plan === 'client' ? 'Client' : 'Empresarial'}</p>
                    {ctx.externalId ? <p className="mt-1 text-[12px] text-white/50">ID: {ctx.externalId}</p> : null}
                  </div>

                  <SoftDivider />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-white/60">Total</span>
                      <span className="text-[16px] font-semibold tracking-[-0.02em]" style={{ color: ACCENT }}>
                        {formatBRL(ctx.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-white/60">Transação</span>
                      <span className="max-w-[240px] truncate text-right text-[12px] text-white/80">
                        {ctx.transaction_hash}
                      </span>
                    </div>
                  </div>

                  {status === 'paid' ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[13px] font-medium text-white/85">Pagamento confirmado</p>
                      <p className="mt-1 text-[12px] text-white/55">
                        {activating ? 'Ativando seu plano...' : activated ? 'Plano ativado.' : 'Confirmando assinatura...'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
