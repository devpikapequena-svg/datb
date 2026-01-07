// src/app/settings/billing/success/page.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Shield, CheckCircle2, Copy, Loader2 } from 'lucide-react'

/* ===================== TYPES ===================== */
type PlanKey = 'client' | 'empresarial'
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

export default function BillingSuccessPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const planParam = (sp.get('plan') || '').toLowerCase()
  const plan = (planParam === 'client' || planParam === 'empresarial' ? planParam : null) as PlanKey | null
  const transactionHashQS = sp.get('transaction_hash') || ''
  const externalIdQS = sp.get('externalId') || ''

  const [ctx, setCtx] = useState<StoredContext | null>(null)
  const [copied, setCopied] = useState(false)

  const planLabel = useMemo(() => {
    if (!plan) return ''
    return plan === 'client' ? 'Client' : 'Empresarial'
  }, [plan])

  useEffect(() => {
    // tenta pegar o contexto salvo pra exibir resumo
    const raw = sessionStorage.getItem('last_payment_context')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as StoredContext
      if (!parsed?.transaction_hash) return

      // se tiver QS, valida
      if (transactionHashQS && parsed.transaction_hash !== transactionHashQS) return
      if (plan && parsed.plan !== plan) return

      setCtx(parsed)
    } catch {
      // ignore
    }
  }, [plan, transactionHashQS])

  async function copyHash() {
    const v = ctx?.transaction_hash || transactionHashQS
    if (!v) return
    try {
      await navigator.clipboard.writeText(v)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  if (!plan) return <FullscreenLoader />

  const amount = ctx?.amount
  const customerName = ctx?.customer?.name || ''
  const customerEmail = ctx?.customer?.email || ''
  const externalId = ctx?.externalId || externalIdQS
  const hash = ctx?.transaction_hash || transactionHashQS

  return (
    <main className="min-h-screen w-full text-white" style={{ background: BG }}>
      {/* BACKGROUND ACCENTS */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-140px] h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}22, transparent 70%)` }}
        />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-20 w-full border-b border-white/5 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center px-4 md:px-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
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
            Pagamento confirmado
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-[1100px] px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-[780px]">
          {/* HERO CARD */}
          <div className="rounded-[22px] border border-white/10 p-6 md:p-8">
            <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="grid h-12 w-12 place-items-center"
                >
                  <CheckCircle2 className="h-6 w-6" style={{ color: ACCENT }} />
                </div>

                <div>
                  <p className="text-[12px] text-white/55">Checkout</p>
                  <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">
                    Assinatura ativada
                  </h1>
                  <p className="mt-2 text-[13px] text-white/55">
                    Plano{' '}
                    <span className="font-medium" style={{ color: ACCENT }}>
                      {planLabel}
                    </span>{' '}
                    confirmado.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-6 text-[13px] font-medium text-black transition hover:bg-white/90 md:w-auto"
                >
                  Ir para o painel
                </button>
              </div>
            </div>

            <SoftDivider />

            {/* SUMMARY GRID */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-[12px] text-white/60">Plano</p>
                <p className="mt-1 text-[14px] font-medium text-white/85">{planLabel}</p>
                {amount != null ? (
                  <p className="mt-1 text-[12px] text-white/50">Total: {formatBRL(amount)}</p>
                ) : (
                  <p className="mt-1 text-[12px] text-white/50">Total confirmado</p>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-[12px] text-white/60">Cliente</p>
                <p className="mt-1 text-[14px] font-medium text-white/85">{customerName || 'Conta'}</p>
                <p className="mt-1 text-[12px] text-white/50">{customerEmail || 'E-mail registrado'}</p>
              </div>

              <div className="rounded-2xl border border-white/10 p-4 md:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] text-white/60">Transação</p>
                    <p className="mt-1 break-all text-[12px] leading-relaxed text-white/80">{hash || '-'}</p>
                    {externalId ? <p className="mt-2 text-[12px] text-white/50">ID: {externalId}</p> : null}
                  </div>

                  <button
                    onClick={copyHash}
                    disabled={!hash}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white/80 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
