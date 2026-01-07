// src/app/settings/page.tsx
'use client'
import imageCompression from 'browser-image-compression'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  User,
  Shield,
  Key,
  Database,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  Link,
  Unlink,
  Monitor,
  MapPin,
  Clock,
  Smartphone,
} from 'lucide-react'

/* ===================== TYPES ===================== */
type UserMe = {
  id: string
  name: string
  email: string
  plan?: 'client' | 'empresarial' | 'none' | string
  image?: string | null
}

type Session = {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

type Integration = {
  id: string
  name: string
  connected: boolean
  config?: any
}

/* ===================== THEME (same as dashboard) ===================== */
const BG = '#090909'
const PANEL = 'rgba(12, 12, 12, 1)'
const PANEL2 = '#111111ff'
const BORDER = 'rgba(255, 255, 255, 0.03)'
const BORDER2 = 'rgba(255, 255, 255, 0.07)'
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

function Button({
  children,
  onClick,
  variant = 'default',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'accent' | 'danger'
  className?: string
  disabled?: boolean
}) {
  const styles = {
    default: { borderColor: BORDER, background: PANEL2, color: TEXT_SOFT },
    accent: { borderColor: 'rgba(62,207,176,0.18)', background: 'rgba(62,207,176,0.12)', color: DETAILS },
    danger: { borderColor: 'rgba(248,113,113,0.18)', background: 'rgba(248,113,113,0.12)', color: DANGER },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[12px] transition hover:bg-white/[0.02] ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={styles[variant]}
    >
      {children}
    </button>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      {label && (
        <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>
          {label}
        </p>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[40px] w-full rounded-[8px] border px-3 text-[12px] outline-none"
        style={{
          borderColor: BORDER,
          background: PANEL2,
          color: TEXT_SOFT,
        }}
      />
    </div>
  )
}

/* ===================== TABS ===================== */
function Tabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="px-4 py-3 text-[12px] transition"
          style={{
            color: activeTab === tab.id ? DETAILS : TEXT_MUTED,
            borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ===================== MAIN TAB ===================== */
function MainTab({ user, onUpdateUser }: { user: UserMe; onUpdateUser: (updates: Partial<UserMe>) => void }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validação básica no frontend
  if (!file.type.startsWith('image/')) {
    return
  }
  if (file.size > 2 * 1024 * 1024) { // 2 MB limite no frontend
    return
  }

  try {
    // NOVO: Comprimir a imagem para reduzir tamanho
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.5, // Máximo 0.5 MB (ajuste conforme necessário)
      maxWidthOrHeight: 512, // Reduz resolução
      useWebWorker: true,
    })
    console.log('Imagem comprimida:', { originalSize: file.size, compressedSize: compressedFile.size })

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      console.log('Frontend: Base64 image length after compression:', base64.length)
      try {
        const res = await fetch('/api/settings/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: base64 }),
        })
        if (res.ok) {
          const data = await res.json()
          console.log('Frontend: Response from /api/settings/profile:', {
            name: data.name,
            email: data.email,
            imageLength: data.image ? data.image.length : 0,
          })
          onUpdateUser({ image: data.image })
        } else {
          const error = await res.json()
        }
      } catch (error) {
        console.error('Erro ao atualizar avatar:', error)
      }
    }
    reader.readAsDataURL(compressedFile) // Use o arquivo comprimido
  } catch (error) {
    console.error('Erro ao comprimir/processar imagem:', error)
  }
}
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdateUser({ name: data.name, email: data.email })
      } else {
        const error = await res.json()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return alert('Passwords do not match')
    setChangingPassword(true)
    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await res.json()
      }
    } catch (error) {
      console.error('Error changing password:', error)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleToggle2FA = () => {
    setTwoFAEnabled(!twoFAEnabled)
    // Implement 2FA toggle API if needed
  }

  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <IconSquare>
            <User className="h-5 w-5" style={{ color: DETAILS }} />
          </IconSquare>
          <div>
            <h3 className="text-[15px] font-semibold">Profile</h3>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Manage your account details</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={handleAvatarClick}>
              {user.image ? (
                <img
                  src={user.image}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full border"
                  style={{ borderColor: BORDER }}
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full border flex items-center justify-center text-[18px] font-semibold"
                  style={{ borderColor: BORDER2, color: DETAILS }}
                >
                  {initial}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <div>
              <p className="text-[13px] font-semibold">{user.name}</p>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{user.email}</p>
            </div>
          </div>
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Email" value={email} onChange={setEmail} type="email" />
          <Button onClick={handleSaveProfile} variant="accent" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Security Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <IconSquare>
            <Shield className="h-5 w-5" style={{ color: DETAILS }} />
          </IconSquare>
          <div>
            <h3 className="text-[15px] font-semibold">Security</h3>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Update password and enable 2FA</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>Current Password</p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-[40px] w-full rounded-[8px] border px-3 pr-10 text-[12px] outline-none"
                style={{ borderColor: BORDER, background: PANEL2, color: TEXT_SOFT }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-4 w-4" style={{ color: TEXT_MUTED }} /> : <Eye className="h-4 w-4" style={{ color: TEXT_MUTED }} />}
              </button>
            </div>
          </div>
          <Input label="New Password" value={newPassword} onChange={setNewPassword} type="password" />
          <Input label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
          <Button onClick={handleChangePassword} variant="accent" disabled={changingPassword}>
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" style={{ color: TEXT_MUTED }} />
              <div>
                <p className="text-[13px] font-semibold">Two-Factor Authentication</p>
                <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Add an extra layer of security</p>
              </div>
            </div>
            <Button onClick={handleToggle2FA} variant={twoFAEnabled ? 'danger' : 'accent'}>
              {twoFAEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ===================== SESSIONS TAB ===================== */
function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/settings/sessions', { method: 'GET', credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setSessions(data.sessions || [])
        } else {
          const error = await res.json()
          console.error('Failed to fetch sessions:', error.error)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  const handleRevoke = async (id: string) => {
    setRevoking(id)
    try {
      const res = await fetch('/api/settings/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: id }),
      })
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id))
      } else {
        const error = await res.json()
      }
    } catch (error) {
      console.error('Error revoking session:', error)
    } finally {
      setRevoking(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 rounded-full border border-white/10 border-t-white/50 animate-spin" />
      </div>
    )
  }

  const currentSession = sessions.find(s => s.current)
  const otherSessions = sessions.filter(s => !s.current)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Session */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <IconSquare>
            <Key className="h-5 w-5" style={{ color: DETAILS }} />
          </IconSquare>
          <div>
            <h3 className="text-[15px] font-semibold">Current Session</h3>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Your active session</p>
          </div>
        </div>
        {currentSession && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" style={{ color: TEXT_MUTED }} />
              <p className="text-[13px]">{currentSession.device}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: TEXT_MUTED }} />
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{currentSession.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: TEXT_MUTED }} />
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Last active: {formatWhen(currentSession.lastActive)}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Other Sessions */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <IconSquare>
            <Shield className="h-5 w-5" style={{ color: DETAILS }} />
          </IconSquare>
          <div>
            <h3 className="text-[15px] font-semibold">Other Sessions</h3>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Manage other active sessions</p>
          </div>
        </div>
        <div className="space-y-3">
          {otherSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-[8px] border" style={{ borderColor: BORDER, background: PANEL2 }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                  <p className="text-[13px]">{s.device}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                  <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{s.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                  <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{formatWhen(s.lastActive)}</p>
                </div>
              </div>
              <Button variant="danger" onClick={() => handleRevoke(s.id)} disabled={revoking === s.id}>
                <Trash2 className="h-4 w-4" />
                {revoking === s.id ? 'Revoking...' : ''}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ===================== INTEGRATIONS TAB ===================== */
function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [mongoUri, setMongoUri] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Fetch integrations on mount
  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const res = await fetch('/api/settings/integrations', { method: 'GET', credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          // Se não houver integrações, definir uma padrão (MongoDB desconectada)
          const fetchedIntegrations = data.integrations || []
          if (fetchedIntegrations.length === 0) {
            setIntegrations([{ id: 'mongo', name: 'MongoDB', connected: false }])
          } else {
            setIntegrations(fetchedIntegrations)
          }
        } else {
          console.error('Failed to fetch integrations')
          // Fallback: definir padrão se falhar
          setIntegrations([{ id: 'mongo', name: 'MongoDB', connected: false }])
        }
      } catch (error) {
        console.error('Error fetching integrations:', error)
        // Fallback: definir padrão se erro
        setIntegrations([{ id: 'mongo', name: 'MongoDB', connected: false }])
      } finally {
        setLoading(false)
      }
    }
    fetchIntegrations()
  }, [])

  const handleConnect = async (id: string, uri: string) => {
    setConnecting(true)
    try {
      const res = await fetch('/api/settings/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, uri }),
      })
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data.integrations || [])
        setMongoUri('')
      } else {
        const error = await res.json()
      }
    } catch (error) {
      console.error('Error connecting:', error)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    setDisconnecting(id)
    try {
      const res = await fetch('/api/settings/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data.integrations || [])
      } else {
        const error = await res.json()
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 rounded-full border border-white/10 border-t-white/50 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {integrations.map((int) => (
        <Card key={int.id} className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <IconSquare>
              <Database className="h-5 w-5" style={{ color: DETAILS }} />
            </IconSquare>
            <div>
              <h3 className="text-[15px] font-semibold">{int.name}</h3>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                {int.connected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {!int.connected && (
            <div className="space-y-4">
              <Input label="MongoDB URI" value={mongoUri} onChange={setMongoUri} placeholder="mongodb://..." />
              <Button onClick={() => handleConnect(int.id, mongoUri)} variant="accent" disabled={connecting}>
                <Link className="h-4 w-4" />
                {connecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          )}
          {int.connected && (
            <Button variant="danger" onClick={() => handleDisconnect(int.id)} disabled={disconnecting === int.id}>
              <Unlink className="h-4 w-4" />
              {disconnecting === int.id ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}

/* ===================== PAGE ===================== */
export default function SettingsPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserMe | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [activeTab, setActiveTab] = useState('main')

  const tabs = [
    { id: 'main', label: 'Main' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'integrations', label: 'Integrations' },
  ]

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

  const handleUpdateUser = (updates: Partial<UserMe>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null)
  }

  if (loadingUser) return <FullscreenLoader />

  return (
    <div className="flex min-h-screen text-white" style={{ background: BG }}>
      <Sidebar user={user || { id: '', name: '', email: '' }} />

      <main className="ml-64 w-full px-10 py-8">
        {/* header */}
        <div className="mb-6">
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Pages <span className="mx-1">/</span> Settings
          </p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[18px] font-semibold">Settings</h1>
              <p className="mt-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                Gerencie sua conta, sessões e integrações.
              </p>
            </div>
          </div>
        </div>

        {/* tabs */}
        <Card className="mb-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </Card>

        {/* content */}
        <div>
          {activeTab === 'main' && <MainTab user={user!} onUpdateUser={handleUpdateUser} />}
          {activeTab === 'sessions' && <SessionsTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
        </div>
      </main>
    </div>
  )
}