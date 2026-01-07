'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Shield, Loader2, Phone, Mail, User as UserIcon, QrCode } from 'lucide-react'

/* ===================== TYPES ===================== */
type PlanKey = 'client' | 'empresarial'

type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
  image?: string | null
}

type PaymentItem = {
  id: string
  title: string
  unitPrice: number
  quantity: number
}

type CreatePaymentRequest = {
  plan: PlanKey
  name: string
  email: string
  phone: string
  amount: number
  items: PaymentItem[]
  externalId?: string
  utmQuery?: Record<string, string>
  cpf?: string
}

type CreatePaymentResponse = {
  transaction_hash?: string
  status?: string
  amount?: number
  payment_method?: 'pix'
  pix?: {
    qrCodeText?: string | null
    qrCodeImageBase64?: string | null
    expiresAt?: string | null
  }
  raw?: any
}

/* ===================== THEME ===================== */
const BG = '#090909'
const ACCENT = '#3ECFB0'
const BRAND = 'DataBase'

function FullscreenLoader() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center" style={{ background: BG }}>
      <div className="h-10 w-10 rounded-full border border-white/10 border-t-white/50 animate-spin" />
    </main>
  )
}

function onlyDigits(s: string) {
  return (s || '').replace(/\D/g, '')
}
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function makeExternalId(prefix: string) {
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase()
  const ts = Date.now().toString(16).toUpperCase()
  return `${prefix}_${ts}_${rand}`
}

function SoftDivider() {
  return (
    <div className="relative my-5 h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  colSpan = 1,
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
  colSpan?: 1 | 2
}) {
  return (
    <label className={`block ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      <span className="mb-2 block text-[12px] font-medium text-white/60">{label}</span>

      <div
        className={[
          'group relative flex items-center gap-2 rounded-2xl border border-white/10',
          'px-3.5 py-3.5',
          'transition',
          'hover:border-white/15',
        ].join(' ')}
      >
        <div className="pointer-events-none text-white/55 transition group-focus-within:text-white/75">{icon}</div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          className="w-full bg-transparent text-[13px] text-white/85 outline-none placeholder:text-white/30"
          placeholder={placeholder}
        />

        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-focus-within:opacity-100">
          <div
            className="absolute -inset-px rounded-2xl"
            style={{
            }}
          />
        </div>
      </div>

      {hint ? <p className="mt-2 text-[11px] text-white/40">{hint}</p> : null}
    </label>
  )
}

export default function BillingPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const planParam = (sp.get('plan') || '').toLowerCase()
  const plan = (planParam === 'client' || planParam === 'empresarial' ? planParam : null) as PlanKey | null

  const planMeta = useMemo(() => {
    const map: Record<PlanKey, { title: string; subtitle: string; price: number; billing: string }> = {
      client: { title: 'Client', subtitle: 'Para operar projetos vinculados', price: 49.9, billing: 'Mensal' },
      empresarial: { title: 'Empresarial', subtitle: 'Para gerenciar tudo', price: 129.9, billing: 'Mensal' },
    }
    return plan ? map[plan] : null
  }, [plan])

  const [fullName, setFullName] = useState('João da Silva')
  const [email, setEmail] = useState('joao@email.com')
  const [phone, setPhone] = useState('(11) 99999-9999')

  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' })
        if (!res.ok) {
          setLoadingUser(false)
          return
        }
        const d = await res.json()
        setUser(d)
        if (d?.name) setFullName(d.name)
        if (d?.email) setEmail(d.email)
      } catch {
        // ignore
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!loadingUser && !plan) router.replace('/plans')
  }, [loadingUser, plan, router])

  function validateBase() {
    setErr(null)

    const nameTrim = fullName.trim()
    const emailTrim = email.trim()
    const phoneDigits = onlyDigits(phone)

    if (!plan || !planMeta) return 'Plano inválido.'
    if (nameTrim.length < 3) return 'Informe seu nome completo.'
    if (!isValidEmail(emailTrim)) return 'Informe um e-mail válido.'
    if (phoneDigits.length < 10) return 'Informe um número válido com DDD.'
    return null
  }

  async function handleGenerate() {
    const baseErr = validateBase()
    if (baseErr) return setErr(baseErr)
    if (!plan || !planMeta) return setErr('Plano inválido.')

    try {
      setSubmitting(true)
      setErr(null)

      const items: PaymentItem[] = [
        { id: `plan_${plan}`, title: `Plano ${planMeta.title}`, unitPrice: planMeta.price, quantity: 1 },
      ]

      const externalId = makeExternalId(`PLAN_${plan.toUpperCase()}`)
      const utmQuery = Object.fromEntries(sp.entries())

      const body: CreatePaymentRequest = {
        plan,
        name: fullName.trim(),
        email: email.trim(),
        phone: onlyDigits(phone),
        amount: planMeta.price,
        items,
        externalId,
        utmQuery,
      }

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = (await res.json().catch(() => null)) as CreatePaymentResponse | any

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.details?.message ||
          data?.details?.errors?.installments?.[0] ||
          'Falha ao criar pagamento.'
        throw new Error(msg)
      }

      const transactionHash = data?.transaction_hash || null
      const qrCodeText = data?.pix?.qrCodeText || null
      const qrCodeImageBase64 = data?.pix?.qrCodeImageBase64 || null
      const expiresAt = data?.pix?.expiresAt || null

      if (!transactionHash) throw new Error('A TriboPay não retornou transaction_hash.')
      if (!qrCodeText && !qrCodeImageBase64) throw new Error('A TriboPay não retornou QR Code.')

      sessionStorage.setItem(
        'last_payment_context',
        JSON.stringify({
          plan,
          externalId,
          transaction_hash: transactionHash,
          createdAt: new Date().toISOString(),
          amount: planMeta.price,
          customer: { name: fullName.trim(), email: email.trim(), phone: onlyDigits(phone) },
          pix: { qrCodeText, qrCodeImageBase64, expiresAt },
        }),
      )

      router.push(
        `/settings/billing/pay?plan=${plan}&externalId=${encodeURIComponent(externalId)}&transaction_hash=${encodeURIComponent(
          transactionHash,
        )}`,
      )
    } catch (e: any) {
      console.error(e)
      setErr(e?.message || 'Erro ao gerar pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingUser) return <FullscreenLoader />
  if (!plan || !planMeta) return <FullscreenLoader />

  return (
    <main className="min-h-screen w-full text-white" style={{ background: BG }}>
      {/* BACKGROUND ACCENTS */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-140px] h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}22, transparent 70%)` }}
        />
        <div className="absolute inset-0" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-20 w-full border-b border-white/5 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center px-4 md:px-6">
          <button
            type="button"
            onClick={() => router.push('/plans')}
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

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 md:mb-8">
          <p className="text-[12px] text-white/50">Checkout</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">
            Concluir assinatura do plano{' '}
            <span style={{ color: ACCENT }} className="font-semibold">
              {planMeta.title}
            </span>
          </h1>
          <p className="mt-2 max-w-[760px] text-[13px] text-white/55">
            Informe os dados do comprador para gerar o pagamento via PIX.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT */}
          <div className="rounded-[22px] border border-white/10 ">
            <div className="px-5 pt-5 md:px-6 md:pt-6">
              <p className="text-[14px] font-medium text-white/85">Dados do comprador</p>
              <p className="mt-1 text-[12px] text-white/45">Os dados abaixo serão usados para identificar a cobrança.</p>
              <SoftDivider />
            </div>

            <div className="px-5 pb-5 md:px-6 md:pb-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome"
                  icon={<UserIcon className="h-4 w-4" />}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Seu nome completo"
                />
                <Field
                  label="E-mail"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={setEmail}
                  placeholder="seuemail@dominio.com"
                  type="email"
                />
                <Field
                  label="Telefone"
                  icon={<Phone className="h-4 w-4" />}
                  value={phone}
                  onChange={setPhone}
                  placeholder="(11) 99999-9999"
                  hint="Use DDD + número."
                  colSpan={2}
                />
              </div>

              {err && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-[12px] text-red-200">{err}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={submitting}
                  className={[
                    'inline-flex h-11 items-center justify-center gap-2 rounded-2xl',
                    'bg-white px-5 text-[13px] font-medium text-black',
                    'transition hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed',
                  ].join(' ')}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando PIX
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Gerar PIX
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="rounded-[22px] border border-white/10">
            <div className="p-5 md:p-6">
              <p className="text-[12px] text-white/60">Resumo</p>

              <div className="mt-4">
                <p className="text-[14px] font-medium text-white/85">{planMeta.title}</p>
                <p className="mt-1 text-[12px] text-white/50">{planMeta.subtitle}</p>
              </div>

              <SoftDivider />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/60">Cobrança</span>
                  <span className="text-[12px] text-white/80">{planMeta.billing}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/60">Método</span>
                  <span className="text-[12px] text-white/80">PIX</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/60">Subtotal</span>
                  <span className="text-[12px] text-white/80">{formatBRL(planMeta.price)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/60">Taxas</span>
                  <span className="text-[12px] text-white/80">{formatBRL(0)}</span>
                </div>

                <div className="pt-2">
                  <div className="h-px w-full bg-white/10" />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[12px] text-white/60">Total</span>
                  <span className="text-[16px] font-semibold tracking-[-0.02em]" style={{ color: ACCENT }}>
                    {formatBRL(planMeta.price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
