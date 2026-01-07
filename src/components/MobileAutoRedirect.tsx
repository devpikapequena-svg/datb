// src/components/MobileAutoRedirect.tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

function isMobileLike() {
  if (typeof window === 'undefined') return false

  const w = window.innerWidth
  const ua = navigator.userAgent || ''

  // pega celular/tablet e também tela pequena
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)
  const smallScreen = w <= 768

  return uaMobile || smallScreen
}

export default function MobileAutoRedirect() {
  const router = useRouter()
  const pathname = usePathname() || '/'

  useEffect(() => {
    if (typeof window === 'undefined') return

    const run = () => {
      const mobile = isMobileLike()
      if (!mobile) return

      // ✅ não redireciona se já estiver em /mobile
      if (pathname.startsWith('/mobile')) return

      // ✅ opcional: não atrapalhar rotas públicas (se tiver)
      // if (pathname.startsWith('/checkout') || pathname.startsWith('/product')) return

      router.replace('/mobile/login')
    }

    run()

    // se a pessoa redimensionar a janela e virar "mobile"
    const onResize = () => run()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [pathname, router])

  return null
}
