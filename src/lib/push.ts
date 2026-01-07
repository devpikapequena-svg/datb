// src/lib/push.ts
import webPush from 'web-push'
import { connectDB } from '@/lib/connectDB'
import NotificationSubscription from '@/models/NotificationSubscription'

export type NotificationStatusKey = 'paid' | 'pending' | 'med'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:suporte@database.com'

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('[PUSH] VAPID keys não configuradas. Verifique ENV.')
} else {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

type PushPayload = {
  title: string
  body: string
  url?: string
}

export async function sendPushForStatus(
  statusKey: NotificationStatusKey,
  payload: PushPayload,
) {
  await connectDB()

  // Busca todos devices que marcaram esse status na tela
  const subs = await NotificationSubscription.find({
    statuses: statusKey, // array contém o valor
  })

  if (!subs || subs.length === 0) {
    return
  }

  const bodyJson = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: payload.url || '/mobile',
  })

  for (const sub of subs) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    }

    try {
      await webPush.sendNotification(subscription as any, bodyJson)
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.status
      // se expirou / ficou inválido, remove do banco
      if (statusCode === 404 || statusCode === 410) {
        await NotificationSubscription.deleteOne({ _id: sub._id })
      }
    }
  }
}
