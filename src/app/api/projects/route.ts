// src/app/api/projects/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import CollectionLink from '@/models/CollectionLink'; // Adicionado
import { MongoClient } from 'mongodb'; // Adicionado para calcular keysTotal

const JWT_SECRET = process.env.JWT_SECRET as string;

// Definição do tipo Plan baseada na sua descrição
type Plan = 'none' | 'client' | 'empresarial';

// Tipo para linkedClients (ajuste se o modelo Project definir algo diferente)
type LinkedClient = {
  email: string;
  name?: string;
  userId?: string; // Mantém como string, mas converteremos ObjectId para string
};

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

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Garante que plan seja tratado como Plan, com fallback para 'none'
    const plan: Plan = (user.plan as Plan) || 'none';
    const role = plan === 'empresarial' ? 'empresarial' : 'client';

    // Buscar projetos onde o usuário é dono OU está em linkedClients
    const projects = await Project.find({
      $or: [
        { owner: user._id },
        { 'linkedClients.email': user.email.toLowerCase() }
      ]
    }).lean();

    const integrations = user.integrations || []; // Para acessar URIs das integrações

    // Mapa de integrações por ID para facilitar acesso
    const integrationMap = new Map(integrations.map(i => [i.id, i]));

    const responseProjects = await Promise.all(projects.map(async (p) => {
      // Calcular collectionsCount: contar CollectionLinks vinculados ao projeto
      const collectionsCount = await CollectionLink.countDocuments({ projectId: p._id });

      // Calcular keysTotal: somar keysTotal das coleções vinculadas
      let keysTotal = 0;
      const links = await CollectionLink.find({ projectId: p._id }).lean();
      for (const link of links) {
        const collectionId = link.collectionId; // Ex: "integrationId-dbName-collName"
        const parts = collectionId.split('-');
        if (parts.length < 3) continue; // Pular se ID inválido
        const [integrationId, dbName, collName] = [parts[0], parts.slice(1, -1).join('-'), parts[parts.length - 1]];

        const integration = integrationMap.get(integrationId);
        if (!integration?.connected || !integration.config?.uri) continue;

        let client: MongoClient | null = null;
        try {
          client = new MongoClient(integration.config.uri);
          await client.connect();
          const db = client.db(dbName);
          const coll = db.collection(collName);

          // Verificar se tem documentos relevantes e contar
          const hasRelevantField = await coll.findOne({
            $or: [
              { key: { $exists: true } },
              { hwid: { $exists: true } },
              { code: { $exists: true } }
            ]
          });
          if (hasRelevantField) {
            keysTotal += await coll.countDocuments();
          }
        } catch (err) {
          console.error(`Erro ao calcular keysTotal para ${collectionId}:`, err);
        } finally {
          if (client) await client.close();
        }
      }

      return {
        id: p._id.toString(),
        name: p.name,
        status: p.status,
        clientsCount: p.linkedClients.length,
        collectionsCount, // Calculado dinamicamente
        keysTotal, // Calculado dinamicamente
        updatedAt: p.updatedAt.toISOString(),
        linkedClients: p.linkedClients.map((c: LinkedClient) => ({ email: c.email, name: c.name })),
      };
    }));

    return NextResponse.json({ role, projects: responseProjects }, { status: 200 });
  } catch (err) {
    console.error('GET PROJECTS ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao buscar projetos.' }, { status: 500 });
  }
}


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

    await connectDB();

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Garante que plan seja tratado como Plan, com fallback para 'none'
    const plan: Plan = (user.plan as Plan) || 'none';
    
    // Apenas 'empresarial' pode criar projetos; 'none' e 'client' são bloqueados
    if (plan !== 'empresarial') {
      return NextResponse.json({ error: 'Apenas usuários com plano empresarial podem criar projetos.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, status, clientEmail }: { name: string; status: 'active' | 'paused' | 'archived'; clientEmail?: string } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome do projeto é obrigatório.' }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Verificar se slug já existe
    const existing = await Project.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'Slug já existe. Escolha outro nome.' }, { status: 400 });
    }

    const linkedClients: LinkedClient[] = [];
    if (clientEmail?.trim()) {
      const email = clientEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
      }
      // Opcional: Verificar se usuário existe
      const clientUser = await User.findOne({ email }).lean();
      linkedClients.push({ 
        email, 
        name: clientUser?.name, 
        userId: clientUser?._id?.toString() // Converte ObjectId para string
      });
    }

    const project = new Project({
      name: name.trim(),
      slug,
      status,
      owner: user._id,
      linkedClients,
    });

    await project.save();

    return NextResponse.json({
      id: project._id.toString(),
      name: project.name,
      status: project.status,
      clientsCount: linkedClients.length,
      collectionsCount: 0,
      keysTotal: 0,
      updatedAt: project.updatedAt.toISOString(),
      linkedClients: linkedClients.map((c: LinkedClient) => ({ email: c.email, name: c.name })),
    }, { status: 201 });
  } catch (err) {
    console.error('POST PROJECT ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao criar projeto.' }, { status: 500 });
  }
}