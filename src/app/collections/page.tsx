// src/app/collections/page.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  ArrowUpRight,
  FolderKanban,
  Search,
  ChevronDown,
  X,
  Link2,
  Unlink,
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

type CollectionStatus = 'active' | 'paused' | 'archived'

type CollectionRow = {
  id: string
  name: string
  status: CollectionStatus
  projectId: string
  projectName: string
  keysTotal: number
  updatedAt: string
}

type CollectionsResponse = {
  role: 'client' | 'empresarial'
  collections: CollectionRow[]
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

function statusDot(status: CollectionStatus) {
  return status === 'active'
    ? ACCENT
    : status === 'paused'
    ? 'rgba(251,191,36,0.95)'
    : 'rgba(148,163,184,0.85)'
}

function statusLabel(status: CollectionStatus) {
  return status === 'active' ? 'Ativa' : status === 'paused' ? 'Pausada' : 'Arquivada'
}

function normalizeRoleFromPlan(plan?: string): 'client' | 'empresarial' {
  const p = (plan || 'none').toLowerCase()
  return p === 'empresarial' ? 'empresarial' : 'client'
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
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.68)' }}
        onClick={onClose}
      />
      <div
        ref={wrapRef}
        className="relative z-[96] w-[520px] rounded-[10px] border"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: BORDER }}
        >
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

/* ===================== MODAL (MANAGE LINK TO PROJECT) ===================== */
function Modal({
  open,
  onClose,
  collection,
  role,
  locked,
  projects,
  onLinkProject,
  onUnlinkProject,
  onNeedUpgrade,
}: {
  open: boolean
  onClose: () => void
  collection: CollectionRow | null
  role: 'client' | 'empresarial'
  locked: boolean
  projects: { id: string; name: string }[]
  onLinkProject: (collectionId: string, projectId: string) => void
  onUnlinkProject: (collectionId: string) => void
  onNeedUpgrade: () => void
}) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectOpen, setProjectOpen] = useState(false)
  const wrapRef = useOutsideClose(open, onClose)

  useEffect(() => {
    if (!open || !collection) return
    setSelectedProjectId(collection.projectId || '')
  }, [open, collection])

  if (!open || !collection) return null

  const canManage = role === 'empresarial' && !locked

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)' }}
        onClick={onClose}
      />

      <div
        ref={wrapRef}
        className="relative z-[81] w-[860px] rounded-[10px] border"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        {/* header */}
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: BORDER }}
        >
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              Coleções <span className="mx-1">/</span> Vinculação de projeto
            </p>

            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-[15px] font-semibold truncate">{collection.name}</h2>

              <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                <span className="h-2 w-2 rounded-full" style={{ background: statusDot(collection.status) }} />
                {statusLabel(collection.status)}
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
              Última atualização: {formatWhen(collection.updatedAt)}
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
          <div className="grid grid-cols-[1fr_340px] gap-4">
            {/* current link */}
            <Card className="overflow-hidden">
              <div className="border-b px-4 py-3" style={{ borderColor: BORDER }}>
                <p className="text-[13px] font-semibold">Projeto atual</p>
                <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                  Projeto associado a esta coleção no momento.
                </p>
              </div>

              <div className="px-4 py-6">
                <div className="min-w-0">
                  <p className="text-[12px] truncate" style={{ color: TEXT_SOFT }}>
                    {collection.projectName || 'Nenhum projeto vinculado'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                    {collection.projectId || '—'}
                  </p>
                </div>

                {role === 'empresarial' && collection.projectId ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canManage) return onNeedUpgrade()
                      onUnlinkProject(collection.id)
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                    style={{
                      borderColor: BORDER,
                      background: PANEL2,
                      color: canManage ? TEXT_SOFT : TEXT_MUTED,
                      cursor: 'pointer',
                      opacity: canManage ? 1 : 0.65,
                    }}
                  >
                    <Unlink className="h-4 w-4" style={{ color: DETAILS }} />
                    Remover vínculo
                  </button>
                ) : null}
              </div>
            </Card>

            {/* link form */}
            <Card className="p-4">
              <p className="text-[13px] font-semibold">Vincular a um projeto</p>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                {role === 'empresarial'
                  ? 'Selecione um projeto para associar esta coleção.'
                  : 'Apenas empresarial pode vincular coleções a projetos.'}
              </p>

              <div className="mt-4">
                <Dropdown
                  label="Projeto"
                  valueLabel={
                    selectedProjectId
                      ? projects.find((p) => p.id === selectedProjectId)?.name || 'Selecionar projeto'
                      : 'Selecionar projeto'
                  }
                  open={projectOpen}
                  setOpen={setProjectOpen}
                  widthClass="w-full"
                >
                  {projects.length ? (
                    projects.map((p) => (
                      <DropItem
                        key={p.id}
                        label={p.name}
                        active={selectedProjectId === p.id}
                        onClick={() => {
                          if (locked) return
                          setSelectedProjectId(p.id)
                          setProjectOpen(false)
                        }}
                      />
                    ))
                  ) : (
                    <DropItem label="Nenhum projeto disponível" active onClick={() => setProjectOpen(false)} />
                  )}
                </Dropdown>
              </div>

              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                style={{
                  borderColor: BORDER,
                  background: PANEL2,
                  color: canManage ? TEXT_SOFT : TEXT_MUTED,
                  cursor: 'pointer',
                  opacity: canManage ? 1 : 0.65,
                }}
                onClick={() => {
                  if (!canManage) return onNeedUpgrade()
                  const pid = selectedProjectId.trim()
                  if (!pid) return
                  onLinkProject(collection.id, pid)
                  onClose()
                }}
              >
                <Link2 className="h-4 w-4" style={{ color: DETAILS }} />
                Salvar vínculo
              </button>

              {!canManage ? (
                <div
                  className="mt-3 rounded-[8px] border px-3 py-2"
                  style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                    Recurso indisponível no plano <span style={{ color: DETAILS }}>none</span>.
                  </p>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== PAGE ===================== */
export default function CollectionsPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [data, setData] = useState<CollectionsResponse | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | CollectionStatus>('all')
  const [statusOpen, setStatusOpen] = useState(false)

  const [openId, setOpenId] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

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

  // load collections and projects
  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        setLoadingData(true)
        const res = await fetch('/api/collections', { method: 'GET', credentials: 'include' })
        if (res.ok) {
          const d = await res.json()
          setData(d)
        } else {
          setData({ role: normalizeRoleFromPlan(user!.plan), collections: [] })
        }

        const projRes = await fetch('/api/projects', { method: 'GET', credentials: 'include' })
        if (projRes.ok) {
          const projData = await projRes.json()
          setProjects(projData.projects.map((p: any) => ({ id: p.id, name: p.name })))
        } else {
          setProjects([])
        }
      } catch (e) {
        console.error('Erro ao carregar coleções', e)
        setData({ role: normalizeRoleFromPlan(user!.plan), collections: [] })
        setProjects([])
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [user])

  // reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [q, status])

  const d = data || { role: 'client', collections: [] }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return (d.collections || []).filter((c) => {
      const okStatus = status === 'all' ? true : c.status === status
      const okQ =
        !qq ||
        c.name.toLowerCase().includes(qq) ||
        (c.projectName || '').toLowerCase().includes(qq) ||
        (c.projectId || '').toLowerCase().includes(qq)
      return okStatus && okQ
    })
  }, [d.collections, q, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))

  const paginatedCollections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const openCollection = useMemo(() => {
    if (!openId) return null
    return (d.collections || []).find((c) => c.id === openId) || null
  }, [openId, d.collections])

  async function handleLinkProject(collectionId: string, projectId: string) {
    try {
      optimisticLinkProject(collectionId, projectId)

      const res = await fetch('/api/collections/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ collectionId, projectId }),
      })

      if (!res.ok) {
        optimisticUnlinkProject(collectionId)
        console.error('Erro ao vincular projeto')
      }
    } catch (e) {
      optimisticUnlinkProject(collectionId)
      console.error('Erro ao vincular projeto', e)
    }
  }

  async function handleUnlinkProject(collectionId: string) {
    try {
      const prev = (d.collections || []).find((c) => c.id === collectionId) || null
      optimisticUnlinkProject(collectionId)

      const res = await fetch('/api/collections/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ collectionId }),
      })

      if (!res.ok) {
        if (prev?.projectId) optimisticLinkProject(collectionId, prev.projectId)
        console.error('Erro ao remover vínculo do projeto')
      }
    } catch (e) {
      const prev = (d.collections || []).find((c) => c.id === collectionId) || null
      if (prev?.projectId) optimisticLinkProject(collectionId, prev.projectId)
      console.error('Erro ao remover vínculo do projeto', e)
    }
  }

  function optimisticLinkProject(collectionId: string, projectId: string) {
    const proj = projects.find((p) => p.id === projectId)
    if (!proj) return
    setData((prev) => {
      const base = prev || d
      const next: CollectionsResponse = {
        ...base,
        collections: (base.collections || []).map((c) => {
          if (c.id !== collectionId) return c
          return { ...c, projectId, projectName: proj.name }
        }),
      }
      return next
    })
  }

  function optimisticUnlinkProject(collectionId: string) {
    setData((prev) => {
      const base = prev || d
      const next: CollectionsResponse = {
        ...base,
        collections: (base.collections || []).map((c) => {
          if (c.id !== collectionId) return c
          return { ...c, projectId: '', projectName: '' }
        }),
      }
      return next
    })
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
                  Para vincular ou desvincular projetos, faça upgrade do seu plano.
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
            Workspace <span className="mx-1">/</span> Coleções
          </p>

          <div className="mt-1 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[18px] font-semibold">Coleções</h1>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                {role === 'client'
                  ? 'Acompanhe as coleções disponíveis e seus projetos vinculados.'
                  : 'Gerencie coleções e organize o vínculo com projetos.'}
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
                <div
                  className="flex h-[40px] w-[360px] items-center gap-2 rounded-[8px] border px-3"
                  style={{ borderColor: BORDER, background: PANEL2 }}
                >
                  <Search className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por coleção, projeto ou ID…"
                    className="h-full w-full bg-transparent text-[12px] outline-none"
                    style={{ color: TEXT_SOFT }}
                  />
                </div>
              </div>

              <Dropdown
                label="Status"
                valueLabel={status === 'all' ? 'Todos' : statusLabel(status)}
                open={statusOpen}
                setOpen={setStatusOpen}
              >
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
                  label="Pausadas"
                  active={status === 'paused'}
                  onClick={() => {
                    setStatus('paused')
                    setStatusOpen(false)
                  }}
                  right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('paused') }} />}
                />
                <DropItem
                  label="Arquivadas"
                  active={status === 'archived'}
                  onClick={() => {
                    setStatus('archived')
                    setStatusOpen(false)
                  }}
                  right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('archived') }} />}
                />
              </Dropdown>
            </div>

            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
              {loadingData ? 'Carregando…' : `${filtered.length} coleção(ões)`}
            </p>
          </div>
        </Card>

        {/* table */}
        <Card className="mt-4 overflow-hidden">
          <div className="border-b px-5 py-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3">
              <IconSquare>
                <FolderKanban className="h-5 w-5" style={{ color: DETAILS }} />
              </IconSquare>
              <div>
                <p className="text-[13px] font-semibold">Visão geral</p>
                <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                  Abra uma coleção para revisar e ajustar o vínculo com um projeto.
                </p>
              </div>
            </div>
          </div>

          {/* head */}
          <div
            className="grid grid-cols-[1.2fr_0.7fr_1fr_0.6fr_0.9fr_0.55fr] gap-3 px-5 py-3 text-[11px]"
            style={{ color: TEXT_MUTED }}
          >
            <div>Nome</div>
            <div>Status</div>
            <div>Projeto</div>
            <div>Keys</div>
            <div>Atualizado</div>
            <div className="text-right">Ação</div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {paginatedCollections.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1.2fr_0.7fr_1fr_0.6fr_0.9fr_0.55fr] items-center gap-3 px-5 py-4 transition hover:bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px]">{c.name}</p>
                </div>

                <div>
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: statusDot(c.status) }} />
                    {statusLabel(c.status)}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[12px]" style={{ color: TEXT_SOFT }}>
                    {c.projectName || '—'}
                  </p>
                </div>

                <div className="text-[12px]" style={{ color: TEXT_SOFT }}>
                  {c.keysTotal}
                </div>

                <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
                  {formatWhen(c.updatedAt)}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                    style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                  >
                    Abrir
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </button>
                </div>
              </div>
            ))}

            {paginatedCollections.length === 0 && (
              <div className="px-5 py-10">
                <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                  {loadingData
                    ? 'Carregando coleções…'
                    : q.trim() || status !== 'all'
                    ? 'Nenhum resultado com os filtros atuais.'
                    : 'Nenhuma coleção encontrada.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: BORDER }}>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
          collection={openCollection}
          role={role}
          locked={locked}
          projects={projects}
          onNeedUpgrade={() => setLockedOpen(true)}
          onLinkProject={handleLinkProject}
          onUnlinkProject={handleUnlinkProject}
        />

        <LockedModal open={lockedOpen} onClose={() => setLockedOpen(false)} onUpgrade={goUpgrade} />
      </main>
    </div>
  )
}
