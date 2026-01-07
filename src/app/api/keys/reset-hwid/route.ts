import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { MongoClient, ObjectId } from 'mongodb';
import CollectionLink from '@/models/CollectionLink';
import { Project } from '@/models/Project';

const JWT_SECRET = process.env.JWT_SECRET as string;

type Plan = 'none' | 'client' | 'empresarial';

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
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const plan: Plan = (user.plan as Plan) || 'none';
    if (plan === 'none') {
      return NextResponse.json({ error: 'Plano insuficiente para esta ação.' }, { status: 403 });
    }

    const { keyId } = await request.json();
    if (!keyId) {
      return NextResponse.json({ error: 'keyId obrigatório.' }, { status: 400 });
    }

    const role = plan === 'empresarial' ? 'empresarial' : 'client';
    let integrationId: string, dbName: string, collName: string, docId: string;

    if (role === 'empresarial') {
      // keyId: integrationId-dbName-collName-docId
      const parts = keyId.split('-');
      if (parts.length < 4) {
        return NextResponse.json({ error: 'keyId inválido.' }, { status: 400 });
      }
      integrationId = parts[0];
      dbName = parts.slice(1, -2).join('-');
      collName = parts[parts.length - 2];
      docId = parts[parts.length - 1];

      // Verificar se a integração pertence ao usuário
      const integrations = user.integrations || [];
      const integration = integrations.find((i: any) => i.id === integrationId);
      if (!integration?.connected || !integration.config?.uri) {
        return NextResponse.json({ error: 'Integração não encontrada ou desconectada.' }, { status: 404 });
      }

      let client: MongoClient | null = null;
      try {
        client = new MongoClient(integration.config.uri);
        await client.connect();
        const db = client.db(dbName);
        const coll = db.collection(collName);

        const result = await coll.updateOne(
          { _id: new ObjectId(docId) },
          { $set: { hwid: '', updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
      } catch (err) {
        return NextResponse.json({ error: 'Erro ao resetar HWID.' }, { status: 500 });
      } finally {
        if (client) await client.close();
      }
    } else {
      // role === 'client'
      // keyId: collectionId-docId, onde collectionId = integrationId-dbName-collName
      const parts = keyId.split('-');
      if (parts.length < 4) {
        return NextResponse.json({ error: 'keyId inválido.' }, { status: 400 });
      }
      const collectionId = parts.slice(0, -1).join('-');
      docId = parts[parts.length - 1];
      const collParts = collectionId.split('-');
      if (collParts.length < 3) {
        return NextResponse.json({ error: 'keyId inválido.' }, { status: 400 });
      }
      integrationId = collParts[0];
      dbName = collParts.slice(1, -1).join('-');
      collName = collParts[collParts.length - 1];

      // Verificar se o usuário é linkedClient no projeto que possui essa coleção
      const projects = await Project.find({
        'linkedClients.email': user.email.toLowerCase()
      }).lean();

      let allowed = false;
      let selectedOwner: (typeof user) | null = null;
      for (const project of projects) {
        const owner = await User.findById(project.owner).lean();
        if (!owner) continue;

        const integrations = owner.integrations || [];
        const integration = integrations.find((i: any) => i.id === integrationId);
        if (!integration?.connected || !integration.config?.uri) continue;

        const links = await CollectionLink.find({ userId: owner._id, projectId: project._id }).lean();
        if (links.some(link => link.collectionId === collectionId)) {
          allowed = true;
          selectedOwner = owner;
          break;
        }
      }

      if (!allowed) {
        return NextResponse.json({ error: 'Acesso negado a esta key.' }, { status: 403 });
      }

      let client: MongoClient | null = null;
      try {
        // selectedOwner is guaranteed to be non-null here since allowed is true
        const integration = selectedOwner!.integrations.find((i: any) => i.id === integrationId);

        client = new MongoClient(integration.config.uri);
        await client.connect();
        const db = client.db(dbName);
        const coll = db.collection(collName);

        const result = await coll.updateOne(
          { _id: new ObjectId(docId) },
          { $set: { hwid: '', updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
      } catch (err) {
        return NextResponse.json({ error: 'Erro ao resetar HWID.' }, { status: 500 });
      } finally {
        if (client) await client.close();
      }
    }
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}