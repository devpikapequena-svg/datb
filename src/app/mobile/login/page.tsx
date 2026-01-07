// src/app/login/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ArrowRight, Loader2 } from 'lucide-react'
import Footer from '@/components/Footer'

const ACCENT = '#2FD3B5'
const BG = '#0D0D0D'

// helper
function getDeviceInfo(userAgent: string): string {
  let browser = 'Navegador desconhecido'
  let os = 'Sistema desconhecido'

  if (userAgent.includes('OPR') || userAgent.includes('Opera')) browser = 'Opera'
  else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
  else if (userAgent.includes('Edg')) browser = 'Edge'
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer'

  if (userAgent.includes('Windows NT')) os = 'Windows'
  else if (userAgent.includes('Mac OS X')) os = 'macOS'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'
  else if (userAgent.includes('Linux')) os = 'Linux'

  return `${browser} • ${os}`
}

async function resolveLocation(): Promise<string> {
  let location = 'Localização desconhecida'
  const base = 'https://ip-api.com/json'

  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      const { latitude, longitude } = position.coords
      const geoRes = await fetch(`${base}?lat=${latitude}&lon=${longitude}`)
      const geoData = await geoRes.json()
      location = `${geoData.city || 'Cidade desconhecida'}, ${geoData.country || 'País desconhecido'}`
      return location
    } catch {}
  }

  try {
    const ipRes = await fetch(base)
    const ipData = await ipRes.json()
    location = `${ipData.city || 'Cidade desconhecida'}, ${ipData.country || 'País desconhecido'}`
  } catch {}

  return location
}

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth <= 768
    if (isMobile) router.replace('/mobile/login')
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => !!email.trim() && !!password.trim() && !loading, [email, password, loading])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    try {
      setLoading(true)

      const device = getDeviceInfo(navigator.userAgent)
      const location = await resolveLocation()

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, device, location }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Não foi possível entrar na conta.')
        return
      }

      router.push('/mobile')
    } catch (err) {
      console.error(err)
      setError('Erro ao comunicar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: BG }}>
      {/* ✅ Fix iOS zoom: garante 16px nos inputs no mobile */}
      <style jsx global>{`
        @supports (-webkit-touch-callout: none) {
          input,
          select,
          textarea {
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <header className="relative z-20">
        <div className="mx-auto flex h-[78px] max-w-8xl items-center justify-between px-4 md:px-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-28 w-28">
              <Image
                src="https://cdn.prod.website-files.com/6778925b37f612538b12b019/677cbafaa9a247fdba85af61_Logo.png"
                alt="Database"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[13px] text-white/70 md:flex">
            {['Funcionalidades', 'Planos', 'Segurança', 'Docs'].map((label) => (
              <button
                key={label}
                type="button"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"
              >
                {label}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] text-white/85">
              Entrar
            </Link>

            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-[8px] bg-white px-5 text-[13px] font-medium text-black hover:bg-white/90"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="relative z-10">
        <section className="relative w-full overflow-hidden pb-72 pt-6 md:pt-10 md:pb-96">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Image src="/hero.png" alt="" fill priority className="object-cover object-[70%_18%] opacity-[1.05]" />
            <div className="absolute inset-x-0 bottom-0 h-[220px] bg-[linear-gradient(to_bottom,_transparent_0%,_rgba(13,13,13,0.78)_45%,_rgba(13,13,13,1)_100%)]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-12">
            <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
              <div className="max-w-xl">
                <h1 className="mt-3 text-[40px] leading-[1.06] tracking-[-0.03em] text-white/90 md:text-[54px]">
                  Bem-vindo de volta ao <span style={{ color: ACCENT }}>Database</span>
                </h1>
              </div>

              <div className="relative">
                <div className="rounded-[20px] border border-white/10 bg-[#0B0B0B]/80 p-7 md:p-9">
                  <div className="mb-8">
                    <p className="text-[14px] font-semibold text-white/90">Entrar na sua conta</p>
                    <p className="mt-1 text-[12px] text-white/50">Informe seus dados abaixo</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-white/45">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        autoComplete="email"
                        inputMode="email"
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[16px] md:text-[13px] text-white/90 outline-none placeholder:text-white/30"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">Senha</label>
                        <Link href="/forgot-password" className="text-[11px] text-white/45 hover:text-white/70">
                          Esqueceu?
                        </Link>
                      </div>

                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[16px] md:text-[13px] text-white/90 outline-none placeholder:text-white/30"
                      />
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-medium text-black hover:bg-white/90 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          Entrar
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>

                    <p className="pt-2 text-center text-[12px] text-white/45">
                      Não tem uma conta?{' '}
                      <Link href="/signup" style={{ color: ACCENT }} className="font-medium hover:underline">
                        Criar agora
                      </Link>
                    </p>
                  </form>
                </div>

                <p className="mt-4 text-center text-[11px] text-white/35 md:text-left">
                  Ao entrar, você concorda com nossos Termos e Condições.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
