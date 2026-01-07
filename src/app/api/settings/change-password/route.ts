// src/app/api/settings/change-password/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

export async function POST(req: Request) {
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

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Preencha a senha atual e nova.' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(decoded.id)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    return NextResponse.json({ message: 'Senha alterada com sucesso.' }, { status: 200 })
  } catch (err) {
    console.error('CHANGE PASSWORD ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao alterar senha.' }, { status: 500 })
  }
}