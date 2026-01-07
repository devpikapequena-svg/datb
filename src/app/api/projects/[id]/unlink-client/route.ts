import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Project } from '@/models/Project';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const plan = (user.plan as string) || 'none';
    const isEmpresarial = plan === 'empresarial';

    const project = await Project.findById(params.id).lean();
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    // Verificar permissão: dono OU empresarial
    if (project.owner.toString() !== user._id.toString() && !isEmpresarial) {
      return NextResponse.json({ error: 'Permissão negada.' }, { status: 403 });
    }

    const { email }: { email: string } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();

    // Verificar se está vinculado
    const isLinked = project.linkedClients.some(
      (c: any) => c.email.toLowerCase() === emailLower
    );
    if (!isLinked) {
      return NextResponse.json({ error: 'Cliente não está vinculado.' }, { status: 400 });
    }

    // Atualizar projeto: remover da lista
    await Project.findByIdAndUpdate(params.id, {
      $pull: { linkedClients: { email: emailLower } },
    });

    return NextResponse.json({ message: 'Cliente desvinculado com sucesso.' }, { status: 200 });
  } catch (err) {
    console.error('UNLINK CLIENT ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao desvincular cliente.' }, { status: 500 });
  }
}