// src/app/signup/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ArrowRight, Loader2 } from 'lucide-react'
import Footer from '@/components/Footer'

const ACCENT = '#2FD3B5'
const BG = '#0D0D0D'

export default function SignupPage() {
  const router = useRouter()
  const search = useSearchParams()
  const planFromUrl = search.get('plan') // opcional: ?plan=client | ?plan=empresarial

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (!name.trim()) return false
    if (!email.trim()) return false
    if (password.length < 6) return false
    if (password !== confirmPassword) return false
    return true
  }, [name, email, password, confirmPassword, loading])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // mantém seu payload, só adiciona plan se vier na URL (não quebra nada)
        body: JSON.stringify({ name, email, password, plan: planFromUrl || undefined }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Não foi possível criar a conta.')
        return
      }

      router.push('/login?message=Conta criada com sucesso. Faça login.')
    } catch (err) {
      console.error(err)
      setError('Erro ao comunicar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: BG }}>
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

       
 {/* CENTER - NAV (centralizado de verdade) */}
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
            <Link href="/login" className="text-[13px] text-white/85 hover:text-white">
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
        <section className="relative w-full overflow-hidden pb-72 pt-12 md:pt-16 md:pb-96">
          {/* HERO */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Image
              src="/hero.png"
              alt=""
              fill
              priority
              className="object-cover object-[70%_18%] opacity-[1.05]"
            />
            <div className="absolute inset-x-0 bottom-0 h-[220px] bg-[linear-gradient(to_bottom,_transparent_0%,_rgba(13,13,13,0.78)_45%,_rgba(13,13,13,1)_100%)]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pt-14 md:px-6 md:pt-14">
            <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
              {/* LEFT */}
              <div className="max-w-xl">
                <h1 className="mt-0 text-[40px] leading-[1.06] tracking-[-0.03em] text-white/90 md:text-[54px]">
                  Crie sua conta no{' '}
                  <span style={{ color: ACCENT }} className="whitespace-nowrap">
                    Database
                  </span>
                </h1>

                <p className="mt-4 max-w-[560px] text-[13px] leading-relaxed text-white/55 md:text-[14px]">
                  Crie sua conta para acessar o painel e começar a usar a plataforma.
                  {planFromUrl ? (
                    <>
                      {' '}
                      Você está criando uma conta para o plano{' '}
                      <b className="text-white/80">{planFromUrl}</b>.
                    </>
                  ) : null}
                </p>

                <div className="mt-8 flex items-center gap-2 text-[12px] text-white/55">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT, opacity: 0.9 }} />
                  <span>Cadastro rápido • Acesso seguro • Painel instantâneo</span>
                </div>
              </div>

              {/* RIGHT CARD (mesmo design do login) */}
              <div className="relative">
                <div className="pointer-events-none absolute -inset-12 -z-10" />

                <div className="rounded-[20px] border border-white/10 bg-[#0B0B0B]/80 p-7 md:p-9">
                  <div className="mb-8">
                    <p className="text-[14px] font-semibold tracking-[-0.01em] text-white/90">
                      Criar conta
                    </p>
                    <p className="mt-1 text-[12px] text-white/50">
                      Preencha as informações abaixo
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* NOME */}
                    <div>
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-white/45">
                        Nome
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        autoComplete="name"
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[13px] text-white/90 outline-none placeholder:text-white/30 focus:border-white/20 transition"
                      />
                    </div>

                    {/* EMAIL */}
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
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[13px] text-white/90 outline-none placeholder:text-white/30 focus:border-white/20 transition"
                      />
                    </div>

                    {/* SENHA */}
                    <div>
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-white/45">
                        Senha
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[13px] text-white/90 outline-none placeholder:text-white/30 focus:border-white/20 transition"
                      />
                      <p className="mt-2 text-[11px] text-white/35">
                        Mínimo de 6 caracteres.
                      </p>
                    </div>

                    {/* CONFIRMAR SENHA */}
                    <div>
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-white/45">
                        Confirmar senha
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[13px] text-white/90 outline-none placeholder:text-white/30 focus:border-white/20 transition"
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
                      className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          Criar conta
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>

                    <p className="pt-2 text-center text-[12px] text-white/45">
                      Já tem uma conta?{' '}
                      <Link href="/login" style={{ color: ACCENT }} className="font-medium hover:underline">
                        Entrar
                      </Link>
                    </p>
                  </form>
                </div>

                <p className="mt-4 text-center text-[11px] text-white/35 md:text-left">
                  Ao criar uma conta, você concorda com nossos Termos e Condições.
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
