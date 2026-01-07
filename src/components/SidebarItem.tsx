'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

type Props = {
  href: string
  icon: LucideIcon
  label: string
  active?: boolean
  onClick?: () => void
  accent?: string
}

export default function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
  accent = '#34d399',
}: Props) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'group relative flex items-center gap-3 rounded-xl px-3 py-2',
        'transition-colors',
        active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]',
      ].join(' ')}
    >
      {/* active bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full"
          style={{ background: accent }}
        />
      )}

      <Icon
        className="h-[18px] w-[18px]"
        style={{ color: active ? accent : 'rgba(255,255,255,0.60)' }}
      />

      <span
        className="text-[13px] font-medium"
        style={{ color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)' }}
      >
        {label}
      </span>
    </Link>
  )
}
