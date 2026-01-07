// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Preencha nome, e-mail e senha.' },
        { status: 400 },
      )
    }

    await connectDB()

    const exists = await User.findOne({ email })
    if (exists) {
      return NextResponse.json(
        { error: 'Já existe uma conta com esse e-mail.' },
        { status: 400 },
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashed,
      plan: 'none', // ⬅️ já salva o plano inicial
    })

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan, // 'none'
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('REGISTER ERROR', err)
    return NextResponse.json(
      { error: 'Erro interno ao registrar.' },
      { status: 500 },
    )
  }
}
