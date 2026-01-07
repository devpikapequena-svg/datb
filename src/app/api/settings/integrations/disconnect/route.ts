// app/api/settings/integrations/disconnect/route.ts (ajuste para manter integração mas desconectar e remover URI)

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Marcar como desconectada e remover config (URI)
    const existingIndex = user.integrations.findIndex((int: any) => int.id === id);
    if (existingIndex >= 0) {
      user.integrations[existingIndex] = { id, name: 'MongoDB', connected: false }; // Remove config
    }

    await user.save();

    return NextResponse.json({ integrations: user.integrations }, { status: 200 });
  } catch (err) {
    console.error('DISCONNECT INTEGRATION ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao desconectar integração.' }, { status: 500 });
  }
}