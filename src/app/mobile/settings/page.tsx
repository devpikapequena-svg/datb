'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  KeyRound,
  Settings,
  Smartphone,
  LogOut,
  ShieldCheck,
  Key,
  Mail,
  User,
} from 'lucide-react'

type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
}

const BG = '#090909'
const PANEL = 'rgba(12, 12, 12, 1)'
const PANEL2 = '#111111ff'
const BORDER = 'rgba(255, 255, 255, 0.06)'
const TEXT_SOFT = 'rgba(255,255,255,0.70)'
const TEXT_MUTED = 'rgba(255,255,255,0.42)'
const ACCENT = '#2FD3B5'

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

export default function MobileSettingsPage() {
  const router = useRouter()

  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [user, setUser] = useState<UserMe | null>(null)

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

  const planLabel = useMemo(() => {
    const p = String(user?.plan || 'none').toLowerCase()
    if (p === 'client') return 'Client'
    if (p === 'empresarial') return 'Empresarial'
    return 'Sem plano'
  }, [user?.plan])

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
            Pages <span className="mx-1">/</span> Settings
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[18px] font-semibold leading-tight">Configurações</p>
              <p className="mt-1 text-[12px] truncate" style={{ color: TEXT_MUTED }}>
                Conta e segurança
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

        {/* perfil */}
        <Card className="p-4">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Perfil
          </p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 rounded-[10px] border px-3 py-3" style={{ borderColor: BORDER, background: PANEL2 }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border" style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.03)' }}>
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate">{user.name}</p>
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {planLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[10px] border px-3 py-3" style={{ borderColor: BORDER, background: PANEL2 }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border" style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.03)' }}>
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold">E-mail</p>
                <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* segurança */}
        <Card className="mt-4 p-4">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Segurança
          </p>

          <div className="mt-3 space-y-2">
            <button
              type="button"
              className="w-full text-left flex items-center justify-between gap-3 rounded-[10px] border px-3 py-3"
              style={{ borderColor: BORDER, background: PANEL2 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border" style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.03)' }}>
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold">Senha e 2FA</p>
                </div>
              </div>

              <ShieldCheck className="h-4 w-4" style={{ color: ACCENT, opacity: 0.9 }} />
            </button>
          </div>
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
            
            <Link href="/mobile/keys" className="flex flex-col items-center gap-1 text-white/60">
              <KeyRound className="h-4 w-4" />
              <span>Keys</span>
            </Link>

            <Link href="/mobile/settings" className="flex flex-col items-center gap-1 text-white">
              <Settings className="h-4 w-4" />
              <span>Config</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
