// src/app/api/settings/sessions/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { Session } from '@/models/Session'

const JWT_SECRET = process.env.JWT_SECRET as string

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
    }

    await connectDB()

    const sessions = await Session.find({ userId: decoded.id }).lean()

    const formattedSessions = sessions.map(s => ({
      id: s._id.toString(),
      device: s.device,
      location: s.location,
      lastActive: s.lastActive.toISOString(),
      current: s.token === token, // Marca a session atual
    }))

    return NextResponse.json({ sessions: formattedSessions }, { status: 200 })
  } catch (err) {
    console.error('SESSIONS ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao buscar sessões.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
    }

    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'ID da sessão é obrigatório.' }, { status: 400 })
    }

    await connectDB()

    const session = await Session.findOneAndDelete({ _id: sessionId, userId: decoded.id })

    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Sessão revogada com sucesso.' }, { status: 200 })
  } catch (err) {
    console.error('REVOKE SESSION ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao revogar sessão.' }, { status: 500 })
  }
}