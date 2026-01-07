// src/app/plans/page.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Check, X, User, Crown } from 'lucide-react'

/* ===================== TYPES ===================== */
type PlanKey = 'client' | 'empresarial'

type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
  image?: string | null
}

/* ===================== THEME (same as dashboard) ===================== */
const BG = '#090909'
const ACCENT = '#3ECFB0'

function FullscreenLoader() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center" style={{ background: BG }}>
      <div className="h-10 w-10 rounded-full border border-white/10 border-t-white/50 animate-spin" />
    </main>
  )
}

function formatBRLFromCents(cents: number) {
  const v = Math.max(0, Number.isFinite(cents) ? cents : 0) / 100
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PlansPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [planModal, setPlanModal] = useState<PlanKey | null>(null)

  // load user
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' })
        if (!res.ok) {
          router.replace('/login')
          return
        }
        const d = await res.json()
        setUser(d)
      } catch (e) {
        console.error('Erro ao carregar usuário', e)
        router.replace('/login')
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [router])

  const plans = useMemo(
    () => ({
      client: {
        title: 'Client',
        subtitle: 'Para operar projetos vinculados',
        icon: User,

        // ✅ PREÇO / MÊS
        priceCents: 4990,
        priceSuffix: '/mês',

        cta: { label: 'Assinar Client', href: '/settings/billing?plan=client' },
        details: [
          'Acessar projetos em que você foi vinculado',
          'Visualizar coleções liberadas no projeto',
          'Gerenciar keys dos projetos vinculados',
          'Gerar keys nos projetos vinculados',
          'Vincular HWID, resetar HWID e remover acessos',
          'Acompanhar status e atualizações no painel',
        ],
        modalIntro:
          'Ideal para quem participa de projetos e precisa operar as keys e acessos com segurança.',
      },
      empresarial: {
        title: 'Empresarial',
        subtitle: 'Para gerenciar tudo',
        icon: Crown,

        // ✅ PREÇO / MÊS
        priceCents: 12990,
        priceSuffix: '/mês',

        cta: { label: 'Assinar Empresarial', href: '/settings/billing?plan=empresarial' },
        details: [
          'Criar e gerenciar projetos',
          'Criar, editar e integrar coleções em projetos',
          'Vincular banco de dados para puxar coleções automaticamente',
          'Gerar e gerenciar keys com regras avançadas e controle total',
          'Vincular clientes a projetos e coleções',
          'Fluxo completo de controle de acesso (HWID, status e mais)',
        ],
        limits: [],
        modalIntro:
          'Para quem precisa criar projetos, integrar coleções via banco e controlar todo o ecossistema.',
      },
    }),
    [],
  )

  const modalPlan = planModal ? plans[planModal] : null

  const currentPlanRaw = String(user?.plan || 'none').toLowerCase()
  const currentPlan: PlanKey | 'none' =
    currentPlanRaw === 'client' ? 'client' : currentPlanRaw === 'empresarial' ? 'empresarial' : 'none'

  if (loadingUser) return <FullscreenLoader />

  return (
    <div className="flex min-h-screen text-white" style={{ background: BG }}>
      <Sidebar user={user || { id: '', name: '', email: '' }} />

      <main className="ml-64 w-full px-10 py-8">
        {/* header */}
        <div className="mb-8">
          <p className="text-[11px] text-white/40">
            Pages <span className="mx-1">/</span> Plans
          </p>

          <div className="mt-2 flex items-end justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white/90">Planos</h1>
              <p className="mt-1 max-w-[820px] text-[12px] leading-relaxed text-white/50">
                Escolha o plano ideal pro seu perfil. O <b className="text-white/80">Client</b> opera projetos em que
                foi vinculado. O <b className="text-white/80">Empresarial</b> cria projetos, integra banco e controla
                tudo.
              </p>
            </div>
          </div>
        </div>

        {/* plans */}
        <section className="mx-auto max-w-7xl pb-32 pt-2">
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {(['client', 'empresarial'] as PlanKey[]).map((key) => {
              const p = plans[key]
              const Icon = p.icon
              const isCurrent = currentPlan !== 'none' && currentPlan === key

              return (
                <div
                  key={key}
                  className={[
                    'relative rounded-[18px] border border-white/10',
                    'bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]',
                    'overflow-hidden',
                    'flex flex-col',
                    'min-h-[520px]',
                  ].join(' ')}
                >
                  {/* header */}
                  <div className="relative px-7 pt-7">
                    <div className="flex items-start gap-4">
                      <div className="grid h-11 w-11 place-items-center">
                        <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[16px] tracking-[-0.01em] text-white/90">{p.title}</p>
                          {isCurrent && (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/70">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[12px] text-white/50">{p.subtitle}</p>
                      </div>

                      {/* ✅ PRICE */}
                      <div className="text-right">
                        <p className="text-[18px] font-semibold tracking-[-0.02em] text-white/90">
                          {formatBRLFromCents(p.priceCents)}
                        </p>
                        <p className="text-[11px] text-white/45">{p.priceSuffix}</p>
                      </div>
                    </div>

                    <div className="mt-6 h-px w-full bg-white/10" />
                  </div>

                  {/* content */}
                  <div className="relative flex-1 px-7 py-6">
                    <p className="text-[12px] leading-relaxed text-white/50">{p.modalIntro}</p>

                    <div className="mt-5 space-y-3">
                      {p.details.map((t) => (
                        <div key={t} className="flex items-center gap-2.5">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0">
                            <Check className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                          </span>
                          <span className="text-[13px] leading-relaxed text-white/75">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* footer buttons */}
                  <div className="relative px-7 pb-7 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPlanModal(key)}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[13px] text-white/85 hover:bg-white/[0.05]"
                      >
                        Ver detalhes
                      </button>

                      {isCurrent ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-white/70 text-[13px] font-medium text-black/70 cursor-not-allowed"
                        >
                          Plano atual
                        </button>
                      ) : (
                        <Link
                          href={p.cta.href}
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-white text-[13px] font-medium text-black hover:bg-white/90"
                        >
                          {p.cta.label}
                        </Link>
                      )}
                    </div>

                    <p className="mt-3 text-[11px] text-white/40">
                      Cobrança recorrente mensal. Você pode cancelar quando quiser.
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-10 text-center text-[12px] text-white/45">
            O acesso sempre respeita as permissões do seu perfil.
          </p>
        </section>

        {/* ====================== MODAL DETALHES ====================== */}
        {modalPlan && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setPlanModal(null)} aria-hidden="true" />
            <div className="relative w-full max-w-[780px] rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[16px] text-white/90">{modalPlan.title}</p>
                  <p className="mt-1 text-[12px] text-white/50">{modalPlan.subtitle}</p>

                  {/* ✅ PRICE in modal */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-[22px] font-semibold tracking-[-0.02em] text-white/90">
                      {formatBRLFromCents(modalPlan.priceCents)}
                    </p>
                    <p className="text-[12px] text-white/45">{modalPlan.priceSuffix}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPlanModal(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                >
                  <X className="h-4 w-4 text-white/80" />
                </button>
              </div>

              <div className="mt-5 h-px w-full bg-white/10" />

              <div className="mt-5">
                <p className="text-[12px] leading-relaxed text-white/55">{modalPlan.modalIntro}</p>

                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-[12px] text-white/70">Inclui</p>
                    <div className="mt-3 space-y-2.5">
                      {modalPlan.details.map((t) => (
                        <div key={t} className="flex items-start gap-2.5">
                          <Check className="mt-[2px] h-4 w-4" style={{ color: ACCENT }} />
                          <span className="text-[13px] leading-relaxed text-white/75">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setPlanModal(null)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 text-[13px] text-white/85 hover:bg-white/[0.05]"
                  >
                    Fechar
                  </button>

                  <Link
                    href={planModal === 'client' ? '/settings/billing?plan=client' : '/settings/billing?plan=empresarial'}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[13px] font-medium text-black hover:bg-white/90"
                  >
                    {planModal === 'client' ? 'Ir para checkout (Client)' : 'Ir para checkout (Empresarial)'}
                  </Link>
                </div>

                <p className="mt-4 text-[11px] text-white/40">
                  Valores em BRL. Cobrança recorrente mensal.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
