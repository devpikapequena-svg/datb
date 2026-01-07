// src/app/api/collections/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { MongoClient, CollectionInfo } from 'mongodb';
import CollectionLink from '@/models/CollectionLink';
import { Project, IProject } from '@/models/Project';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Definição do tipo Plan baseada na sua descrição
type Plan = 'none' | 'client' | 'empresarial';

type CollectionRow = {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  projectId: string;
  projectName: string;
  keysTotal: number;
  updatedAt: string;
  database: string;
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

    const plan: Plan = (user.plan as Plan) || 'none';
    const role = plan === 'empresarial' ? 'empresarial' : 'client';

    const collections: CollectionRow[] = [];

    if (role === 'empresarial') {
      // Lógica original para empresariais: busca de próprias integrações
      const integrations = user.integrations || [];

      for (const integration of integrations) {
        const integrationId = integration.id || 'unknown';
        if (!integration.connected || !integration.config?.uri) continue;

        let client: MongoClient | null = null;
        try {
          client = new MongoClient(integration.config.uri);
          await client.connect();

          const adminDb = client.db().admin();
          const databases = await adminDb.listDatabases();

          for (const dbInfo of databases.databases) {
            const dbName = dbInfo.name;
            const db = client.db(dbName);

            const collectionNames = await db.listCollections().toArray();
            const collNames = collectionNames.map((c: CollectionInfo) => c.name);

            for (const collName of collNames) {
              const coll = db.collection(collName);

              const hasRelevantField = await coll.findOne({
                $or: [
                  { key: { $exists: true } },
                  { hwid: { $exists: true } },
                  { code: { $exists: true } }
                ]
              });

              if (hasRelevantField) {
                const keysTotal = await coll.countDocuments();

                const collectionRow: CollectionRow = {
                  id: `${integrationId}-${dbName}-${collName}`,
                  name: collName,
                  status: 'active',
                  projectId: '',
                  projectName: '',
                  keysTotal,
                  updatedAt: new Date().toISOString(),
                  database: dbName,
                };

                collections.push(collectionRow);
              }
            }
          }
        } catch (err) {
          console.error(`Error processing integration ${integrationId}:`, err);
        } finally {
          if (client) await client.close();
        }
      }

      // Vincular projetos (lógica original)
      const collectionIds = collections.map(c => c.id);
      const links = await CollectionLink.find({ userId: user._id, collectionId: { $in: collectionIds } }).lean();
      const linkMap = new Map(links.map(l => [l.collectionId, l.projectId]));
      const projectIds = Array.from(linkMap.values()).filter(Boolean);
      const projects = await Project.find({ _id: { $in: projectIds } }).lean() as IProject[];
      const projectMap = new Map(projects.map((p: IProject) => [p._id.toString(), p.name]));

      collections.forEach(c => {
        const projectId = linkMap.get(c.id);
        if (projectId) {
          c.projectId = projectId;
          c.projectName = projectMap.get(projectId) || '';
        }
      });
    } else {
      // Lógica para clients: busca apenas coleções vinculadas aos projetos onde o usuário é linkedClient
      const projects = await Project.find({
        'linkedClients.email': user.email.toLowerCase()
      }).lean() as IProject[];

      for (const project of projects) {
        const owner = await User.findById(project.owner).lean();
        if (!owner) continue;

        const integrations = owner.integrations || [];
        const integrationMap = new Map(integrations.map(i => [i.id, i]));

        // Buscar links de coleção para este projeto e owner
        const links = await CollectionLink.find({ userId: owner._id, projectId: project._id }).lean();

        for (const link of links) {
          const collectionId = link.collectionId; // Ex: "integrationId-dbName-collName"
          const parts = collectionId.split('-');
          if (parts.length < 3) continue;
          const [integrationId, dbName, collName] = [parts[0], parts.slice(1, -1).join('-'), parts[parts.length - 1]];

          const integration = integrationMap.get(integrationId);
          if (!integration?.connected || !integration.config?.uri) continue;

          let client: MongoClient | null = null;
          try {
            client = new MongoClient(integration.config.uri);
            await client.connect();
            const db = client.db(dbName);
            const coll = db.collection(collName);

            const hasRelevantField = await coll.findOne({
              $or: [
                { key: { $exists: true } },
                { hwid: { $exists: true } },
                { code: { $exists: true } }
              ]
            });

            if (hasRelevantField) {
              const keysTotal = await coll.countDocuments();

              const collectionRow: CollectionRow = {
                id: collectionId,
                name: collName,
                status: 'active',
                projectId: project._id.toString(),
                projectName: project.name,
                keysTotal,
                updatedAt: new Date().toISOString(),
                database: dbName,
              };

              collections.push(collectionRow);
            }
          } catch (err) {
            console.error(`Error processing collection ${collectionId} for project ${project._id}:`, err);
          } finally {
            if (client) await client.close();
          }
        }
      }
    }

    return NextResponse.json({ role, collections }, { status: 200 });
  } catch (err) {
    console.error('GET COLLECTIONS ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao buscar coleções.' }, { status: 500 });
  }
}