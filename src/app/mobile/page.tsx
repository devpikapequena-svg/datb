// src/app/mobile/page.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  KeyRound,
  Database,
  Users,
  Settings,
  Smartphone,
  LogOut,
} from 'lucide-react'

type PlanKey = 'client' | 'empresarial' | 'none'

type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
  image?: string | null
  planPaidAt?: string | null
  planExpiresAt?: string | null
  planActive?: boolean
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
    linkedClients?: string
    resets?: string
  }
}

/* ===== CLEAN (parecido desktop) ===== */
const BG = '#090909'
const PANEL = 'rgba(12, 12, 12, 1)'
const PANEL2 = '#111111ff'
const BORDER = 'rgba(255, 255, 255, 0.06)'
const TEXT_SOFT = 'rgba(255,255,255,0.70)'
const TEXT_MUTED = 'rgba(255,255,255,0.42)'
const ACCENT = '#2FD3B5'
const ICON_BORDER = 'rgba(47,211,181,0.22)'
const ICON_BG = 'rgba(47,211,181,0.14)'

function FullscreenLoader() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center" style={{ background: BG }}>
      <div className="h-10 w-10 rounded-full border border-white/10 border-t-white/50 animate-spin" />
    </main>
  )
}

function normalizePlan(plan?: string): { key: PlanKey; label: string } {
  const p = String(plan || 'none').toLowerCase()
  if (p === 'empresarial') return { key: 'empresarial', label: 'Empresarial' }
  if (p === 'client') return { key: 'client', label: 'Client' }
  return { key: 'none', label: 'Sem plano' }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
function pad2(n: number) {
  return String(n).padStart(2, '0')
}
function formatBRDate(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[12px] border ${className}`} style={{ background: PANEL, borderColor: BORDER }}>
      {children}
    </div>
  )
}

function IconSquare({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-[10px] border"
      style={{ background: ICON_BG, borderColor: ICON_BORDER }}
    >
      {children}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const v = clamp(value, 0, 100)
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full" style={{ width: `${v}%`, background: ACCENT }} />
    </div>
  )
}

export default function MobileHomePage() {
  const router = useRouter()

  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [user, setUser] = useState<UserMe | null>(null)

  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)

  // mobile guard
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // auth
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' })
        if (!res.ok) {
          setUser(null)
          router.replace('/mobile/login')
          return
        }
        setUser(await res.json())
      } catch (e) {
        console.error(e)
        setUser(null)
        router.replace('/mobile/login')
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [router])

  const plan = useMemo(() => normalizePlan(user?.plan), [user?.plan])

  const subscription = useMemo(() => {
    const now = new Date()
    const expiresAt = user?.planExpiresAt ? new Date(user.planExpiresAt) : null
    const paidAtRaw = user?.planPaidAt ? new Date(user.planPaidAt) : null
    const paidAt = paidAtRaw || (expiresAt ? new Date(expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000) : null)

    const isPlanNone = plan.key === 'none'
    const isExpired = !!(expiresAt && expiresAt.getTime() <= now.getTime())
    const isActive = !!(user?.planActive && !isExpired && !isPlanNone)

    let remainingMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0
    if (remainingMs < 0) remainingMs = 0
    const remainingDays = expiresAt ? Math.ceil(remainingMs / (24 * 60 * 60 * 1000)) : 0

    let progressUsed = 0
    if (paidAt && expiresAt) {
      const total = Math.max(1, expiresAt.getTime() - paidAt.getTime())
      const used = clamp(now.getTime() - paidAt.getTime(), 0, total)
      progressUsed = (used / total) * 100
    }

    const statusLabel = isPlanNone ? 'Sem assinatura' : isActive ? 'Ativa' : isExpired ? 'Expirada' : 'Inativa'
    const expiryLine = isPlanNone
      ? 'Sem assinatura ativa.'
      : expiresAt
      ? `Expira em ${formatBRDate(expiresAt)} • ${isExpired ? 0 : remainingDays} dia(s) restantes`
      : 'Sem expiração.'

    return {
      isPlanNone,
      isActive,
      isExpired,
      statusLabel,
      expiryLine,
      progressUsed: clamp(progressUsed, 0, 100),
    }
  }, [user, plan.key])

  // overview
  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        setLoadingOverview(true)
        const res = await fetch('/api/dashboard/overview', { method: 'GET', credentials: 'include' })
        if (!res.ok) {
          setOverview(null)
          return
        }
        setOverview(await res.json())
      } catch (e) {
        console.error(e)
        setOverview(null)
      } finally {
        setLoadingOverview(false)
      }
    }
    load()
  }, [user])

  // guards
  if (isMobile === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white px-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black px-6 py-7 text-center">
          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
            <Smartphone className="h-4 w-4 text-white/70" />
          </div>
          <p className="text-sm font-semibold">Versão mobile</p>
          <p className="mt-2 text-xs text-white/55">
            Essa área é feita para celular. Acesse pelo smartphone ou use o painel no desktop.
          </p>
        </div>
      </main>
    )
  }

  if (loadingUser || isMobile === null) return <FullscreenLoader />
  if (!user) return <FullscreenLoader />

  const o: DashboardOverview =
    overview || {
      role: plan.key === 'client' ? 'client' : 'empresarial',
      projectsTotal: 0,
      collectionsTotal: 0,
      keysActiveTotal: 0,
      linkedClientsTotal: 0,
      resetsToday: 0,
      deltas: {},
    }

  const kpis = [
    { label: 'Projetos', value: o.projectsTotal, icon: FolderKanban, delta: o.deltas?.projects || '' },
    { label: 'Coleções', value: o.collectionsTotal, icon: Database, delta: o.deltas?.collections || '' },
    { label: 'Keys ativas', value: o.keysActiveTotal, icon: KeyRound, delta: o.deltas?.keys || '' },
    {
      label: 'Clientes',
      value: o.role === 'client' ? '—' : o.linkedClientsTotal,
      icon: Users,
      delta: o.role === 'client' ? '' : o.deltas?.linkedClients || '',
    },
  ] as const

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <main className="px-5 pt-6 pb-28">
        {/* header estilo desktop */}
        <div className="mb-5">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Pages <span className="mx-1">/</span> Dashboard
          </p>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[18px] font-semibold leading-tight">Dashboard</p>
              <p className="mt-1 text-[12px] truncate" style={{ color: TEXT_MUTED }}>
                {user.name} • {user.email}
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                } catch {}
                router.replace('/mobile/login')
              }}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border px-3 text-[12px]"
              style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            >
              <LogOut className="h-4 w-4 opacity-80" />
              Sair
            </button>
          </div>
        </div>

        {/* assinatura (desktop-like) */}
        <Card className="p-4">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Assinatura
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold">{plan.label}</p>

            <span
              className="inline-flex items-center rounded-[8px] border px-2 py-[2px] text-[10px] font-semibold"
              style={{
                borderColor: BORDER,
                background: subscription.isActive
                  ? 'rgba(47,211,181,0.10)'
                  : subscription.isExpired
                  ? 'rgba(148,163,184,0.08)'
                  : 'rgba(255,255,255,0.03)',
                color: subscription.isActive
                  ? ACCENT
                  : subscription.isExpired
                  ? 'rgba(203,213,225,0.85)'
                  : TEXT_SOFT,
              }}
            >
              {subscription.statusLabel}
            </span>
          </div>

          <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
            {subscription.expiryLine}
          </p>

          {!subscription.isPlanNone ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px]" style={{ color: TEXT_MUTED }}>
                <span>Progresso do ciclo</span>
                <span>{Math.round(subscription.progressUsed)}%</span>
              </div>
              <ProgressBar value={subscription.progressUsed} />
            </div>
          ) : (
            <div className="mt-3">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-[10px] border px-3 py-2 text-[12px]"
                style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
              >
                Ver planos
              </Link>
            </div>
          )}
        </Card>

        {/* KPIs (CARD NORMAL, SEM CLICK) */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          {kpis.map((k) => {
            const Icon = k.icon
            return (
              <Card key={k.label} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
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
                    <Icon className="h-5 w-5 text-white" />
                  </IconSquare>
                </div>
              </Card>
            )
          })}
        </section>

        {loadingOverview ? (
          <p className="mt-4 text-[11px]" style={{ color: TEXT_MUTED }}>
            Atualizando dados…
          </p>
        ) : null}
      </main>

      {/* bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-[#0b0b0b]" style={{ borderColor: BORDER }}>
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-around px-4 py-5 text-[11px]">
            <Link href="/mobile" className="flex flex-col items-center gap-1 text-white">
              <LayoutDashboard className="h-4 w-4" />
              <span>Home</span>
            </Link>

            <Link href="/mobile/keys" className="flex flex-col items-center gap-1 text-white/60">
              <KeyRound className="h-4 w-4" />
              <span>Keys</span>
            </Link>

            <Link href="/mobile/settings" className="flex flex-col items-center gap-1 text-white/60">
              <Settings className="h-4 w-4" />
              <span>Config</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
