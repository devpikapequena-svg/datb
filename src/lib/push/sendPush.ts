import webpush from 'web-push'
import NotificationSubscription from '@/models/NotificationSubscription'
import { connectDB } from '@/lib/connectDB'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!

webpush.setVapidDetails(
  'mailto:contato@seusite.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
)

export async function sendPushToUser(userId: string, payload: any) {
  await connectDB()

  const sub = await NotificationSubscription.findOne({ userId }).lean()
  if (!sub) {
    console.log('[PUSH] Usuário sem subscription:', userId)
    return
  }

  const subscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    console.log('[PUSH] Enviado para', userId)
  } catch (err) {
    console.error('[PUSH] Falha ao enviar push:', err)
  }
}
