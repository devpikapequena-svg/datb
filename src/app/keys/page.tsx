// src/app/keys/page.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  ArrowUpRight,
  Key,
  Search,
  ChevronDown,
  X,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
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

/* ===================== THEME (same as dashboard) ===================== */
const BG = '#090909'
const PANEL = 'rgba(12, 12, 12, 1)'
const PANEL2 = '#111111ff'
const BORDER = 'rgba(255, 255, 255, 0.03)'
const TEXT_SOFT = 'rgba(255,255,255,0.62)'
const TEXT_MUTED = 'rgba(255,255,255,0.42)'
const ACCENT = '#3ECFB0'
const DETAILS = '#ffffffff'
const DANGER = 'rgba(248,113,113,0.95)'

/* ===================== HELPERS ===================== */
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

function normalizeRoleFromPlan(plan?: string): 'client' | 'empresarial' {
  const p = (plan || 'none').toLowerCase()
  return p === 'empresarial' ? 'empresarial' : 'client'
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
    <div
      className={`rounded-[8px] border ${className}`}
      style={{
        background: PANEL,
        borderColor: BORDER,
        boxShadow: 'none',
      }}
    >
      {children}
    </div>
  )
}

function IconSquare({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-[8px] border"
      style={{
        background: ACCENT,
        borderColor: 'rgba(56,214,167,0.22)',
      }}
    >
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
  label,
  valueLabel,
  children,
  open,
  setOpen,
  widthClass = 'w-[220px]',
}: {
  label?: string
  valueLabel: string
  children: React.ReactNode
  open: boolean
  setOpen: (v: boolean) => void
  widthClass?: string
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
        className={`h-[40px] ${widthClass} inline-flex items-center justify-between gap-2 rounded-[8px] border px-3 text-[12px]`}
        style={{
          borderColor: BORDER,
          background: PANEL2,
          color: TEXT_SOFT,
        }}
      >
        <span className="truncate">{valueLabel}</span>
        <ChevronDown className="h-4 w-4" style={{ color: TEXT_MUTED }} />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 ${widthClass} overflow-hidden rounded-[8px] border`}
          style={{ borderColor: BORDER, background: PANEL }}
        >
          <div className="p-1">{children}</div>
        </div>
      )}
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
      className="w-full rounded-[6px] px-3 py-2 text-left text-[12px] transition"
      style={{
        background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: active ? DETAILS : TEXT_SOFT,
      }}
      onMouseEnter={(e) => {
        if (active) return
        ;(e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')
      }}
      onMouseLeave={(e) => {
        if (active) return
        ;(e.currentTarget.style.backgroundColor = 'transparent')
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate">{label}</span>
        {right ? <span className="shrink-0">{right}</span> : null}
      </div>
    </button>
  )
}

/* ===================== LOCKED MODAL (clean) ===================== */
function LockedModal({
  open,
  onClose,
  onUpgrade,
  title = 'Upgrade necessário',
  subtitle = 'Seu plano atual não inclui este recurso. Faça upgrade para liberar as ações de gerenciamento.',
}: {
  open: boolean
  onClose: () => void
  onUpgrade: () => void
  title?: string
  subtitle?: string
}) {
  const wrapRef = useOutsideClose(open, onClose)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.68)' }} onClick={onClose} />
      <div
        ref={wrapRef}
        className="relative z-[96] w-[520px] rounded-[10px] border"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              Acesso <span className="mx-1">/</span> Recurso bloqueado
            </p>
            <h3 className="mt-2 text-[15px] font-semibold">{title}</h3>
            <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border p-2 transition hover:bg-white/[0.02]"
            style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
              style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            >
              Agora não
            </button>

            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
              style={{
                borderColor: 'rgba(62,207,176,0.18)',
                background: 'rgba(62,207,176,0.12)',
                color: DETAILS,
              }}
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

/* ===================== MODAL (MANAGE KEY) ===================== */
function Modal({
  open,
  onClose,
  keyItem,
  role,
  locked,
  onResetHWID,
  onRemoveKey,
  onNeedUpgrade,
}: {
  open: boolean
  onClose: () => void
  keyItem: KeyRow | null
  role: 'client' | 'empresarial'
  locked: boolean
  onResetHWID: (keyId: string) => void
  onRemoveKey: (keyId: string) => void
  onNeedUpgrade: () => void
}) {
  const wrapRef = useOutsideClose(open, onClose)
  if (!open || !keyItem) return null

  const canManage = !locked

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />

      <div
        ref={wrapRef}
        className="relative z-[81] w-[760px] rounded-[10px] border"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              Chaves <span className="mx-1">/</span> Gerenciar
            </p>

            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-[15px] font-semibold truncate">{keyItem.key}</h2>

              <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                <span className="h-2 w-2 rounded-full" style={{ background: statusDot(keyItem.status) }} />
                {statusLabel(keyItem.status)}
              </span>

              {locked ? (
                <span
                  className="inline-flex items-center rounded-[999px] border px-2 py-1 text-[11px]"
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: TEXT_MUTED,
                  }}
                >
                  Plano atual: none
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
              Última atualização: {formatWhen(keyItem.updatedAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border p-2 transition hover:bg-white/[0.02]"
            style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <IconSquare>
                <Key className="h-5 w-5" style={{ color: DETAILS }} />
              </IconSquare>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">Detalhes da chave</p>
                <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                  Informações do HWID e ações disponíveis.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                HWID vinculado
              </p>
              <p className="text-[12px]" style={{ color: TEXT_SOFT }}>
                {keyItem.hwid ? keyItem.hwid : 'Nenhum HWID vinculado no momento.'}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!canManage) return onNeedUpgrade()
                  onResetHWID(keyItem.id)
                  onClose()
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                style={{
                  borderColor: BORDER,
                  background: PANEL2,
                  color: canManage ? TEXT_SOFT : TEXT_MUTED,
                  cursor: canManage ? 'pointer' : 'not-allowed',
                  opacity: canManage ? 1 : 0.65,
                }}
              >
                <RotateCcw className="h-4 w-4" style={{ color: DETAILS }} />
                Resetar HWID
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canManage) return onNeedUpgrade()
                  onRemoveKey(keyItem.id)
                  onClose()
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                style={{
                  borderColor: 'rgba(248,113,113,0.22)',
                  background: 'rgba(248,113,113,0.06)',
                  color: canManage ? DANGER : TEXT_MUTED,
                  cursor: canManage ? 'pointer' : 'not-allowed',
                  opacity: canManage ? 1 : 0.65,
                }}
              >
                <Trash2 className="h-4 w-4" />
                Remover chave
              </button>
            </div>

            {!canManage ? (
              <div
                className="mt-3 rounded-[8px] border px-3 py-2"
                style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}
              >
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  Ações bloqueadas no plano <span style={{ color: DETAILS }}>none</span>.
                </p>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ===================== PAGE ===================== */
export default function KeysPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [data, setData] = useState<KeysResponse | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | KeyStatus>('all')
  const [statusOpen, setStatusOpen] = useState(false)

  const [page, setPage] = useState(1)
  const keysPerPage = 7

  const [openId, setOpenId] = useState<string | null>(null)

  // locked modal
  const role = useMemo<'client' | 'empresarial'>(() => normalizeRoleFromPlan(user?.plan), [user?.plan])
  const isNonePlan = (user?.plan || 'none').toLowerCase() === 'none'
  const locked = isNonePlan
  const [lockedOpen, setLockedOpen] = useState(false)

  function goUpgrade() {
    setLockedOpen(false)
    router.push('/settings/billing')
  }

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

  // load keys
  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        setLoadingData(true)
        const res = await fetch('/api/keys', { method: 'GET', credentials: 'include' })
        if (res.ok) {
          const d = await res.json()
          setData(d)
        } else {
          setData({ role: normalizeRoleFromPlan(user?.plan), keys: [] })
        }
      } catch (e) {
        console.error('Erro ao carregar chaves', e)
        setData({ role: normalizeRoleFromPlan(user?.plan), keys: [] })
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [user])

  // reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [q, status])

  const d = data || { role: normalizeRoleFromPlan(user?.plan), keys: [] }

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / keysPerPage))
  const paginatedKeys = useMemo(() => {
    const start = (page - 1) * keysPerPage
    return filtered.slice(start, start + keysPerPage)
  }, [filtered, page, keysPerPage])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

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

      // Optimistic update
      setData((prev) => {
        const base = prev || d
        const next: KeysResponse = {
          ...base,
          keys: (base.keys || []).map((k) => {
            if (k.id !== keyId) return k
            return { ...k, hwid: '', updatedAt: new Date().toISOString() }
          }),
        }
        return next
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

      // Optimistic update
      setData((prev) => {
        const base = prev || d
        const next: KeysResponse = {
          ...base,
          keys: (base.keys || []).filter((k) => k.id !== keyId),
        }
        return next
      })
    } catch (e) {
      console.error('Erro ao remover chave', e)
    }
  }

  if (loadingUser) return <FullscreenLoader />

  return (
    <div className="flex min-h-screen text-white" style={{ background: BG }}>
      <Sidebar user={user || { id: '', name: '', email: '' }} />

      <main className="ml-64 w-full px-10 py-8 relative">
        {/* overlay locked */}
        {locked && (
          <div className="absolute inset-0 z-[80]" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)' }}>
            <div className="absolute inset-0 z-[90] flex items-center justify-center px-6 text-center">
              <div className="max-w-[520px] rounded-[10px] border px-5 py-4" style={{ borderColor: BORDER, background: PANEL }}>
                <p className="text-[13px] font-semibold">Ações bloqueadas</p>
                <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
                  Para resetar HWID ou remover chaves, faça upgrade do seu plano.
                </p>
                <button
                  type="button"
                  onClick={() => setLockedOpen(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                  style={{
                    borderColor: 'rgba(62,207,176,0.18)',
                    background: 'rgba(62,207,176,0.12)',
                    color: DETAILS,
                  }}
                >
                  Fazer upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* header */}
        <div className="mb-6">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Workspace <span className="mx-1">/</span> Chaves
          </p>

          <div className="mt-1 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[18px] font-semibold">Chaves</h1>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                {role === 'client' ? 'Acompanhe suas chaves e o status de ativação.' : 'Gerencie chaves, status e HWIDs.'}
              </p>
            </div>
          </div>
        </div>

        {/* filters */}
        <Card className="p-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <div>
                <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                  Buscar
                </p>
                <div className="flex h-[40px] w-[360px] items-center gap-2 rounded-[8px] border px-3" style={{ borderColor: BORDER, background: PANEL2 }}>
                  <Search className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por chave ou HWID…"
                    className="h-full w-full bg-transparent text-[12px] outline-none"
                    style={{ color: TEXT_SOFT }}
                  />
                </div>
              </div>

              <Dropdown label="Status" valueLabel={status === 'all' ? 'Todos' : statusLabel(status)} open={statusOpen} setOpen={setStatusOpen}>
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
            </div>

            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
              {loadingData ? 'Carregando…' : `${filtered.length} chave(s)`}
            </p>
          </div>
        </Card>

        {/* table */}
        <Card className="mt-4 overflow-hidden">
          <div className="border-b px-5 py-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3">
              <IconSquare>
                <Key className="h-5 w-5" style={{ color: DETAILS }} />
              </IconSquare>
              <div>
                <p className="text-[13px] font-semibold">Lista</p>
                <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                  Abra uma chave para ver detalhes e ações de HWID.
                </p>
              </div>
            </div>
          </div>

          {/* head */}
          <div className="grid grid-cols-[1.5fr_1fr_0.7fr_0.9fr_0.55fr] gap-3 px-5 py-3 text-[11px]" style={{ color: TEXT_MUTED }}>
            <div>Chave</div>
            <div>HWID</div>
            <div>Status</div>
            <div>Atualizado</div>
            <div className="text-right">Ação</div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {loadingData ? (
              <div className="px-5 py-10">
                <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                  Carregando chaves…
                </p>
              </div>
            ) : paginatedKeys.length === 0 ? (
              <div className="px-5 py-10">
                <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                  {q.trim() || status !== 'all' ? 'Nenhum resultado com os filtros atuais.' : 'Nenhuma chave encontrada.'}
                </p>
              </div>
            ) : (
              paginatedKeys.map((k) => (
                <div
                  key={k.id}
                  className="grid grid-cols-[1.5fr_1fr_0.7fr_0.9fr_0.55fr] items-center gap-3 px-5 py-4 transition hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px]">{k.key}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[12px]" style={{ color: TEXT_SOFT }}>
                      {maskHWID(k.hwid)}
                    </p>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: statusDot(k.status) }} />
                      {statusLabel(k.status)}
                    </span>
                  </div>

                  <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
                    {formatWhen(k.updatedAt)}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setOpenId(k.id)}
                      className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                      style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                    >
                      Abrir
                      <ArrowUpRight className="h-4 w-4 opacity-70" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* pagination */}
          {filtered.length > 0 && totalPages > 1 && !loadingData && (
            <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: BORDER }}>
              <span className="text-[12px]" style={{ color: TEXT_MUTED }}>
                Página {page} de {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>

        <Modal
          open={!!openId}
          onClose={() => setOpenId(null)}
          keyItem={openKey}
          role={role}
          locked={locked}
          onNeedUpgrade={() => setLockedOpen(true)}
          onResetHWID={handleResetHWID}
          onRemoveKey={handleRemoveKey}
        />

        <LockedModal open={lockedOpen} onClose={() => setLockedOpen(false)} onUpgrade={goUpgrade} />
      </main>
    </div>
  )
}
