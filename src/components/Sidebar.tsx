// components/Sidebar.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import SidebarItem from './SidebarItem'
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  KeyRound,
  Settings,
  Menu,
  X,
  Database as DatabaseIcon,
  ChevronDown,
  ChevronRight,
  FileText,
  CreditCard,
  LogOut,
  List,
  Layers,
} from 'lucide-react'

type SidebarUser = {
  id?: string
  name?: string
  email?: string
  plan?: 'client' | 'empresarial' | string
  image?: string | null
}

const BG = '#090909'
const BORDER = '#141414ff'
const TEXT_MUTED = '#6b7280'
const ACCENT = '#34d399'

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const router = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const userWrapRef = useRef<HTMLDivElement | null>(null)

  const avatarUrl = user?.image || '/avatar.jpg'

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const closeMobile = () => setMobileOpen(false)

  const coreItems = useMemo(
    () => [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/collections', label: 'Collections', icon: Database },
    ],
    [],
  )

  // auto abre dropdown de keys quando estiver em /keys
  useEffect(() => {
    if (pathname.startsWith('/keys')) setKeysOpen(true)
  }, [pathname])

  // fecha dropdown clicando fora
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (userWrapRef.current && !userWrapRef.current.contains(t)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <>
      {/* MOBILE BTN */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 rounded-xl px-2.5 py-2 border"
        style={{ background: BG, borderColor: BORDER }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
          'border-r',
          'px-5 py-6',
          'transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{ background: BG, borderColor: BORDER }}
      >
        {/* CLOSE MOBILE */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-3 right-3 p-2 rounded-xl border"
          style={{ background: BG, borderColor: BORDER }}
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* LOGO */}
        <div className="mb-7 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg">
            <DatabaseIcon size={22} color={ACCENT} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white/90">Database</span>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1">
          <div className="space-y-1">
            {coreItems.map((it) => (
              <SidebarItem
                key={it.href}
                href={it.href}
                icon={it.icon}
                label={it.label}
                active={isActive(it.href)}
                accent={ACCENT}
                onClick={closeMobile}
              />
            ))}

            {/* KEYS GROUP */}
            <button
              type="button"
              onClick={() => setKeysOpen((v) => !v)}
              className="mt-2 w-full rounded-xl px-3 py-2 flex items-center gap-3 transition-colors hover:bg-white/[0.03]"
            >
              <KeyRound className="h-[18px] w-[18px]" style={{ color: 'rgba(255,255,255,0.70)' }} />
              <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.82)' }}>
                Keys
              </span>

              <span className="ml-auto">
                {keysOpen ? (
                  <ChevronDown className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
                ) : (
                  <ChevronRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
                )}
              </span>
            </button>

            {keysOpen && (
              <div className="mt-2 space-y-1 pl-2">
                    <SidebarItem
                  href="/keys/generate"
                  icon={Layers}
                  label="Gen Keys"
                  active={isActive('/keys/generate')}
                  accent={ACCENT}
                  onClick={closeMobile}
                />
                <SidebarItem
                  href="/keys"
                  icon={List}
                  label="List Keys"
                  active={isActive('/keys') && !isActive('/keys/generate')}
                  accent={ACCENT}
                  onClick={closeMobile}
                />
            
              </div>
            )}
          </div>

          {/* OTHERS */}
          <div className="mt-8">
            <p
              className="px-2 text-[11px] font-semibold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Others
            </p>

            {/* Resources */}
            <button
              type="button"
              onClick={() => setResourcesOpen((v) => !v)}
              className="mt-2 w-full rounded-xl px-3 py-2 flex items-center gap-3 transition-colors hover:bg-white/[0.03]"
            >
              <FileText className="h-[18px] w-[18px]" style={{ color: 'rgba(255,255,255,0.70)' }} />
              <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.82)' }}>
                Resources
              </span>

              <span className="ml-auto">
                {resourcesOpen ? (
                  <ChevronDown className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
                ) : (
                  <ChevronRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
                )}
              </span>
            </button>

            {resourcesOpen && (
              <div className="mt-2 space-y-1 pl-2">
                <SidebarItem
                  href="/plans"
                  icon={CreditCard}
                  label="Plans"
                  active={isActive('/plans')}
                  accent={ACCENT}
                  onClick={closeMobile}
                />
                <SidebarItem
                  href="/settings"
                  icon={Settings}
                  label="Settings"
                  active={isActive('/settings')}
                  accent={ACCENT}
                  onClick={closeMobile}
                />
              </div>
            )}
          </div>
        </nav>

        {/* USER AREA */}
        <div className="mt-6 pt-3 border-t" style={{ borderColor: BORDER }}>
          <div ref={userWrapRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-full rounded-xl px-2 py-2 flex items-center gap-3 hover:bg-white/[0.03] transition-colors"
            >
              <div
                className="relative h-9 w-9 overflow-hidden rounded-full border"
                style={{ borderColor: BORDER, background: '#151618' }}
              >
                <Image src={avatarUrl} alt={user?.name || user?.email || 'User'} fill className="object-cover" />
              </div>

              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-white/90 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                  {user?.email || ''}
                </p>
              </div>

              <span className="ml-auto flex items-center justify-center h-8 w-8 rounded-lg">
                <ChevronDown className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.70)' }} />
              </span>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 bottom-full mb-2 w-[190px] rounded-xl border overflow-hidden"
                style={{ borderColor: BORDER, background: '#0b0b0b' }}
              >
                <div className="px-3 py-2 border-b" style={{ borderColor: BORDER }}>
                  <p className="text-[12px] font-semibold text-white/90 truncate">{user?.name || 'User'}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => {
                    setUserMenuOpen(false)
                    closeMobile()
                  }}
                  className="px-3 py-2 flex items-center gap-2 hover:bg-white/[0.03] transition-colors"
                >
                  <Settings className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.78)' }} />
                  <span className="text-[12px] text-white/85">Settings</span>
                </Link>

                <Link
                  href="/plans"
                  onClick={() => {
                    setUserMenuOpen(false)
                    closeMobile()
                  }}
                  className="px-3 py-2 flex items-center gap-2 hover:bg-white/[0.03] transition-colors"
                >
                  <CreditCard className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.78)' }} />
                  <span className="text-[12px] text-white/85">Plans</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    closeMobile()
                    router.push('/logout') // troque pra sua rota real
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/[0.03] transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.78)' }} />
                  <span className="text-[12px] text-white/85">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
