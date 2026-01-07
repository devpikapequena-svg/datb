import { NextResponse } from 'next/server'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_CONTACT_EMAIL =
  process.env.VAPID_CONTACT_EMAIL || 'mailto:suporte@seusite.com'

let vapidReady = false

export function configureVapid() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[PUSH] VAPID keys ausentes.')
    return false
  }

  try {
    webpush.setVapidDetails(
      VAPID_CONTACT_EMAIL,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    )
    console.log('[PUSH] VAPID configurado com sucesso.')
    return true
  } catch (err) {
    console.error('[PUSH] Erro ao configurar VAPID:', err)
    return false
  }
}

// 🔧 CONFIGURA APENAS UMA VEZ
if (!vapidReady) {
  vapidReady = configureVapid()
}

export async function GET() {
  // Nunca quebrar o build — sempre retornar 200
  if (!vapidReady) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          'VAPID não configurado. Defina NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.',
      },
      { status: 200 },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      configured: true,
      publicKey: VAPID_PUBLIC_KEY,
      message: 'Push notifications configuradas corretamente.',
    },
    { status: 200 },
  )
}
