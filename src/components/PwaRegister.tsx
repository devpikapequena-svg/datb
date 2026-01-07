// components/PwaRegister.tsx
'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        console.log('[PWA] Service worker registrado:', reg)
      } catch (err) {
        console.error('[PWA] Erro ao registrar service worker:', err)
      }
    }

    registerSW()
  }, [])

  return null
}
