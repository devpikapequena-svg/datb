// src/app/keys/generate/page.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  Layers,
  ChevronDown,
  ShieldCheck,
  Copy,
  Check,
  FolderKanban,
  Database,
  Sparkle,
  Clock,
} from 'lucide-react'

/* ===================== TYPES ===================== */
type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
  image?: string | null
}

type ProjectRow = {
  id: string
  name: string
  status: 'active' | 'paused' | 'archived'
  clientsCount: number
  collectionsCount: number
  keysTotal: number
  updatedAt: string
}

type ProjectsResponse = {
  role: 'client' | 'empresarial'
  projects: ProjectRow[]
}

type CollectionRow = {
  id: string
  name: string
  status: 'active' | 'paused' | 'archived'
  projectId: string
  projectName: string
  keysTotal: number
  updatedAt: string
  database: string
}

type CollectionsResponse = {
  role: 'client' | 'empresarial'
  collections: CollectionRow[]
}

/* ===================== THEME ===================== */
const BG = '#090909'
const PANEL = 'rgba(12, 12, 12, 1)'
const PANEL2 = '#111111ff'
const BORDER = 'rgba(255, 255, 255, 0.03)'
const TEXT_SOFT = 'rgba(255,255,255,0.62)'
const TEXT_MUTED = 'rgba(255,255,255,0.42)'
const ACCENT = '#3ECFB0'
const DETAILS = '#ffffffff'
const DANGER = 'rgba(248,113,113,0.95)'

/* ✅ LIMITES */
const MAX_QTY = 50
const MAX_EXP_DAYS = 3650 // 10 anos

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
      style={{ background: PANEL, borderColor: BORDER, boxShadow: 'none' }}
    >
      {children}
    </div>
  )
}

function IconSquare({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-[8px] border"
      style={{ background: ACCENT, borderColor: 'rgba(56,214,167,0.22)' }}
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
}: {
  label?: string
  valueLabel: string
  children: React.ReactNode
  open: boolean
  setOpen: (v: boolean) => void
}) {
  const ref = useOutsideClose(open, () => setOpen(false))

  return (
    <div className="relative w-full" ref={ref}>
      {label ? (
        <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
          {label}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-[40px] w-full inline-flex items-center justify-between gap-2 rounded-[8px] border px-3 text-[12px] transition hover:bg-white/[0.02]"
        style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
      >
        <span className="truncate">{valueLabel}</span>
        <ChevronDown className="h-4 w-4" style={{ color: TEXT_MUTED }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-[8px] border"
          style={{ borderColor: BORDER, background: PANEL }}
        >
          <div className="p-1 max-h-[320px] overflow-auto">{children}</div>
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

/* ===================== PAGE ===================== */
export default function GenerateKeysPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [collections, setCollections] = useState<CollectionRow[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const role = useMemo<'client' | 'empresarial'>(() => normalizeRoleFromPlan(user?.plan), [user?.plan])
  const isNonePlan = (user?.plan || 'none').toLowerCase() === 'none'

  // ✅ AGORA: client pode gerar (se vinculado no backend). Só bloqueia se for none.
  const locked = isNonePlan

  const [err, setErr] = useState<string | null>(null)

  const [projectOpen, setProjectOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)

  const [projectId, setProjectId] = useState('')
  const [collectionId, setCollectionId] = useState('')

  // ✅ começa em 0 (visual), precisa >= 1 pra gerar
  const [qty, setQty] = useState('0')

  // ✅ expiração padrão 7 dias (0 = sem expiração)
  const [expirationDays, setExpirationDays] = useState('7')

  const [submitting, setSubmitting] = useState(false)
  const [generated, setGenerated] = useState<string[]>([])
  const [inserted, setInserted] = useState<number | null>(null)

  const [copied, setCopied] = useState(false)

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

    async function loadData() {
      setLoadingData(true)
      setErr(null)
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/projects', { method: 'GET', credentials: 'include' }),
          fetch('/api/collections', { method: 'GET', credentials: 'include' }),
        ])

        if (!pRes.ok) throw new Error('Falha ao carregar projetos.')
        if (!cRes.ok) throw new Error('Falha ao carregar coleções.')

        const pData = (await pRes.json()) as ProjectsResponse
        const cData = (await cRes.json()) as CollectionsResponse

        setProjects(pData.projects || [])
        setCollections(cData.collections || [])

        const firstProjectId = pData.projects?.[0]?.id || ''
        setProjectId(firstProjectId)

        const firstCollectionId =
          (cData.collections || []).find((c) => String(c.projectId) === String(firstProjectId))?.id || ''
        setCollectionId(firstCollectionId)
      } catch (e: any) {
        setErr(e?.message || 'Erro ao carregar dados.')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user])

  const selectedProject = useMemo(() => projects.find((p) => p.id === projectId) || null, [projects, projectId])

  const collectionsForProject = useMemo(() => {
    if (!projectId) return []
    return collections.filter((c) => String(c.projectId) === String(projectId))
  }, [collections, projectId])

  const selectedCollection = useMemo(
    () => collectionsForProject.find((c) => c.id === collectionId) || null,
    [collectionsForProject, collectionId],
  )

  useEffect(() => {
    if (!projectId) return
    const first = collectionsForProject[0]?.id || ''
    setCollectionId(first)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(generated.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }

  const qtyNum = useMemo(() => {
    const n = Number(qty || 0)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(MAX_QTY, Math.floor(n)))
  }, [qty])

  const expDaysNum = useMemo(() => {
    const n = Number(expirationDays || 0)
    if (!Number.isFinite(n)) return 7
    return Math.max(0, Math.min(MAX_EXP_DAYS, Math.floor(n)))
  }, [expirationDays])

  const canGenerate = !!projectId && !!collectionId && qtyNum >= 1 && !locked && !submitting

  async function onGenerate() {
    try {
      setErr(null)
      setSubmitting(true)
      setGenerated([])
      setInserted(null)

      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          collectionId,
          quantity: qtyNum,
          expirationDays: expDaysNum,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Falha ao gerar keys.')

      setGenerated(data?.sample || data?.keys || [])
      setInserted(
        data?.inserted ??
          (Array.isArray(data?.sample || data?.keys) ? (data?.sample || data?.keys).length : null),
      )
    } catch (e: any) {
      setErr(e?.message || 'Erro ao gerar keys.')
    } finally {
      setSubmitting(false)
    }
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
            Pages <span className="mx-1">/</span> Keys <span className="mx-1">/</span> Generate
          </p>

          <div className="mt-1 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[18px] font-semibold">Gerar Keys</h1>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                Selecione o projeto, a coleção, a quantidade e a expiração das chaves.
              </p>
            </div>

            {/* badge plano */}
            <div
              className="hidden md:inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px]"
              style={{ borderColor: BORDER, background: PANEL2, color: TEXT_MUTED }}
            >
              <ShieldCheck
                className="h-4 w-4"
                style={{ color: role === 'empresarial' ? ACCENT : '#60A5FA' }}
              />
              {role === 'empresarial' ? 'empresarial' : 'client'}
            </div>
          </div>
        </div>

        {err ? (
          <p className="mb-4 text-[12px]" style={{ color: DANGER }}>
            {err}
          </p>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2 items-start">
          {/* CONFIG */}
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-3">
                <IconSquare>
                  <Layers className="h-5 w-5" style={{ color: DETAILS }} />
                </IconSquare>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">Configurações</p>
                  <p className="mt-1 text-[12px] truncate" style={{ color: TEXT_MUTED }}>
                    Defina destino, quantidade e expiração.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Dropdown
                  label="Projeto"
                  valueLabel={
                    loadingData
                      ? 'Carregando...'
                      : selectedProject
                      ? `${selectedProject.name}`
                      : projects.length
                      ? 'Selecionar projeto'
                      : 'Sem projetos'
                  }
                  open={projectOpen}
                  setOpen={setProjectOpen}
                >
                  {projects.length === 0 ? (
                    <div className="px-3 py-2 text-[12px]" style={{ color: TEXT_MUTED }}>
                      Nenhum projeto encontrado.
                    </div>
                  ) : (
                    projects.map((p) => (
                      <DropItem
                        key={p.id}
                        label={p.name}
                        active={p.id === projectId}
                        onClick={() => {
                          setProjectId(p.id)
                          setProjectOpen(false)
                        }}
                        right={
                          <span className="inline-flex items-center gap-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                            <FolderKanban className="h-3.5 w-3.5" />
                            {p.collectionsCount}
                          </span>
                        }
                      />
                    ))
                  )}
                </Dropdown>

                <Dropdown
                  label="Coleção"
                  valueLabel={
                    loadingData
                      ? 'Carregando...'
                      : selectedCollection
                      ? `${selectedCollection.name} • ${selectedCollection.database}`
                      : projectId
                      ? 'Selecionar coleção'
                      : 'Selecione um projeto'
                  }
                  open={collectionOpen}
                  setOpen={setCollectionOpen}
                >
                  {!projectId ? (
                    <div className="px-3 py-2 text-[12px]" style={{ color: TEXT_MUTED }}>
                      Selecione um projeto primeiro.
                    </div>
                  ) : collectionsForProject.length === 0 ? (
                    <div className="px-3 py-2 text-[12px]" style={{ color: TEXT_MUTED }}>
                      Nenhuma coleção vinculada a este projeto.
                    </div>
                  ) : (
                    collectionsForProject.map((c) => (
                      <DropItem
                        key={c.id}
                        label={`${c.name} • ${c.database}`}
                        active={c.id === collectionId}
                        onClick={() => {
                          setCollectionId(c.id)
                          setCollectionOpen(false)
                        }}
                        right={
                          <span className="inline-flex items-center gap-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                            <Database className="h-3.5 w-3.5" />
                            {c.keysTotal}
                          </span>
                        }
                      />
                    ))
                  )}
                </Dropdown>
              </div>

              {/* quantidade + expiração lado a lado */}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="w-full">
                  <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                    Quantidade (1–{MAX_QTY})
                  </p>

                  <div
                    className="flex h-[40px] items-center gap-2 rounded-[8px] border px-3"
                    style={{ borderColor: BORDER, background: PANEL2 }}
                  >
                    <Sparkle className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                    <input
                      value={qty}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="text"
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault()
                      }}
                      onChange={(e) => {
                        const cleaned = (e.target.value || '').replace(/\D/g, '')
                        if (!cleaned) return setQty('0')
                        const n = Number(cleaned)
                        if (!Number.isFinite(n)) return
                        if (n > MAX_QTY) return setQty(String(MAX_QTY))
                        setQty(String(n))
                      }}
                      className="h-full w-full bg-transparent text-[12px] outline-none"
                      style={{ color: TEXT_SOFT }}
                      placeholder="0"
                    />
                  </div>

                  {qtyNum === 0 ? (
                    <p className="mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                      Para gerar, a quantidade precisa ser pelo menos 1.
                    </p>
                  ) : null}
                </div>

                <div className="w-full">
                  <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                    Expiração (dias)
                  </p>

                  <div
                    className="flex h-[40px] items-center gap-2 rounded-[8px] border px-3"
                    style={{ borderColor: BORDER, background: PANEL2 }}
                  >
                    <Clock className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                    <input
                      value={expirationDays}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="text"
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault()
                      }}
                      onChange={(e) => {
                        const cleaned = (e.target.value || '').replace(/\D/g, '')
                        if (!cleaned) return setExpirationDays('0')
                        const n = Number(cleaned)
                        if (!Number.isFinite(n)) return
                        if (n > MAX_EXP_DAYS) return setExpirationDays(String(MAX_EXP_DAYS))
                        setExpirationDays(String(n))
                      }}
                      className="h-full w-full bg-transparent text-[12px] outline-none"
                      style={{ color: TEXT_SOFT }}
                      placeholder="7"
                    />
                  </div>

                  <p className="mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                    0 = sem expiração. Padrão: 7 dias.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onGenerate}
                    disabled={!canGenerate}
                    className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: 'rgba(62,207,176,0.18)',
                      background: 'rgba(62,207,176,0.12)',
                      color: DETAILS,
                    }}
                  >
                    {submitting ? 'Gerando…' : 'Gerar'}
                  </button>

                  {/* badge plano (mobile) */}
                  <div
                    className="inline-flex md:hidden items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px]"
                    style={{ borderColor: BORDER, background: PANEL2, color: TEXT_MUTED }}
                  >
                    <ShieldCheck
                      className="h-4 w-4"
                      style={{ color: role === 'empresarial' ? ACCENT : '#60A5FA' }}
                    />
                    {role === 'empresarial' ? 'empresarial' : 'client'}
                  </div>
                </div>

                <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                  {inserted === null ? '—' : `Inseridas: ${inserted}`}
                </p>
              </div>
            </div>
          </Card>

          {/* RESULT */}
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">Resultado</p>
                  <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                    Copie as chaves geradas ou gere novamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyAll}
                  disabled={!generated.length}
                  className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
                >
                  {copied ? <Check className="h-4 w-4" style={{ color: ACCENT }} /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              {!generated.length ? (
                <div className="rounded-[8px] border px-4 py-3" style={{ borderColor: BORDER, background: PANEL2 }}>
                  <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                    Nenhuma chave gerada ainda.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                      Mostrando {generated.length} chave(s).
                    </p>
                    <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                      {inserted === null ? '' : `Inseridas: ${inserted}`}
                    </p>
                  </div>

                  <div
                    className="rounded-[8px] border p-3 max-h-[520px] overflow-auto"
                    style={{ borderColor: BORDER, background: PANEL2 }}
                  >
                    <pre className="text-[12px] leading-6 whitespace-pre-wrap break-words" style={{ color: TEXT_SOFT }}>
                      {generated.join('\n')}
                    </pre>
                  </div>

                  <p className="mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                    Salve essas chaves em um lugar seguro. Esta tela mostra apenas a amostra retornada pela API.
                  </p>
                </>
              )}
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}
