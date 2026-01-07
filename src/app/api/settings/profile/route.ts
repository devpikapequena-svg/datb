// src/app/api/settings/profile/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

export async function PATCH(req: Request) {
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

    const body = await req.json()
    const { name, email, image } = body

    console.log('Received body:', { name, email, imageLength: image ? image.length : 0 })

    // Validações parciais: só exige se o campo foi enviado
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Nome não pode ser vazio.' }, { status: 400 })
    }
    if (email !== undefined && !email.trim()) {
      return NextResponse.json({ error: 'Email não pode ser vazio.' }, { status: 400 })
    }
    // Validação para imagem: tamanho máximo reduzido (0.5 MB após compressão)
    const MAX_IMAGE_SIZE = 0.5 * 1024 * 1024 // 0.5 MB
    if (image !== undefined) {
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Imagem inválida. Deve ser uma string base64 de imagem.' }, { status: 400 })
      }
      if (image.length > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: `Imagem muito grande. Máximo permitido: ${MAX_IMAGE_SIZE / (1024 * 1024)} MB.` }, { status: 400 })
      }
    }

    await connectDB()

    const user = await User.findById(decoded.id)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    console.log('User before update:', { name: user.name, email: user.email, imageLength: user.image ? user.image.length : 0 })

    // Atualiza apenas os campos enviados
    if (name !== undefined) user.name = name.trim()
    if (email !== undefined) user.email = email.trim()
    if (image !== undefined) {
      user.image = image
      console.log('Image updated, length:', image.length)
    }

    console.log('User after update (before save):', { name: user.name, email: user.email, imageLength: user.image ? user.image.length : 0 })

    // NOVO: Log do tamanho estimado do documento (em bytes)
    const docSizeEstimate = JSON.stringify(user).length
    console.log('Estimated document size before save:', docSizeEstimate, 'bytes (~', (docSizeEstimate / (1024 * 1024)).toFixed(2), 'MB)')

    try {
      await user.save() // Tente salvar
      console.log('User saved successfully - full user after save:', {
        id: user._id,
        name: user.name,
        email: user.email,
        imageLength: user.image ? user.image.length : 0,
        imageStartsWith: user.image ? user.image.substring(0, 50) : 'null'
      })
    } catch (saveError) {
      console.error('Save failed:', saveError)
      return NextResponse.json({ error: 'Falha ao salvar no banco. Possível limite de tamanho excedido.' }, { status: 500 })
    }

    // NOVO: Refetch do banco para confirmar que foi persistido
    const savedUser = await User.findById(decoded.id).select('name email image')
    console.log('Refetched user from DB:', {
      name: savedUser?.name,
      email: savedUser?.email,
      imageLength: savedUser?.image ? savedUser.image.length : 0,
      imageStartsWith: savedUser?.image ? savedUser.image.substring(0, 50) : 'null'
    })

    return NextResponse.json({ name: user.name, email: user.email, image: user.image }, { status: 200 })
  } catch (err) {
    console.error('PROFILE UPDATE ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar perfil. Verifique os logs para detalhes.' }, { status: 500 })
  }
}