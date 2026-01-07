// src/app/dashboard-landing/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ShoppingCart,
  Server,
  Percent,
  Code2,
  Search,
  TrendingUp,
  BarChart3,
  Check,
  Crown,
  User,
  X,
} from 'lucide-react'
import Footer from '@/components/Footer'

const ACCENT = '#2FD3B5'
const BG = '#0D0D0D'

type PlanKey = 'client' | 'empresarial'

export default function DashboardLanding() {
  const [planModal, setPlanModal] = useState<PlanKey | null>(null)

  const plans = useMemo(
    () => ({
      client: {
        title: 'Client',
        subtitle: 'Para operar projetos vinculados',
        icon: User,
        cta: { label: 'Assinar Client', href: '/signup?plan=client' },
        details: [
          'Acessar projetos em que você foi vinculado',
          'Visualizar coleções liberadas no projeto',
          'Gerenciar keys dos projetos vinculados',
          'Gerar keys nos projetos vinculados',
          'Vincular HWID, resetar HWID e remover acessos',
          'Acompanhar status e atualizações no painel',
        ],
        limits: [
          'Não cria projetos do zero',
          'Não integra banco de dados',
          'Não vincula clientes',
        ],
        modalIntro:
          'Ideal para quem participa de projetos e precisa operar as keys e acessos com segurança.',
      },
      empresarial: {
        title: 'Empresarial',
        subtitle: 'Para gerenciar tudo',
        icon: Crown,
        cta: { label: 'Assinar Empresarial', href: '/signup?plan=empresarial' },
        details: [
          'Criar e gerenciar projetos',
          'Criar, editar e integrar coleções em projetos',
          'Vincular banco de dados para puxar coleções automaticamente',
          'Gerar e gerenciar keys com regras avançadas e controle total',
          'Vincular clientes a projetos e coleções',
          'Auditoria, rastreio e ações administrativas',
          'Fluxo completo de controle de acesso (HWID, status e mais)',
        ],
        limits: [],
        modalIntro:
          'Para quem precisa criar projetos, integrar coleções via banco e controlar todo o ecossistema.',
      },
    }),
    [],
  )

  const modalPlan = planModal ? plans[planModal] : null

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: BG }}>
      {/* ====================== HEADER ====================== */}
   <header className="sticky top-0 z-50">
  <div className="relative mx-auto flex h-[78px] max-w-8xl items-center px-4 md:px-20">
    {/* LEFT - LOGO */}
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-28 w-28">
        <Image
          src="https://cdn.prod.website-files.com/6778925b37f612538b12b019/677cbafaa9a247fdba85af61_Logo.png"
          alt="Database logo"
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

    {/* RIGHT - ACTIONS */}
    <div className="ml-auto flex items-center gap-3">
      <Link
        href="/login"
        className="text-[13px] text-white/75 hover:text-white"
      >
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


      {/* ====================== MAIN ====================== */}
      <main className="relative z-10">
        {/* ====================== HERO ====================== */}
        <section id="produto" className="relative w-full overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Image
              src="/hero.png"
              alt=""
              fill
              priority
              className="object-cover object-[70%_18%] opacity-[1.15]"
            />
          </div>

          <div className="mx-auto max-w-6xl px-4 pt-20 md:px-6 md:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-[40px] leading-[1.08] tracking-[-0.03em] text-white/90 md:text-[48px]">
                <span className="block">Projetos, Coleções e Keys</span>
                <span className="block" style={{ color: ACCENT }}>
                  Controle de acesso em um só lugar
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-[680px] text-[13px] leading-relaxed text-white/50 md:text-[14px]">
                Organize seus projetos, vincule coleções e gerencie keys com status, HWID, auditoria e ações rápidas.
                Gere keys com segurança, sem falhas e com controle total do ciclo de vida.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <div className="relative w-full max-w-[420px]">
                  <input
                    type="email"
                    placeholder="Digite seu e-mail para criar a conta"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[13px] text-white/90 outline-none placeholder:text-white/35 focus:border-white/20"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-xl" />
                </div>

                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-[13px] font-medium text-black hover:bg-white/90"
                >
                  Criar conta
                </Link>
              </div>

              <p className="mt-3 text-[11px] text-white/40">
                Ao criar sua conta, você concorda com nossos Termos e Política de Privacidade.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-40 max-w-7xl px-4 pb-28 md:px-6">
            <div className="relative mx-auto max-w-[1360px] overflow-hidden bg-black/60">
              <div className="pointer-events-none absolute inset-x-0 top-[-140px] h-[300px] bg-[radial-gradient(circle_at_top,_rgba(47,211,181,0.22),_transparent_70%)] blur-[40px]" />
              <div className="relative aspect-[16/9] w-full">
                <Image src="/painel.png" alt="Dashboard preview" fill priority />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_85%,_rgba(7,7,7,0.95)_100%)]" />
              </div>
            </div>
          </div>
        </section>

        
        {/* ====================== SECTION (3 CARDS) ====================== */}
        <section className="mx-auto max-w-7xl px-4 pb-28 pt-20 md:px-6">
          <div className="grid items-start gap-14 md:grid-cols-2 md:gap-16">
            <div className="max-w-xl">
              <h2 className="text-[40px] leading-[1.06] tracking-[-0.03em] text-white/90 md:text-[50px]">
                <span className="block">Organize tudo</span>
                <span className="block">
                  por <span style={{ color: ACCENT }}>Projetos e Coleções</span>
                </span>
              </h2>

              <p className="mt-5 max-w-[640px] text-[13px] leading-relaxed text-white/55 md:text-[14px]">
                Estruture clientes e produtos por projeto, mantenha coleções bem separadas e deixe o controle de keys
                pronto para escalar. Tudo com visão clara, filtros e ações rápidas.
              </p>
            </div>

            <div className="hidden md:block" />
          </div>

          <div className="mt-16 grid gap-16 md:grid-cols-3 md:gap-10">
            <div className="relative">
              <div className="relative w-[460px] max-w-full">
                <Image
                  src="https://cdn.prod.website-files.com/6778925b37f612538b12b019/678de5bf2be3fc365a602ac6_Service_v1.jpg"
                  alt="Coleções organizadas"
                  width={900}
                  height={520}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>

              <h3 className="mt-10 text-[30px] font-medium tracking-[-0.02em] text-white/90">
                Coleções organizadas
              </h3>
              <p className="mt-3 max-w-[340px] text-[13px] leading-relaxed text-white/55">
                Centralize coleções com status, vínculo em projeto e listagem limpa para gestão diária.
              </p>
            </div>

            <div className="relative md:mt-10">
              <div className="relative w-[460px] max-w-full">
                <Image
                  src="https://cdn.prod.website-files.com/6778925b37f612538b12b019/678de5bf1173ea44a6144fc1_Service_v2.jpg"
                  alt="Projetos"
                  width={1100}
                  height={520}
                  className="h-auto w-full object-contain"
                />
              </div>

              <h3 className="mt-10 text-[30px] font-medium tracking-[-0.02em] text-white/90">
                Projetos por cliente
              </h3>
              <p className="mt-3 max-w-[360px] text-[13px] leading-relaxed text-white/55">
                Separe por projeto, veja contadores e atualizações, e conecte coleções sem bagunça.
              </p>
            </div>

            <div className="relative md:mt-20">
              <div className="relative w-[460px] max-w-full">
                <Image
                  src="https://cdn.prod.website-files.com/6778925b37f612538b12b019/678de5bfc0ea1300cdad466c_Service_v3-p-800.jpg"
                  alt="Keys e HWID"
                  width={1100}
                  height={520}
                  className="h-auto w-full object-contain"
                />
              </div>

              <h3 className="mt-10 text-[30px] font-medium tracking-[-0.02em] text-white/90">
                Keys com segurança
              </h3>
              <p className="mt-3 max-w-[360px] text-[13px] leading-relaxed text-white/55">
                Gerencie keys, vincule HWID, faça reset e remova acessos com fluxo seguro e rastreável.
              </p>
            </div>
          </div>
        </section>

        {/* ====================== FEATURES GRID ====================== */}
        <section id="funcionalidades" className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6">
          <div className="text-center">
            <h2 className="text-[34px] leading-tight tracking-[-0.02em] text-white/90 md:text-[44px]">
              Funcionalidades para <span style={{ color: ACCENT }}>gestão de acesso</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-7 md:grid-cols-3">
            {[
              {
                icon: Server,
                title: 'Projetos e coleções',
                desc: 'Crie projetos, vincule coleções e mantenha tudo organizado por cliente, produto ou aplicação.',
              },
              {
                icon: Percent,
                title: 'Regras e status',
                desc: 'Controle status e regras para acesso e gestão com consistência.',
              },
              {
                icon: Code2,
                title: 'Vínculo de HWID',
                desc: 'Vincule HWID à key para limitar o uso por dispositivo e reduzir compartilhamento.',
              },
              {
                icon: Search,
                title: 'Busca e filtros rápidos',
                desc: 'Encontre projetos, coleções e keys em segundos com filtros e paginação.',
              },
              {
                icon: TrendingUp,
                title: 'Auditoria e rastreio',
                desc: 'Tenha rastreabilidade de alterações, ações e atualizações dentro da plataforma.',
              },
              {
                icon: BarChart3,
                title: 'Geração segura de keys',
                desc: 'Gere keys com validação e consistência para evitar duplicação e falhas.',
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="group relative rounded-[14px] border border-white/10 bg-white/[0.02] px-10 py-12 text-center"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-[14px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)] opacity-0 transition group-hover:opacity-100" />
                  <div className="mx-auto flex h-12 w-12 items-center justify-center">
                    <Icon className="h-10 w-10" style={{ color: ACCENT }} strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-6 text-[18px] font-medium text-white/90">{item.title}</h3>
                  <p className="mx-auto mt-4 max-w-[320px] text-[13px] leading-relaxed text-white/50">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ====================== PLANS (REDESIGN) ====================== */}
        <section id="planos" className="mx-auto max-w-7xl px-4 pb-32 pt-6 md:px-6">
          <div className="text-center">
            <h2 className="text-[34px] leading-tight tracking-[-0.02em] text-white/90 md:text-[44px]">
              Planos pagos para <span style={{ color: ACCENT }}>cada perfil</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[860px] text-[13px] leading-relaxed text-white/55 md:text-[14px]">
              O <b className="text-white/85">Client</b> opera keys e acessos dentro dos projetos em que foi vinculado.
              O <b className="text-white/85">Empresarial</b> cria projetos, integra banco de dados, gerencia coleções e
              controla todo o ecossistema.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {(['client', 'empresarial'] as PlanKey[]).map((key) => {
              const p = plans[key]
              const Icon = p.icon

              return (
                <div
                  key={key}
                  className={[
                    'relative rounded-[18px] border border-white/10',
                    'bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]',
                    'overflow-hidden',
                    'flex flex-col',
                    'min-h-[520px]', // garante mesma altura pros botões alinharem
                  ].join(' ')}
                >
                  {/* glow sutil */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 left-1/2 h-[240px] w-[520px] -translate-x-1/2 rounded-full blur-[55px] opacity-60"
                    />
                  </div>

                  {/* header */}
                  <div className="relative px-7 pt-7">
                    <div className="flex items-start gap-4">
                      <div className="grid h-11 w-11 place-items-center">
                        <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[16px] tracking-[-0.01em] text-white/90">
                          {p.title}
                        </p>
                        <p className="mt-1 text-[12px] text-white/50">{p.subtitle}</p>
                      </div>
                    </div>

                    <div className="mt-6 h-px w-full bg-white/10" />
                  </div>

{/* content */}
<div className="relative flex-1 px-7 py-6">
  <p className="text-[12px] leading-relaxed text-white/50">
    {p.modalIntro}
  </p>

  <div className="mt-5 space-y-3">
    {p.details.map((t) => (
      <div key={t} className="flex items-center gap-2.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0">
          <Check className="h-3.5 w-3.5" style={{ color: ACCENT }} />
        </span>

        <span className="text-[13px] leading-relaxed text-white/75">
          {t}
        </span>
      </div>
    ))}
  </div>


{p.limits.length > 0 && (
  <div className="mt-1 rounded-[14px] px-2 py-4">
    <p className="text-[12px] text-white/70">Limitações</p>

    <div className="mt-3 space-y-2">
      {p.limits.map((t) => (
        <div key={t} className="flex items-center gap-2.5">
          <X
            className="h-3.5 w-3.5 flex-shrink-0"
            style={{ color: '#ef4444' }}
          />
          <span className="text-[13px] leading-relaxed text-white/65">
            {t}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

                  </div>

                  {/* footer buttons (ALINHADOS) */}
                  <div className="relative px-7 pb-7 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPlanModal(key)}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[13px] text-white/85 hover:bg-white/[0.05]"
                      >
                        Ver detalhes
                      </button>

                      <Link
                        href={p.cta.href}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-white text-[13px] font-medium text-black hover:bg-white/90"
                      >
                        {p.cta.label}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-10 text-center text-[12px] text-white/45">
           O acesso sempre respeita as permissões do seu perfil.
          </p>
        </section>

        {/* ====================== SECURITY ====================== */}
        <section id="seguranca" className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
          <div className="rounded-[16px] border border-white/10 bg-white/[0.02] px-6 py-10 md:px-10">
            <h3 className="text-[22px] font-medium text-white/90 md:text-[26px]">
              Segurança de ponta para suas keys
            </h3>
            <p className="mt-3 max-w-[860px] text-[13px] leading-relaxed text-white/55 md:text-[14px]">
              Controle de acesso com HWID, ações administrativas rápidas e trilha de auditoria. A plataforma é pensada
              para evitar duplicação, manter consistência e reduzir falhas no ciclo de vida das keys.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[13px] font-medium text-black hover:bg-white/90"
              >
                Começar agora
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 text-[13px] text-white/85 hover:bg-white/[0.05]"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ====================== MODAL (Ver detalhes) ====================== */}
      {planModal && modalPlan && (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={() => setPlanModal(null)}
          />

          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2">
            <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[#0B0B0B]/95">
              <div className="pointer-events-none absolute inset-0">
            
                <div className="absolute inset-0 opacity-60" />
              </div>

              <div className="relative flex items-start justify-between gap-4 px-6 py-5 md:px-7">
                <div>
                  <p className="text-[14px] text-white/90">{modalPlan.title}</p>
                  <p className="mt-1 text-[12px] text-white/55">{modalPlan.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setPlanModal(null)}
                  className="grid h-9 w-9 place-items-center"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4 text-white/80" />
                </button>
              </div>

        <div className="relative px-6 pb-6 md:px-7">
  <div className="h-px w-full bg-white/10" />

  <div className="mt-5 grid gap-6 md:grid-cols-2">
    {/* ================= O QUE VOCÊ PODE FAZER ================= */}
    <div>
      <p className="text-[12px] text-white/70">
        O que você pode fazer
      </p>

      <div className="mt-3 space-y-3">
        {modalPlan.details.map((t) => (
          <div key={t} className="flex items-center gap-2.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0">
              <Check className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            </span>

            <span className="text-[13px] leading-relaxed text-white/75">
              {t}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* ================= LIMITAÇÕES / RESUMO ================= */}
    <div>
      <p className="text-[12px] text-white/70">
        {modalPlan.limits.length ? 'Limitações' : 'Resumo'}
      </p>

      {modalPlan.limits.length ? (
        <div className="mt-3 space-y-2">
          {modalPlan.limits.map((t) => (
            <div key={t} className="flex items-center gap-2.5">
              <X
                className="h-3.5 w-3.5 flex-shrink-0"
                style={{ color: '#ef4444' }}
              />

              <span className="text-[13px] leading-relaxed text-white/65">
                {t}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] leading-relaxed text-white/60">
          Esse plano libera o fluxo completo de criação, integrações e gestão do ambiente.
        </p>
      )}
    </div>
  </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPlanModal(null)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[13px] text-white/85 hover:bg-white/[0.05]"
                  >
                    Fechar
                  </button>

                  <Link
                    href={planModal === 'client' ? '/signup?plan=client' : '/signup?plan=empresarial'}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-white text-[13px] font-medium text-black hover:bg-white/90"
                  >
                    {planModal === 'client' ? 'Assinar Client' : 'Assinar Empresarial'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
