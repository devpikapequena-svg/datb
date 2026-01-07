// src/app/api/keys/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { MongoClient } from 'mongodb';
import CollectionLink from '@/models/CollectionLink';
import { Project } from '@/models/Project';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Definição do tipo Plan baseada na sua descrição
type Plan = 'none' | 'client' | 'empresarial';

type KeyRow = {
  id: string;
  key: string;
  hwid: string;
  status: 'active' | 'expired';
  updatedAt: string;
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

    const keys: KeyRow[] = [];

    if (role === 'empresarial') {
      // Lógica para empresariais: buscar keys de próprias integrações
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
            const collNames = collectionNames.map((c: any) => c.name);

            for (const collName of collNames) {
              const coll = db.collection(collName);

              // Verificar se tem documentos relevantes
              const hasRelevantField = await coll.findOne({
                $or: [
                  { key: { $exists: true } },
                  { hwid: { $exists: true } },
                  { code: { $exists: true } }
                ]
              });

              if (hasRelevantField) {
                // Buscar todos os documentos com os campos
                const documents = await coll.find({
                  $or: [
                    { key: { $exists: true } },
                    { hwid: { $exists: true } },
                    { code: { $exists: true } }
                  ]
                }).toArray();

                for (const doc of documents) {
                  const keyValue = doc.key || '';
                  const hwidValue = doc.hwid || doc.code || ''; // Usar code como hwid se hwid não existir
                  const status: 'active' | 'expired' = doc.expireAt && new Date(doc.expireAt) < new Date() ? 'expired' : 'active';
                  const updatedAt = doc.updatedAt || doc._id.getTimestamp().toISOString(); // Usar timestamp do _id se não houver updatedAt

                  if (keyValue) { // Só adicionar se tiver key
                    keys.push({
                      id: `${integrationId}-${dbName}-${collName}-${doc._id.toString()}`, // ID único
                      key: keyValue,
                      hwid: hwidValue,
                      status,
                      updatedAt,
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error processing integration ${integrationId}:`, err);
        } finally {
          if (client) await client.close();
        }
      }
    } else {
      // Lógica para clients: buscar keys apenas de coleções vinculadas aos projetos onde é linkedClient
      const projects = await Project.find({
        'linkedClients.email': user.email.toLowerCase()
      }).lean();

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

            // Buscar documentos relevantes
            const documents = await coll.find({
              $or: [
                { key: { $exists: true } },
                { hwid: { $exists: true } },
                { code: { $exists: true } }
              ]
            }).toArray();

            for (const doc of documents) {
              const keyValue = doc.key || '';
              const hwidValue = doc.hwid || doc.code || '';
              const status: 'active' | 'expired' = doc.expireAt && new Date(doc.expireAt) < new Date() ? 'expired' : 'active';
              const updatedAt = doc.updatedAt || doc._id.getTimestamp().toISOString();

              if (keyValue) {
                keys.push({
                  id: `${collectionId}-${doc._id.toString()}`,
                  key: keyValue,
                  hwid: hwidValue,
                  status,
                  updatedAt,
                });
              }
            }
          } catch (err) {
            console.error(`Error processing collection ${collectionId} for project ${project._id}:`, err);
          } finally {
            if (client) await client.close();
          }
        }
      }
    }

    return NextResponse.json({ role, keys }, { status: 200 });
  } catch (err) {
    console.error('GET KEYS ERROR', err);
    return NextResponse.json({ error: 'Erro interno ao buscar keys.' }, { status: 500 });
  }
}