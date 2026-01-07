// src/app/projects/page.tsx
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
  Plus,
} from 'lucide-react'

/* ===================== TYPES ===================== */
type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
  image?: string | null
}

type ProjectStatus = 'active' | 'paused' | 'archived'

type ProjectRow = {
  id: string
  name: string
  status: ProjectStatus
  clientsCount: number
  collectionsCount: number
  keysTotal: number
  updatedAt: string
  linkedClients?: { email: string; name?: string }[]
}

type ProjectsResponse = {
  role: 'client' | 'empresarial'
  projects: ProjectRow[]
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

function statusDot(status: ProjectStatus) {
  return status === 'active'
    ? ACCENT
    : status === 'paused'
    ? 'rgba(251,191,36,0.95)'
    : 'rgba(148,163,184,0.85)'
}

function statusLabel(status: ProjectStatus) {
  return status === 'active' ? 'Ativo' : status === 'paused' ? 'Pausado' : 'Arquivado'
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .trim()
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

/* ===================== LOCKED MODAL ===================== */
function LockedModal({
  open,
  onClose,
  onUpgrade,
  title = 'Acesso restrito',
  subtitle = 'Seu plano atual não inclui este recurso. Faça upgrade para desbloquear criação e gerenciamento.',
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
              Plano <span className="mx-1">/</span> Restrições
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
            aria-label="Close"
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
            Você ainda pode visualizar os dados. Ações de alteração ficam bloqueadas.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ===================== MODAL (MANAGE CLIENTS) ===================== */
function Modal({
  open,
  onClose,
  project,
  role,
  locked,
  onLinkClient,
  onUnlinkClient,
  onNeedUpgrade,
}: {
  open: boolean
  onClose: () => void
  project: ProjectRow | null
  role: 'client' | 'empresarial'
  locked: boolean
  onLinkClient: (projectId: string, email: string) => void
  onUnlinkClient: (projectId: string, email: string) => void
  onNeedUpgrade: () => void
}) {
  const [clientEmail, setClientEmail] = useState('')
  const wrapRef = useOutsideClose(open, onClose)

  useEffect(() => {
    if (!open) return
    setClientEmail('')
  }, [open, project?.id])

  if (!open || !project) return null

  const linked = project.linkedClients || []
  const canManage = role === 'empresarial' && !locked

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />

      <div
        ref={wrapRef}
        className="relative z-[81] w-[860px] rounded-[10px] border"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              Projetos <span className="mx-1">/</span> Clientes
            </p>

            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-[15px] font-semibold truncate">{project.name}</h2>

              <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                <span className="h-2 w-2 rounded-full" style={{ background: statusDot(project.status) }} />
                {statusLabel(project.status)}
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
                  Plano: none (bloqueado)
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
              Atualizado em: {formatWhen(project.updatedAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border p-2 transition hover:bg-white/[0.02]"
            style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-[1fr_340px] gap-4">
            {/* list */}
            <Card className="overflow-hidden">
              <div className="border-b px-4 py-3" style={{ borderColor: BORDER }}>
                <p className="text-[13px] font-semibold">Clientes vinculados</p>
                <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                  Controle quem tem acesso a este projeto e quais coleções o cliente pode operar.
                </p>
              </div>

              <div className="divide-y divide-white/[0.03]">
                {linked.length === 0 ? (
                  <div className="px-4 py-6">
                    <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                      Nenhum cliente vinculado. Adicione um email para liberar acesso ao projeto.
                    </p>
                  </div>
                ) : (
                  linked.map((c) => (
                    <div key={c.email} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[12px] truncate" style={{ color: TEXT_SOFT }}>
                          {c.name || c.email}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                          {c.email}
                        </p>
                      </div>

                      {role === 'empresarial' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!canManage) return onNeedUpgrade()
                            onUnlinkClient(project.id, c.email)
                          }}
                          className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                          style={{
                            borderColor: BORDER,
                            background: PANEL2,
                            color: canManage ? TEXT_SOFT : TEXT_MUTED,
                            cursor: 'pointer',
                            opacity: canManage ? 1 : 0.65,
                          }}
                        >
                          <Unlink className="h-4 w-4" style={{ color: DETAILS }} />
                          Remover acesso
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* link form */}
            <Card className="p-4">
              <p className="text-[13px] font-semibold">Adicionar cliente</p>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                {role === 'empresarial'
                  ? 'Informe o email do cliente. Ele verá este projeto na conta dele automaticamente.'
                  : 'Apenas o plano Empresarial pode adicionar clientes.'}
              </p>

              <div className="mt-4">
                <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                  Email do cliente
                </p>
                <input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="h-[40px] w-full rounded-[8px] border px-3 text-[12px] outline-none"
                  style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT, opacity: canManage ? 1 : 0.7 }}
                  disabled={!canManage}
                />
              </div>

              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                style={{
                  borderColor: BORDER,
                  background: PANEL2,
                  color: canManage ? TEXT_SOFT : TEXT_MUTED,
                  cursor: canManage ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (!canManage) return onNeedUpgrade()
                  const email = clientEmail.trim().toLowerCase()
                  if (!email) return
                  onLinkClient(project.id, email)
                  setClientEmail('')
                }}
              >
                <Link2 className="h-4 w-4" style={{ color: DETAILS }} />
                Vincular
              </button>

              {!canManage ? (
                <div
                  className="mt-3 rounded-[8px] border px-3 py-2"
                  style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                    Recurso disponível apenas no plano <span style={{ color: DETAILS }}>Empresarial</span>.
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

/* ===================== NEW PROJECT MODAL ===================== */
function NewProjectModal({
  open,
  onClose,
  role,
  locked,
  onNeedUpgrade,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  role: 'client' | 'empresarial'
  locked: boolean
  onNeedUpgrade: () => void
  onCreate: (payload: { name: string; status: ProjectStatus; clientEmail?: string }) => void
}) {
  const wrapRef = useOutsideClose(open, onClose)

  const [name, setName] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [statusOpen, setStatusOpen] = useState(false)
  const [clientEmail, setClientEmail] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setStatus('active')
    setStatusOpen(false)
    setClientEmail('')
    setErr(null)
  }, [open])

  if (!open) return null

  const nameTrim = name.trim()
  const canSubmitBase =
    !!nameTrim && (role === 'empresarial' ? (!clientEmail.trim() || validateEmail(clientEmail.trim())) : true)

  const canSubmit = canSubmitBase && !locked && role !== 'client'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.68)' }} onClick={onClose} />

      <div
        ref={wrapRef}
        className="relative z-[91] w-[760px] rounded-[10px] border"
        style={{ background: PANEL, borderColor: BORDER }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              Projetos <span className="mx-1">/</span> Novo
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-[15px] font-semibold truncate">Novo projeto</h2>
              <span className="text-[12px]" style={{ color: TEXT_MUTED }}>
                {locked ? 'bloqueado (plano none)' : role === 'client' ? 'visualização do client' : 'modo empresarial'}
              </span>
            </div>
            <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
              Crie um projeto para organizar coleções, clientes e geração de chaves em um só lugar.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border p-2 transition hover:bg-white/[0.02]"
            style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-[1fr_320px] gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <IconSquare>
                  <FolderKanban className="h-5 w-5" style={{ color: DETAILS }} />
                </IconSquare>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">Detalhes do projeto</p>
                  <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                    Defina nome e status. O slug é gerado automaticamente a partir do nome.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                  Nome do projeto
                </p>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setErr(null)
                  }}
                  placeholder="Ex: Majestic"
                  className="h-[40px] w-full rounded-[8px] border px-3 text-[12px] outline-none"
                  style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT, opacity: locked ? 0.7 : 1 }}
                  disabled={locked || role === 'client'}
                />

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                    Slug (automático)
                  </p>
                  <p className="text-[11px]" style={{ color: TEXT_SOFT }}>
                    {nameTrim ? slugifyName(nameTrim) : '—'}
                  </p>
                </div>
              </div>

              <div className="mt-4" style={{ opacity: locked ? 0.7 : 1 }}>
                <Dropdown label="Status" valueLabel={statusLabel(status)} open={statusOpen} setOpen={setStatusOpen} widthClass="w-full">
                  <DropItem
                    label="Ativo"
                    active={status === 'active'}
                    onClick={() => {
                      if (locked) return
                      setStatus('active')
                      setStatusOpen(false)
                    }}
                    right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('active') }} />}
                  />
                  <DropItem
                    label="Pausado"
                    active={status === 'paused'}
                    onClick={() => {
                      if (locked) return
                      setStatus('paused')
                      setStatusOpen(false)
                    }}
                    right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('paused') }} />}
                  />
                  <DropItem
                    label="Arquivado"
                    active={status === 'archived'}
                    onClick={() => {
                      if (locked) return
                      setStatus('archived')
                      setStatusOpen(false)
                    }}
                    right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('archived') }} />}
                  />
                </Dropdown>
              </div>

              {role === 'empresarial' ? (
                <div className="mt-4">
                  <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                    (Opcional) Vincular um cliente no momento da criação
                  </p>
                  <input
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value)
                      setErr(null)
                    }}
                    placeholder="cliente@email.com"
                    className="h-[40px] w-full rounded-[8px] border px-3 text-[12px] outline-none"
                    style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT, opacity: locked ? 0.7 : 1 }}
                    disabled={locked}
                  />
                </div>
              ) : null}

              {err ? (
                <div
                  className="mt-4 rounded-[8px] border px-3 py-2"
                  style={{ borderColor: 'rgba(248,113,113,0.22)', background: 'rgba(248,113,113,0.06)' }}
                >
                  <p className="text-[12px]" style={{ color: DANGER }}>
                    {err}
                  </p>
                </div>
              ) : null}
            </Card>

            <Card className="p-4">
              <p className="text-[13px] font-semibold">Prévia</p>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                Assim este projeto aparecerá na lista.
              </p>

              <div className="mt-4 rounded-[10px] border" style={{ borderColor: BORDER, background: PANEL2 }}>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{nameTrim || 'Novo projeto'}</p>
                    <p className="mt-1 text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                      Atualizado em: {formatWhen(new Date().toISOString())}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: statusDot(status) }} />
                    {statusLabel(status)}
                  </span>
                </div>

                <div className="border-t px-4 py-3" style={{ borderColor: BORDER }}>
                  <div className="grid grid-cols-3 gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                    <div>
                      <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                        Clientes
                      </p>
                      <p className="mt-1">{role === 'empresarial' && clientEmail.trim() ? 1 : 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                        Coleções
                      </p>
                      <p className="mt-1">0</p>
                    </div>
                    <div>
                      <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                        Chaves
                      </p>
                      <p className="mt-1">0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                  style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                  style={{
                    borderColor: BORDER,
                    background: canSubmit ? 'rgba(62,207,176,0.12)' : 'rgba(255,255,255,0.03)',
                    color: canSubmit ? DETAILS : TEXT_MUTED,
                    cursor: role === 'client' ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => {
                    if (role === 'client') return
                    if (locked) return onNeedUpgrade()

                    const nm = name.trim()
                    if (!nm) {
                      setErr('Nome do projeto é obrigatório.')
                      return
                    }

                    const email = clientEmail.trim().toLowerCase()
                    if (role === 'empresarial' && email && !validateEmail(email)) {
                      setErr('Email inválido.')
                      return
                    }

                    if (!canSubmitBase) return

                    onCreate({
                      name: nm,
                      status,
                      clientEmail: role === 'empresarial' ? email || undefined : undefined,
                    })
                    onClose()
                  }}
                >
                  <Plus className="h-4 w-4" style={{ color: DETAILS }} />
                  {locked ? 'Fazer upgrade' : 'Criar projeto'}
                </button>
              </div>

              {locked ? (
                <div
                  className="mt-4 rounded-[8px] border px-3 py-2"
                  style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                    Plano <span style={{ color: DETAILS }}>none</span>: criação de projeto bloqueada.
                  </p>
                </div>
              ) : null}

              {role === 'client' && (
                <div
                  className="mt-4 rounded-[8px] border px-3 py-2"
                  style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                    Ações bloqueadas para o plano <span style={{ color: DETAILS }}>client</span>.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== PAGE ===================== */
export default function ProjectsPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [data, setData] = useState<ProjectsResponse | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | ProjectStatus>('all')
  const [statusOpen, setStatusOpen] = useState(false)

  const [openId, setOpenId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)

  const role = useMemo<'client' | 'empresarial'>(() => normalizeRoleFromPlan(user?.plan), [user?.plan])
  const isNonePlan = (user?.plan || 'none').toLowerCase() === 'none'
  const locked = isNonePlan
  const [lockedOpen, setLockedOpen] = useState(false)

  function goUpgrade() {
    setLockedOpen(false)
    router.push('/settings/billing')
  }

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

  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        setLoadingData(true)
        const res = await fetch('/api/projects', { method: 'GET', credentials: 'include' })
        if (res.ok) {
          const d = await res.json()
          setData(d)
        } else {
          console.error('Erro ao carregar projetos', res.status)
          setData({ role: normalizeRoleFromPlan(user?.plan), projects: [] })
        }
      } catch (e) {
        console.error('Erro ao carregar projects', e)
        setData({ role: normalizeRoleFromPlan(user?.plan), projects: [] })
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [user])

  const d = data || { role: normalizeRoleFromPlan(user?.plan), projects: [] }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return (d.projects || []).filter((p) => {
      const okStatus = status === 'all' ? true : p.status === status
      const okQ = !qq ? true : p.name.toLowerCase().includes(qq)
      return okStatus && okQ
    })
  }, [d.projects, q, status])

  const openProject = useMemo(() => {
    if (!openId) return null
    return (d.projects || []).find((p) => p.id === openId) || null
  }, [openId, d.projects])

  function optimisticLinkClient(projectId: string, email: string) {
    fetch(`/api/projects/${projectId}/link-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Erro ao vincular cliente')
        }
        setData((prev) => {
          const base = prev || d
          const next: ProjectsResponse = {
            ...base,
            projects: (base.projects || []).map((p) => {
              if (p.id !== projectId) return p
              const linked = p.linkedClients || []
              if (linked.some((x) => x.email.toLowerCase() === email.toLowerCase())) return p
              return {
                ...p,
                linkedClients: [{ email }, ...linked],
                clientsCount: (p.clientsCount || 0) + 1,
              }
            }),
          }
          return next
        })
      })
      .catch((err) => {
        console.error('Erro ao vincular cliente:', err)
        alert(`Erro ao vincular cliente: ${err.message}`)
        window.location.reload()
      })
  }

  function optimisticUnlinkClient(projectId: string, email: string) {
    fetch(`/api/projects/${projectId}/unlink-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Erro ao desvincular cliente')
        }
        setData((prev) => {
          const base = prev || d
          const next: ProjectsResponse = {
            ...base,
            projects: (base.projects || []).map((p) => {
              if (p.id !== projectId) return p
              const linked = p.linkedClients || []
              const after = linked.filter((x) => x.email.toLowerCase() !== email.toLowerCase())
              return {
                ...p,
                linkedClients: after,
                clientsCount: Math.max(0, (p.clientsCount || 0) - (linked.length === after.length ? 0 : 1)),
              }
            }),
          }
          return next
        })
      })
      .catch((err) => {
        console.error('Erro ao desvincular cliente:', err)
        alert(`Erro ao desvincular cliente: ${err.message}`)
        window.location.reload()
      })
  }

  function optimisticCreateProject(payload: { name: string; status: ProjectStatus; clientEmail?: string }) {
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Erro ao criar projeto')
        }
        const newProject = await res.json()
        setData((prev) => {
          const base = prev || d
          const next: ProjectsResponse = {
            ...base,
            projects: [newProject, ...(base.projects || [])],
          }
          return next
        })
      })
      .catch((err) => {
        console.error('Erro ao criar projeto:', err)
        alert(`Erro ao criar projeto: ${err.message}`)
        window.location.reload()
      })
  }

  if (loadingUser) return <FullscreenLoader />

  return (
    <div className="flex min-h-screen text-white" style={{ background: BG }}>
      <Sidebar user={user || { id: '', name: '', email: '' }} />

      <main className="ml-64 w-full px-10 py-8 relative">
        {locked && (
          <div className="absolute inset-0 z-[80] bg-black opacity-50" style={{ backdropFilter: 'blur(10px)' }}>
            <div className="absolute inset-0 z-[90] flex items-center justify-center text-white text-xl">
              <p>Ações bloqueadas. Faça upgrade para continuar.</p>
            </div>
          </div>
        )}

        {/* header */}
        <div className="mb-6">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Pages <span className="mx-1">/</span> Projetos
          </p>

          <div className="mt-1 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[18px] font-semibold">Projetos</h1>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                {role === 'client'
                  ? 'Acesse os projetos compartilhados com você e gerencie as coleções disponíveis.'
                  : 'Crie projetos, vincule clientes e controle coleções e chaves em um painel único.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 text-[12px] transition hover:opacity-90"
                style={{ color: TEXT_SOFT, opacity: locked ? 0.6 : 1 }}
                onClick={() => {
                  if (locked) return setLockedOpen(true)
                  setNewOpen(true)
                }}
              >
                <Plus className="h-4 w-4" style={{ color: DETAILS }} />
                Novo projeto
              </button>
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
                    placeholder="Buscar projetos..."
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
                  label="Ativo"
                  active={status === 'active'}
                  onClick={() => {
                    setStatus('active')
                    setStatusOpen(false)
                  }}
                  right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('active') }} />}
                />
                <DropItem
                  label="Pausado"
                  active={status === 'paused'}
                  onClick={() => {
                    setStatus('paused')
                    setStatusOpen(false)
                  }}
                  right={<span className="h-2 w-2 rounded-full" style={{ background: statusDot('paused') }} />}
                />
                <DropItem
                  label="Arquivado"
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
              {loadingData ? 'Carregando…' : `${filtered.length} projeto(s)`}
            </p>
          </div>
        </Card>

        {/* table */}
        <Card className="mt-4 overflow-hidden">
          <div className="border-b px-5 py-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconSquare>
                  <FolderKanban className="h-5 w-5" style={{ color: DETAILS }} />
                </IconSquare>
                <div>
                  <p className="text-[13px] font-semibold">Projetos</p>
                  <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                    Abra um projeto para visualizar detalhes e gerenciar clientes vinculados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* head */}
          <div
            className="grid grid-cols-[1.2fr_0.7fr_0.55fr_0.6fr_0.55fr_0.9fr_0.55fr] gap-3 px-5 py-3 text-[11px]"
            style={{ color: TEXT_MUTED }}
          >
            <div>Nome</div>
            <div>Status</div>
            <div>Clientes</div>
            <div>Coleções</div>
            <div>Chaves</div>
            <div>Atualizado</div>
            <div className="text-right">Ação</div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1.2fr_0.7fr_0.55fr_0.6fr_0.55fr_0.9fr_0.55fr] items-center gap-3 px-5 py-4 transition hover:bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{p.name}</p>
                </div>

                <div>
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: TEXT_SOFT }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: statusDot(p.status) }} />
                    {statusLabel(p.status)}
                  </span>
                </div>

                <div className="text-[12px]" style={{ color: TEXT_SOFT }}>
                  {p.clientsCount}
                </div>

                <div className="text-[12px]" style={{ color: TEXT_SOFT }}>
                  {p.collectionsCount}
                </div>

                <div className="text-[12px]" style={{ color: TEXT_SOFT }}>
                  {p.keysTotal}
                </div>

                <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
                  {formatWhen(p.updatedAt)}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenId(p.id)}
                    className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02]"
                    style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                  >
                    Abrir
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-5 py-10">
                <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                  Nenhum projeto encontrado.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Modal
          open={!!openId}
          onClose={() => setOpenId(null)}
          project={openProject}
          role={role}
          locked={locked}
          onNeedUpgrade={() => setLockedOpen(true)}
          onLinkClient={(pid, email) => optimisticLinkClient(pid, email)}
          onUnlinkClient={(pid, email) => optimisticUnlinkClient(pid, email)}
        />

        <NewProjectModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          role={role}
          locked={locked}
          onNeedUpgrade={() => setLockedOpen(true)}
          onCreate={(payload) => {
            if (locked) return setLockedOpen(true)
            optimisticCreateProject(payload)
          }}
        />

        <LockedModal open={lockedOpen} onClose={() => setLockedOpen(false)} onUpgrade={goUpgrade} />
      </main>
    </div>
  )
}
