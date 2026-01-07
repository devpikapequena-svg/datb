// src/app/dashboard/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import {
  ArrowUpRight,
  KeyRound,
  FolderKanban,
  Database,
  Users,
  RefreshCw,
  ShieldCheck,
  Gift,
  Sparkles,
} from 'lucide-react'

type UserMe = {
  id: string
  name: string
  email: string
  image?: string | null
  plan?: 'client' | 'empresarial' | 'none' | string
  planPaidAt?: string | null
  planExpiresAt?: string | null
  planActive?: boolean
}

type Announcement = {
  id: string
  title: string
  subtitle: string
  when: string
  authorName: string
  authorAvatar?: string | null
  ctaLabel?: string
  ctaHref?: string
}

type GiveawayStatus = 'live' | 'soon' | 'ended'
type Giveaway = {
  id: string
  title: string
  prize: string
  status: GiveawayStatus
  endsInLabel: string
  progress: number // 0..100
  joined?: boolean
}

type DashboardOverview = {
  role: 'client' | 'empresarial'
  projectsTotal: number
  linkedClientsTotal: number
  collectionsTotal: number
  keysActiveTotal: number
  resetsToday: number
  deltas?: {
    projects?: string
    collections?: string
    keys?: string
    resets?: string
    linkedClients?: string
  }
  announcements: Announcement[]
  giveaways: Giveaway[]
}

/* =============== CLEAN THEME =============== */
const BG = '#090909'
const PANEL = 'rgba(12, 12, 12, 1)'
const PANEL2 = '#111111ff'
const BORDER = 'rgba(255, 255, 255, 0.03)'
const TEXT_SOFT = 'rgba(255,255,255,0.62)'
const TEXT_MUTED = 'rgba(255,255,255,0.42)'
const ACCENT = '#3ECFB0'
const DETAILS = '#ffffffff'
const ICON_BG = '#3ECFB0'
const ICON_BORDER = 'rgba(56,214,167,0.22)'

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}
function formatBRDate(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function FullscreenLoader() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center" style={{ background: BG }}>
      <div className="h-10 w-10 rounded-full border border-white/10 border-t-white/50 animate-spin" />
    </main>
  )
}

function IconSquare({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-[8px] border"
      style={{ background: ICON_BG, borderColor: ICON_BORDER }}
    >
      {children}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[8px] border ${className}`}
      style={{ background: PANEL, borderColor: BORDER, boxShadow: 'none' }}
    >
      {children}
    </div>
  )
}

function ProgressBar({ value, dimmed }: { value: number; dimmed?: boolean }) {
  const p = clamp(value, 0, 100)
  return (
    <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${p}%`,
          background: dimmed ? 'rgba(148,163,184,0.50)' : ACCENT,
        }}
      />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  const role = useMemo(() => {
    if (!user) return 'empresarial'
    return user.plan === 'client' ? 'client' : 'empresarial'
  }, [user])

  /* ===================== SUBSCRIPTION (sempre antes do return) ===================== */
  const subscription = useMemo(() => {
    const plan = (user?.plan || 'none') as string
    const now = new Date()

    const expiresAt = user?.planExpiresAt ? new Date(user.planExpiresAt) : null
    const paidAtRaw = user?.planPaidAt ? new Date(user.planPaidAt) : null

    // fallback se paidAt vier null: assume ciclo de 30d antes do expires
    const paidAt =
      paidAtRaw || (expiresAt ? new Date(expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000) : null)

    const isPlanNone = !plan || plan === 'none'
    const isExpired = !!(expiresAt && expiresAt.getTime() <= now.getTime())
    const isActive = !!(user?.planActive && !isExpired && !isPlanNone)

    let remainingMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0
    if (remainingMs < 0) remainingMs = 0
    const remainingDays = expiresAt ? Math.ceil(remainingMs / (24 * 60 * 60 * 1000)) : 0

    // progresso do ciclo (0..100 usado)
    let progressUsed = 0
    if (paidAt && expiresAt) {
      const total = Math.max(1, expiresAt.getTime() - paidAt.getTime())
      const used = clamp(now.getTime() - paidAt.getTime(), 0, total)
      progressUsed = (used / total) * 100
    }

    const planLabel = plan === 'client' ? 'Client' : plan === 'empresarial' ? 'Empresarial' : 'Sem plano'
    const statusLabel = isPlanNone ? 'Sem assinatura' : isActive ? 'Ativa' : isExpired ? 'Expirada' : 'Inativa'

    return {
      plan,
      planLabel,
      isPlanNone,
      isActive,
      isExpired,
      statusLabel,
      paidAt,
      expiresAt,
      remainingDays,
      progressUsed: clamp(progressUsed, 0, 100),
    }
  }, [user])

  // ===== AUTH GUARD / USER =====
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' })
        if (!res.ok) {
          router.replace('/login')
          return
        }
        const data = await res.json()
        setUser(data)
      } catch (e) {
        console.error('Erro ao carregar usuário', e)
        router.replace('/login')
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [router])

  // ===== load overview (REAL) =====
  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        setOverviewError(null)
        setLoadingOverview(true)

        const res = await fetch('/api/dashboard/overview', { method: 'GET', credentials: 'include' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || 'Falha ao carregar overview.')
        }

        setOverview(await res.json())
      } catch (e: any) {
        console.error('Erro ao carregar overview', e)
        setOverview(null)
        setOverviewError(e?.message || 'Erro ao carregar overview.')
      } finally {
        setLoadingOverview(false)
      }
    }

    load()
  }, [user])

  if (loadingUser) return <FullscreenLoader />

  // ✅ texto arrumado (nunca mais cola)
  const expiryLine = subscription.isPlanNone
    ? 'Sem assinatura ativa.'
    : subscription.expiresAt
    ? `Expira em ${formatBRDate(subscription.expiresAt)} • ${
        subscription.isExpired ? 0 : subscription.remainingDays
      } dia(s) restantes`
    : 'Sem expiração.'

  const cyclePct = Math.round(subscription.progressUsed)
  const dimmed = subscription.isPlanNone || subscription.isExpired

  // Overview “safe” (nada fake: se não carregou, fica 0 / vazio)
  const o: DashboardOverview = overview || {
    role: role as any,
    projectsTotal: 0,
    collectionsTotal: 0,
    keysActiveTotal: 0,
    resetsToday: 0,
    linkedClientsTotal: 0,
    deltas: {},
    announcements: [
      {
        id: 'n1',
        title: 'Update — Sistema de geração de keys adicionado',
        subtitle:
          'Novo sistema de geração de keys disponível. Agora é possível criar e gerenciar keys com mais agilidade e controle no painel.',
        when: 'Hoje',
        authorName: 'Equipe',
        authorAvatar: '/avatar.jpg',
        ctaLabel: 'Abrir keys',
        ctaHref: '/keys',
      },
    ],
    giveaways: [],
  }

  return (
    <div className="flex min-h-screen text-white" style={{ background: BG }}>
      <Sidebar user={user || { id: '', name: '', email: '' }} />

      <main className="px-6 py-7 md:px-10 md:py-8 md:ml-64 w-full">
        {/* header */}
        <div className="mb-6">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Pages <span className="mx-1">/</span> Dashboard
          </p>

          <div className="mt-1 flex items-center justify-between gap-4">
            <h1 className="text-[18px] font-semibold">Dashboard</h1>

            <div className="flex items-center gap-2">
              <Link
                href="/keys"
                className="inline-flex items-center gap-2 px-3 py-2 text-[12px]"
                style={{ color: TEXT_SOFT }}
              >
                <KeyRound className="h-4 w-4" style={{ color: DETAILS }} />
                Keys
                <ArrowUpRight className="h-4 w-4 opacity-70" />
              </Link>

              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-3 py-2 text-[12px]"
                style={{ color: TEXT_SOFT }}
              >
                <FolderKanban className="h-4 w-4" style={{ color: DETAILS }} />
                Projects
              </Link>
            </div>
          </div>
        </div>

        {/* ✅ ASSINATURA */}
        <section className="mb-4">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  Assinatura
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-[14px]">{subscription.planLabel}</p>

                  <span
                    className="inline-flex items-center rounded-lg border px-2 py-[2px] text-[10px] font-semibold"
                    style={{
                      borderColor: BORDER,
                      background: subscription.isActive
                        ? 'rgba(62,207,176,0.10)'
                        : subscription.isExpired
                        ? 'rgba(148,163,184,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      color: subscription.isActive
                        ? ACCENT
                        : subscription.isExpired
                        ? 'rgba(148,163,184,0.85)'
                        : TEXT_SOFT,
                    }}
                  >
                    {subscription.statusLabel}
                  </span>
                </div>

                <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
                  {expiryLine}
                </p>

                {!subscription.isPlanNone ? (
                  <div className="mt-3 max-w-[520px]">
                    <div className="flex items-center justify-between text-[11px]" style={{ color: TEXT_MUTED }}>
                      <span>Progresso do ciclo</span>
                      <span>{cyclePct}%</span>
                    </div>
                    <ProgressBar value={subscription.progressUsed} dimmed={dimmed} />
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </section>

        {/* erro overview */}
        {overviewError ? (
          <p className="mb-4 text-[11px]" style={{ color: 'rgba(248,113,113,0.9)' }}>
            {overviewError}
          </p>
        ) : null}

        {/* KPIs (REAIS) */}
        <section className="grid gap-4 md:grid-cols-4 mb-6">
          {[
            { label: "Today's Projects", value: o.projectsTotal, icon: FolderKanban, delta: o.deltas?.projects || '' },
            { label: "Today's Collections", value: o.collectionsTotal, icon: Database, delta: o.deltas?.collections || '' },
            { label: 'Active Keys', value: o.keysActiveTotal, icon: KeyRound, delta: o.deltas?.keys || '' },
            {
              label: 'Linked Clients',
              value: role === 'client' ? '—' : o.linkedClientsTotal,
              icon: Users,
              delta: role === 'client' ? '' : o.deltas?.linkedClients || '',
            },
          ].map((k, idx) => {
            const Icon = k.icon
            return (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      {k.label}
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <p className="text-[18px] font-semibold">{k.value as any}</p>
                      {k.delta ? (
                        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                          {k.delta}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <IconSquare>
                    <Icon className="h-5 w-5" style={{ color: DETAILS }} />
                  </IconSquare>
                </div>
              </Card>
            )
          })}
        </section>

        {/* GRID: ANÚNCIOS + SORTEIOS */}
        <section className="grid gap-4 lg:grid-cols-3 items-start">
          {/* ANÚNCIOS */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">Anúncios</p>
                  <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                    Avisos e updates do painel.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.03]">
              {o.announcements.map((n) => {
                const avatar = n.authorAvatar || '/avatar.jpg'
                return (
                  <div key={n.id} className="px-5 py-4 hover:bg-white/[0.02] transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate">{n.title}</p>
                        <p className="mt-2 text-[12px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                          {n.subtitle}
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-full overflow-hidden border"
                            style={{ borderColor: BORDER, background: PANEL2 }}
                          >
                            <img src={avatar} alt={n.authorName} className="h-full w-full object-cover" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[12px] truncate" style={{ color: TEXT_SOFT }}>
                              {n.authorName}
                            </p>
                            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                              {n.when}
                            </p>
                          </div>
                        </div>
                      </div>

                      {n.ctaHref ? (
                        <Link
                          href={n.ctaHref}
                          className="shrink-0 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                          style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                        >
                          {n.ctaLabel || 'Abrir'}
                          <ArrowUpRight className="h-4 w-4 opacity-70" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* SORTEIOS (SEM ATIVOS) */}
          <Card className="overflow-hidden self-start max-h-[520px]">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <div>
                <p className="text-[13px] font-semibold">Sorteios</p>
                <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                  Sem sorteios ativos no momento.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                <ShieldCheck className="h-4 w-4" style={{ color: ACCENT }} />
                seguro
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center">
                  <Gift className="h-5 w-5" style={{ color: ACCENT }} />
                </div>

                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">Nenhum sorteio ativo</p>
                  <p className="mt-1 text-[12px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                    No momento não há campanhas de sorteio disponíveis. Quando tivermos novidades, elas vão aparecer aqui.
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                    <Sparkles className="h-4 w-4" />
                    Acompanhe os anúncios para updates.
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="mt-4 w-full rounded-xl border px-3 py-2 text-[12px]"
                style={{
                  borderColor: BORDER,
                  background: PANEL2,
                  color: TEXT_MUTED,
                  cursor: 'not-allowed',
                }}
              >
                Em breve
              </button>
            </div>
          </Card>
        </section>

        {loadingOverview && (
          <p className="mt-5 text-[11px]" style={{ color: TEXT_MUTED }}>
            Atualizando dados…
          </p>
        )}
      </main>
    </div>
  )
}
