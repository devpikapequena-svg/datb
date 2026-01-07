// app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/connectDB'
import NotificationSubscription from '@/models/NotificationSubscription'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    // usa só user.id (tipado e seguro)
    const userId = String(user.id)

    const doc = await NotificationSubscription.findOne({ userId }).lean()

    if (!doc) {
      return NextResponse.json({
        enabled: false,
        statuses: ['paid'],
        hasSubscription: false,
      })
    }

    return NextResponse.json({
      enabled: true,
      statuses:
        doc.statuses && doc.statuses.length > 0 ? doc.statuses : ['paid'],
      hasSubscription: true,
    })
  } catch (err) {
    console.error('[GET /api/notifications/subscribe] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao carregar preferências' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    const userId = String(user.id)

    const body = await req.json().catch(() => ({}))

    const { subscription, statuses, enabled } = body as {
      subscription?: any
      statuses?: string[]
      enabled?: boolean
    }

    // 🔴 DESATIVAR: remove tudo do user
    if (enabled === false) {
      await NotificationSubscription.deleteOne({ userId })
      return NextResponse.json({ ok: true, enabled: false })
    }

    const cleanStatuses =
      Array.isArray(statuses) && statuses.length > 0 ? statuses : ['paid']

    // 🟡 CASO 1: só atualizar os statuses (subscription null)
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      const doc = await NotificationSubscription.findOneAndUpdate(
        { userId },
        { $set: { statuses: cleanStatuses } },
        { new: true },
      )

      // se não tinha subscription ainda, retorna erro "sem subscription"
      if (!doc) {
        return NextResponse.json(
          {
            error:
              'Nenhuma subscription encontrada para este usuário. Ative as notificações primeiro.',
          },
          { status: 400 },
        )
      }

      return NextResponse.json({
        ok: true,
        enabled: true,
        statuses: cleanStatuses,
      })
    }

    // 🟢 CASO 2: criar/atualizar subscription + statuses
    await NotificationSubscription.findOneAndUpdate(
      { userId },
      {
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        statuses: cleanStatuses,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    return NextResponse.json({
      ok: true,
      enabled: true,
      statuses: cleanStatuses,
    })
  } catch (err) {
    console.error('[POST /api/notifications/subscribe] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao salvar subscription' },
      { status: 500 },
    )
  }
}
