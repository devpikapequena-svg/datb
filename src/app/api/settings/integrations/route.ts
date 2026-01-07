import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET() {
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

    await connectDB();

    const user = await User.findById(decoded.id).select('integrations').lean();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const integrations = user.integrations || [];
    return NextResponse.json({ integrations }, { status: 200 });
  } catch (err) {
    console.error('GET INTEGRATIONS ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao buscar integrações.' }, { status: 500 });
  }
}