// app/api/settings/integrations/connect/route.ts (ajuste para salvar URI)

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

    const { id, uri } = await request.json();
    if (!id || !uri) {
      return NextResponse.json({ error: 'ID e URI são obrigatórios.' }, { status: 400 });
    }

    // Validação básica da URI (opcional, pode adicionar mais)
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      return NextResponse.json({ error: 'URI inválida. Deve começar com mongodb:// ou mongodb+srv://' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Garantir que integrations seja um array
    if (!user.integrations) {
      user.integrations = [];
    }

    // Atualizar ou adicionar integração com URI salva
    const existingIndex = user.integrations.findIndex((int: any) => int.id === id);
    const integration = { id, name: 'MongoDB', connected: true, config: { uri } }; // URI salva no config

    if (existingIndex >= 0) {
      user.integrations[existingIndex] = integration;
    } else {
      user.integrations.push(integration);
    }

    await user.save();

    return NextResponse.json({ integrations: user.integrations }, { status: 200 });
  } catch (err) {
    console.error('CONNECT INTEGRATION ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao conectar integração.' }, { status: 500 });
  }
}