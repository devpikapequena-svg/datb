// src/app/mobile/keys/page.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  KeyRound,
  Settings,
  Smartphone,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Key as KeyIcon,
  RotateCcw,
  Trash2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react'

/* ===================== TYPES ===================== */
type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
  image?: string | null
}

type KeyStatus = 'active' | 'expired'

type KeyRow = {
  id: string
  key: string
  hwid: string
  status: KeyStatus
  updatedAt: string
}

type KeysResponse = {
  role: 'client' | 'empresarial'
  keys: KeyRow[]
}

/* ===================== THEME ===================== */
const BG = '#090909'
const PANEL = 'rgba(12, 12, 12, 1)'
const PANEL2 = '#111111ff'
const BORDER = 'rgba(255, 255, 255, 0.06)'
const TEXT_SOFT = 'rgba(255,255,255,0.70)'
const TEXT_MUTED = 'rgba(255,255,255,0.42)'
const ACCENT = '#2FD3B5'
const DETAILS = '#ffffffff'
const DANGER = 'rgba(248,113,113,0.95)'

/* ===================== HELPERS ===================== */
function normalizeRoleFromPlan(plan?: string): 'client' | 'empresarial' {
  const p = (plan || 'none').toLowerCase()
  return p === 'empresarial' ? 'empresarial' : 'client'
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy} • ${hh}:${mi}`
  } catch {
    return iso
  }
}

function statusDot(status: KeyStatus) {
  return status === 'active' ? ACCENT : 'rgba(148,163,184,0.85)'
}

function statusLabel(status: KeyStatus) {
  return status === 'active' ? 'Ativa' : 'Expirada'
}

function maskHWID(hwid: string) {
  if (!hwid) return '—'
  const maxLen = 22
  const half = Math.ceil(hwid.length / 2)
  const masked = hwid.slice(0, half) + '*'.repeat(Math.max(0, hwid.length - half))
  return masked.length > maxLen ? masked.slice(0, maxLen) + '…' : masked
}

/* ===================== UI PRIMITIVES ===================== */
function FullscreenLoader() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center" style={{ background: BG }}>
      <div className="h-10 w-10 rounded-full border border-white/10 border-t-white/50 animate-spin" />
    </main>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[12px] border ${className}`} style={{ background: PANEL, borderColor: BORDER }}>
      {children}
    </div>
  )
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const el = ref.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) onClose()
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onEsc)
    }
  }, [open, onClose])

  return ref
}

function Dropdown({
  valueLabel,
  children,
  open,
  setOpen,
  label,
}: {
  valueLabel: string
  children: React.ReactNode
  open: boolean
  setOpen: (v: boolean) => void
  label?: string
}) {
  const ref = useOutsideClose(open, () => setOpen(false))
  return (
    <div className="relative" ref={ref}>
      {label ? (
        <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
          {label}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-[40px] w-[150px] inline-flex items-center justify-between gap-2 rounded-[10px] border px-3 text-[12px]"
        style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
      >
        <span className="truncate">{valueLabel}</span>
        <ChevronDown className="h-4 w-4" style={{ color: TEXT_MUTED }} />
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[180px] overflow-hidden rounded-[10px] border"
          style={{ borderColor: BORDER, background: PANEL }}
        >
          <div className="p-1">{children}</div>
        </div>
      ) : null}
    </div>
  )
}

function DropItem({
  label,
  active,
  onClick,
  right,
}: {
  label: string
  active?: boolean
  onClick: () => void
  right?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[8px] px-3 py-2 text-left text-[12px]"
      style={{
        background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: active ? DETAILS : TEXT_SOFT,
      }}
      onMouseEnter={(e) => {
        if (active) return
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
      }}
      onMouseLeave={(e) => {
        if (active) return
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate">{label}</span>
        {right ? <span className="shrink-0">{right}</span> : null}
      </div>
    </button>
  )
}

/* ===================== MODALS ===================== */
function LockedModal({
  open,
  onClose,
  onUpgrade,
}: {
  open: boolean
  onClose: () => void
  onUpgrade: () => void
}) {
  const wrapRef = useOutsideClose(open, onClose)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.68)' }} onClick={onClose} />

      <div
        ref={wrapRef}
        className="relative z-[96] w-full max-w-[360px] rounded-[12px] border"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              Acesso / Recurso bloqueado
            </p>
            <p className="mt-2 text-[14px] font-semibold">Upgrade necessário</p>
            <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
              Para resetar HWID ou remover chaves, faça upgrade do seu plano.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border p-2"
            style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-[10px] border px-3 py-2 text-[12px]"
              style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            >
              Agora não
            </button>

            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex flex-1 items-center justify-center rounded-[10px] border px-3 py-2 text-[12px]"
              style={{ borderColor: 'rgba(47,211,181,0.18)', background: 'rgba(47,211,181,0.12)', color: DETAILS }}
            >
              Fazer upgrade
            </button>
          </div>

          <p className="mt-3 text-[11px]" style={{ color: TEXT_MUTED }}>
            Você pode visualizar as informações, mas ações de edição ficam indisponíveis no plano atual.
          </p>
        </div>
      </div>
    </div>
  )
}

function KeyManageModal({
  open,
  onClose,
  keyItem,
  locked,
  onResetHWID,
  onRemoveKey,
  onNeedUpgrade,
}: {
  open: boolean
  onClose: () => void
  keyItem: KeyRow | null
  locked: boolean
  onResetHWID: (keyId: string) => void
  onRemoveKey: (keyId: string) => void
  onNeedUpgrade: () => void
}) {
  const wrapRef = useOutsideClose(open, onClose)
  if (!open || !keyItem) return null

  const canManage = !locked

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />

      <div
        ref={wrapRef}
        className="relative z-[91] w-full max-w-md rounded-t-[16px] border border-b-0"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              Keys <span className="mx-1">/</span> Gerenciar
            </p>
            <p className="mt-2 text-[13px] font-semibold truncate">{keyItem.key}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                <span className="h-2 w-2 rounded-full" style={{ background: statusDot(keyItem.status) }} />
                {statusLabel(keyItem.status)}
              </span>
              <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                • {formatWhen(keyItem.updatedAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border p-2"
            style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="rounded-[12px] border p-4" style={{ borderColor: BORDER, background: PANEL2 }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border"
                style={{ borderColor: 'rgba(47,211,181,0.22)', background: 'rgba(47,211,181,0.14)' }}
              >
                <KeyIcon className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-semibold">Detalhes</p>
                <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                  HWID e ações disponíveis.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                HWID vinculado
              </p>
              <p className="mt-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                {keyItem.hwid ? keyItem.hwid : 'Nenhum HWID vinculado no momento.'}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!canManage) return onNeedUpgrade()
                  onResetHWID(keyItem.id)
                  onClose()
                }}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-[12px]"
                style={{
                  borderColor: BORDER,
                  background: PANEL,
                  color: canManage ? TEXT_SOFT : TEXT_MUTED,
                  opacity: canManage ? 1 : 0.6,
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Reset HWID
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canManage) return onNeedUpgrade()
                  onRemoveKey(keyItem.id)
                  onClose()
                }}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-[12px]"
                style={{
                  borderColor: 'rgba(248,113,113,0.22)',
                  background: 'rgba(248,113,113,0.08)',
                  color: canManage ? DANGER : TEXT_MUTED,
                  opacity: canManage ? 1 : 0.6,
                }}
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </button>
            </div>

            {!canManage ? (
              <div className="mt-3 rounded-[10px] border px-3 py-2" style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  Ações bloqueadas no plano <span style={{ color: DETAILS }}>none</span>.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}

/* ===================== PAGE ===================== */
export default function MobileKeysPage() {
  const router = useRouter()

  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [user, setUser] = useState<UserMe | null>(null)

  const [data, setData] = useState<KeysResponse | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | KeyStatus>('all')
  const [statusOpen, setStatusOpen] = useState(false)

  // ✅ pagination
  const [page, setPage] = useState(1)
  const keysPerPage = 10

  const [openId, setOpenId] = useState<string | null>(null)
  const [lockedOpen, setLockedOpen] = useState(false)

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

  const role = useMemo<'client' | 'empresarial'>(() => normalizeRoleFromPlan(user?.plan), [user?.plan])
  const locked = ((user?.plan || 'none').toLowerCase() === 'none')

  function goUpgrade() {
    setLockedOpen(false)
    router.push('/settings/billing')
  }

  // load keys
  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        setLoadingData(true)
        const res = await fetch('/api/keys', { method: 'GET', credentials: 'include' })
        if (res.ok) {
          setData(await res.json())
        } else {
          setData({ role, keys: [] })
        }
      } catch (e) {
        console.error(e)
        setData({ role, keys: [] })
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [user, role])

  const d = data || { role, keys: [] }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return (d.keys || []).filter((k) => {
      const okStatus = status === 'all' ? true : k.status === status
      const hw = (k.hwid || '').toLowerCase()
      const kk = (k.key || '').toLowerCase()
      const okQ = !qq ? true : kk.includes(qq) || hw.includes(qq)
      return okStatus && okQ
    })
  }, [d.keys, q, status])

  // ✅ reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [q, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / keysPerPage))
  const paginatedKeys = useMemo(() => {
    const start = (page - 1) * keysPerPage
    return filtered.slice(start, start + keysPerPage)
  }, [filtered, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const openKey = useMemo(() => {
    if (!openId) return null
    return (d.keys || []).find((k) => k.id === openId) || null
  }, [openId, d.keys])

  async function handleResetHWID(keyId: string) {
    try {
      const res = await fetch('/api/keys/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyId }),
      })
      if (!res.ok) throw new Error('Failed to reset HWID')

      setData((prev) => {
        const base = prev || d
        return {
          ...base,
          keys: (base.keys || []).map((k) => (k.id === keyId ? { ...k, hwid: '', updatedAt: new Date().toISOString() } : k)),
        }
      })
    } catch (e) {
      console.error('Erro ao resetar HWID', e)
    }
  }

  async function handleRemoveKey(keyId: string) {
    try {
      const res = await fetch('/api/keys/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyId }),
      })
      if (!res.ok) throw new Error('Failed to remove key')

      setData((prev) => {
        const base = prev || d
        return { ...base, keys: (base.keys || []).filter((k) => k.id !== keyId) }
      })
    } catch (e) {
      console.error('Erro ao remover chave', e)
    }
  }

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

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <main className="px-5 pt-6 pb-28">
        {/* header */}
        <div className="mb-5">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Pages <span className="mx-1">/</span> Keys
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[18px] font-semibold leading-tight">Keys</p>
              <p className="mt-1 text-[12px] truncate" style={{ color: TEXT_MUTED }}>
                {role === 'client' ? 'Acompanhe suas chaves e status.' : 'Gerencie chaves e HWIDs.'}
              </p>
            </div>

            <span
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-[10px] border px-3 text-[12px]"
              style={{ borderColor: BORDER, background: PANEL2, color: TEXT_MUTED }}
            >
              {loadingData ? 'Carregando…' : `${filtered.length} chave(s)`}
            </span>
          </div>
        </div>

        {/* filters */}
        <Card className="p-4">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Buscar
          </p>

          <div
            className="mt-2 flex h-[40px] items-center gap-2 rounded-[10px] border px-3"
            style={{ borderColor: BORDER, background: PANEL2 }}
          >
            <Search className="h-4 w-4" style={{ color: TEXT_MUTED }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por chave ou HWID…"
              className="h-full w-full bg-transparent text-[12px] outline-none"
              style={{ color: TEXT_SOFT }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Dropdown valueLabel={status === 'all' ? 'Todos' : statusLabel(status)} open={statusOpen} setOpen={setStatusOpen} label="Status">
              <DropItem
                label="Todos"
                active={status === 'all'}
                onClick={() => {
                  setStatus('all')
                  setStatusOpen(false)
                }}
              />
              <DropItem
                label="Ativas"
                active={status === 'active'}
                onClick={() => {
                  setStatus('active')
                  setStatusOpen(false)
                }}
                right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('active') }} />}
              />
              <DropItem
                label="Expiradas"
                active={status === 'expired'}
                onClick={() => {
                  setStatus('expired')
                  setStatusOpen(false)
                }}
                right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('expired') }} />}
              />
            </Dropdown>

            {locked ? (
              <button
                type="button"
                onClick={() => setLockedOpen(true)}
                className="inline-flex h-[40px] items-center justify-center gap-2 rounded-[10px] border px-3 text-[12px]"
                style={{ borderColor: 'rgba(47,211,181,0.18)', background: 'rgba(47,211,181,0.12)', color: DETAILS }}
              >
                Upgrade <ArrowUpRight className="h-4 w-4 opacity-80" />
              </button>
            ) : (
              <span
                className="inline-flex h-[40px] items-center justify-center rounded-[10px] border px-3 text-[12px]"
                style={{ borderColor: BORDER, background: PANEL2, color: TEXT_MUTED }}
              >
                Ações liberadas
              </span>
            )}
          </div>
        </Card>

        {/* list */}
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
              Lista
            </p>

            <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
              {loadingData ? 'Atualizando…' : filtered.length ? `Página ${page}/${totalPages}` : '—'}
            </span>
          </div>

          {loadingData ? (
            <div className="mt-4 rounded-[10px] border p-3" style={{ borderColor: BORDER, background: PANEL2 }}>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                Carregando chaves…
              </p>
            </div>
          ) : paginatedKeys.length === 0 ? (
            <div className="mt-4 rounded-[10px] border p-3" style={{ borderColor: BORDER, background: PANEL2 }}>
              <p className="text-[12px]" style={{ color: TEXT_SOFT }}>
                {q.trim() || status !== 'all' ? 'Nenhum resultado com os filtros atuais.' : 'Nenhuma chave encontrada.'}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                Quando existir, vai aparecer aqui.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {paginatedKeys.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setOpenId(k.id)}
                    className="w-full text-left rounded-[10px] border p-3 active:scale-[0.99] transition"
                    style={{ borderColor: BORDER, background: PANEL2 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate">{k.key}</p>

                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                            <span className="h-2 w-2 rounded-full" style={{ background: statusDot(k.status) }} />
                            {statusLabel(k.status)}
                          </span>

                          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                            HWID: {maskHWID(k.hwid)}
                          </span>
                        </div>

                        <p className="mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                          Atualizado: {formatWhen(k.updatedAt)}
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 opacity-60 mt-1" />
                    </div>
                  </button>
                ))}
              </div>

              {/* ✅ pagination buttons */}
              {filtered.length > 0 && totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4" style={{ borderColor: BORDER }}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                  >
                    Próximo
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </main>

      {/* bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-[#0b0b0b]" style={{ borderColor: BORDER }}>
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-around px-4 py-5 text-[11px]">
            <Link href="/mobile" className="flex flex-col items-center gap-1 text-white/60">
              <LayoutDashboard className="h-4 w-4" />
              <span>Home</span>
            </Link>

            <Link href="/mobile/keys" className="flex flex-col items-center gap-1 text-white">
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

      {/* modals */}
      <KeyManageModal
        open={!!openId}
        onClose={() => setOpenId(null)}
        keyItem={openKey}
        locked={locked}
        onNeedUpgrade={() => setLockedOpen(true)}
        onResetHWID={handleResetHWID}
        onRemoveKey={handleRemoveKey}
      />

      <LockedModal open={lockedOpen} onClose={() => setLockedOpen(false)} onUpgrade={goUpgrade} />
    </div>
  )
}
