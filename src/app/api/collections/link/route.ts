// src/app/api/collections/link/route.ts
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
      return NextResponse.json({ error: 'Apenas usuários empresariais podem vincular projetos.' }, { status: 403 })
    }

    const { collectionId, projectId } = await request.json()
    if (!collectionId || !projectId) {
      return NextResponse.json({ error: 'collectionId e projectId são obrigatórios.' }, { status: 400 })
    }

    // Verificar se o projeto existe (opcional, assumindo que existe ou chamar API)
    // Aqui, você pode adicionar uma chamada para verificar se o projeto existe no usuário

    // Criar ou atualizar o link
    await CollectionLink.findOneAndUpdate(
      { userId: user._id, collectionId },
      { projectId },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('LINK COLLECTION ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao vincular coleção.' }, { status: 500 })
  }
}