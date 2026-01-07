// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(decoded.id).select(
      'name email image plan planPaidAt planExpiresAt planLastTransactionHash planExternalId',
    )

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const now = new Date()
    const expiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null
    const planActive = !!(user.plan && user.plan !== 'none' && expiresAt && expiresAt.getTime() > now.getTime())

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image ?? null,

      plan: user.plan || 'none',
      planPaidAt: user.planPaidAt || null,
      planExpiresAt: user.planExpiresAt || null,
      planActive,

      planLastTransactionHash: user.planLastTransactionHash || null,
      planExternalId: user.planExternalId || null,
    })
  } catch (err) {
    console.error('AUTH ME ERROR', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
