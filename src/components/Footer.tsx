// src/components/Footer.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Youtube, X } from 'lucide-react'

const ACCENT = '#2FD3B5'

export default function Footer() {
  return (
    <footer className="relative z-10 w-full bg-[#0D0D0D] text-white">
      {/* topo fade */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-[linear-gradient(to_bottom,_transparent_0%,_rgba(13,13,13,0.85)_45%,_rgba(13,13,13,1)_100%)]" />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 md:px-6">
        {/* BIG OUTLINE WORD */}
        <div className="mt-20 select-none">
          <div
            className="text-center text-[72px] font-semibold tracking-[-0.06em] md:text-[140px] lg:text-[190px]"
            style={{
              WebkitTextStroke: `2px rgba(47,211,181,0.35)`,
              color: 'transparent',
              opacity: 0.55,
            }}
          >
            DATABASE
          </div>
        </div>

        {/* bottom row */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-[12px] text-white/55">
              <span>Made by Oxb Team.</span>
              <span className="mx-2 text-white/25">|</span>
              <Link href="#" className="underline underline-offset-4 hover:text-white">
                Privacy Policy
              </Link>
              <span className="mx-2 text-white/25">|</span>
              <Link href="#" className="underline underline-offset-4 hover:text-white">
                Terms of Service
              </Link>
            </div>

            <div className="flex items-center gap-4 text-white/70">
              <Link href="#" aria-label="Facebook" className="hover:text-white">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="Instagram" className="hover:text-white">
                <Instagram className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="X" className="hover:text-white">
                <X className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="hover:text-white">
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="YouTube" className="hover:text-white">
                <Youtube className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* glow bem sutil embaixo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-140px] h-[260px] bg-[radial-gradient(circle_at_center,_rgba(47,211,181,0.10),_transparent_70%)] blur-[50px]" />
    </footer>
  )
}

function FooterCol({
  title,
  links,
  badgeOn,
  badgeLabel,
}: {
  title: string
  links: { label: string; href: string }[]
  badgeOn?: string
  badgeLabel?: string
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-white/85">{title}</p>

      <ul className="mt-5 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="inline-flex items-center gap-2 text-[13px] text-white/55 hover:text-white"
            >
              <span>{l.label}</span>

              {badgeOn && badgeLabel && l.label === badgeOn && (
                <span
                  className="rounded-full px-2 py-[3px] text-[10px] font-medium"
                  style={{
                    background: 'rgba(47,211,181,0.10)',
                    color: 'rgba(47,211,181,0.95)',
                    border: '1px solid rgba(47,211,181,0.18)',
                  }}
                >
                  {badgeLabel}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
