// src/app/api/collections/unlink/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import CollectionLink from '@/models/CollectionLink'

const JWT_SECRET = process.env.JWT_SECRET as string

export async function POST(request: Request) {
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

    const user = await User.findById(decoded.id).lean()
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    const plan = (user.plan as string) || 'none'
    if (plan !== 'empresarial') {
      return NextResponse.json({ error: 'Apenas usuários empresariais podem desvincular projetos.' }, { status: 403 })
    }

    const { collectionId } = await request.json()
    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId é obrigatório.' }, { status: 400 })
    }

    // Remover o link
    await CollectionLink.findOneAndDelete({ userId: user._id, collectionId })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('UNLINK COLLECTION ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao desvincular coleção.' }, { status: 500 })
  }
}