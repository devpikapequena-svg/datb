// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Session } from '@/models/Session'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no .env.local')
}

export async function POST(req: Request) {
  try {
    const { email, password, device, location } = await req.json() // Recebe device e location do frontend

    console.log('Login attempt:', { email, device, location }) // Log para debugging

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Preencha e-mail e senha.' },
        { status: 400 },
      )
    }

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 },
      )
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 },
      )
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    // Criar session no banco com device e location reais
    const newSession = new Session({
      userId: user._id,
      device: device || 'Unknown Device', // Fallback se não enviado
      location: location || 'Unknown Location', // Fallback se não enviado
      token,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || 'unknown',
    })
    await newSession.save()

    console.log('Session created:', { device: newSession.device, location: newSession.location }) // Log para confirmar

    const res = NextResponse.json(
      {
        message: 'Login efetuado com sucesso.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan || 'none',
        },
      },
      { status: 200 },
    )

    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  } catch (err) {
    console.error('LOGIN ERROR', err)
    return NextResponse.json(
      { error: 'Erro interno ao fazer login.' },
      { status: 500 },
    )
  }
}