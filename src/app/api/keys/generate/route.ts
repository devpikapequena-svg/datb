// src/app/api/keys/generate/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Project } from '@/models/Project'
import CollectionLink from '@/models/CollectionLink'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET as string

type Plan = 'none' | 'client' | 'empresarial'

function randomKey(len: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

function formatKey(raw: string, group = 4) {
  if (group <= 0) return raw
  const parts: string[] = []
  for (let i = 0; i < raw.length; i += group) parts.push(raw.slice(i, i + group))
  return parts.join('-')
}

function addDays(d: Date, days: number) {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(decoded.id).lean()
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const plan: Plan = (user.plan as Plan) || 'none'
    if (plan === 'none') {
      return NextResponse.json({ error: 'Seu plano não permite gerar keys.' }, { status: 403 })
    }

    const role: 'empresarial' | 'client' = plan === 'empresarial' ? 'empresarial' : 'client'

    const body = await req.json()
    const {
      projectId,
      collectionId,
      quantity,
      expirationDays,
      length,
      prefix,
      dashed,
    }: {
      projectId: string
      collectionId: string
      quantity: number
      expirationDays?: number
      length?: number
      prefix?: string
      dashed?: boolean
    } = body

    if (!projectId || !collectionId) {
      return NextResponse.json({ error: 'projectId e collectionId são obrigatórios.' }, { status: 400 })
    }

    // ✅ limite total (front + back)
    const qty = Math.max(1, Math.min(Number(quantity || 1), 50))

    // ✅ expiração: default 7 | 0 = sem expiração
    const expDays = Number.isFinite(Number(expirationDays))
      ? Math.max(0, Math.min(Number(expirationDays), 3650))
      : 7

    // mantive seu resto
    const keyLen = Math.max(8, Math.min(Number(length || 16), 64))
    const pre = (prefix || '').trim()
    const useDash = dashed !== false

    // =========================================================
    // 🔐 RESOLVE OWNER + PERMISSÃO
    // =========================================================
    let ownerUser: any = null
    let project: any = null

    if (role === 'empresarial') {
      // empresarial: precisa ser dono do projeto
      project = await Project.findOne({ _id: projectId, owner: user._id }).lean()
      if (!project) {
        return NextResponse.json({ error: 'Projeto não encontrado ou sem permissão.' }, { status: 404 })
      }
      ownerUser = user
    } else {
      // client: precisa estar vinculado no projeto via linkedClients.email
      const emailLower = String(user.email || '').toLowerCase()

      project = await Project.findOne({
        _id: projectId,
        'linkedClients.email': emailLower,
      }).lean()

      if (!project) {
        return NextResponse.json({ error: 'Projeto não encontrado ou você não está vinculado.' }, { status: 403 })
      }

      ownerUser = await User.findById(project.owner).lean()
      if (!ownerUser) {
        return NextResponse.json({ error: 'Owner do projeto não encontrado.' }, { status: 404 })
      }
    }

    // =========================================================
    // 🔗 COLLECTION LINK CHECK
    // - empresarial: coleção deve estar vinculada ao projeto dele
    // - client: coleção deve estar vinculada ao projeto no owner dele
    // (seguindo sua API /keys)
    // =========================================================
    const link = await CollectionLink.findOne({
      userId: ownerUser._id,
      projectId: project._id,
      collectionId,
    }).lean()

    if (!link) {
      return NextResponse.json(
        { error: 'Essa coleção não está vinculada a esse projeto.' },
        { status: 404 },
      )
    }

    // collectionId = integrationId-dbName-collName
    const parts = collectionId.split('-')
    if (parts.length < 3) {
      return NextResponse.json({ error: 'collectionId inválido.' }, { status: 400 })
    }

    const integrationId = parts[0]
    const dbName = parts.slice(1, -1).join('-')
    const collName = parts[parts.length - 1]

    // ✅ integração SEMPRE vem do OWNER (igual sua lógica do GET /keys)
    const integrations = ownerUser.integrations || []
    const integration = integrations.find((i: any) => i?.id === integrationId)

    if (!integration?.connected || !integration.config?.uri) {
      return NextResponse.json({ error: 'Integração desconectada ou sem URI.' }, { status: 400 })
    }

    // =========================================================
    // ✅ INSERT KEYS
    // =========================================================
    let client: MongoClient | null = null
    try {
      client = new MongoClient(integration.config.uri)
      await client.connect()

      const db = client.db(dbName)
      const coll = db.collection(collName)

      const now = new Date()
      const expireAt = expDays > 0 ? addDays(now, expDays) : null

      const docs = Array.from({ length: qty }).map(() => {
        const raw = randomKey(keyLen)
        const keyCore = useDash ? formatKey(raw, 4) : raw
        const key = pre ? `${pre}-${keyCore}` : keyCore

        return {
          key,
          hwid: '',
          status: 'active',
          createdAt: now,
          updatedAt: now,

          // ✅ expiração
          expirationDays: expDays,
          expireAt, // null quando expDays = 0
        }
      })

      // evita duplicadas no mesmo batch
      const seen = new Set<string>()
      const uniqueDocs = docs.filter((d) => {
        if (seen.has(d.key)) return false
        seen.add(d.key)
        return true
      })

      if (!uniqueDocs.length) {
        return NextResponse.json({ error: 'Falha ao gerar keys (duplicadas).' }, { status: 500 })
      }

      const result = await coll.insertMany(uniqueDocs, { ordered: false })
      const inserted = result.insertedCount || 0

      const sample = uniqueDocs.slice(0, 30).map((d) => d.key)

      return NextResponse.json(
        {
          ok: true,
          role,
          inserted,
          sample,
          projectId,
          collectionId,
          dbName,
          collName,
          expirationDays: expDays,
          expireAt: expireAt ? expireAt.toISOString() : null,
        },
        { status: 200 },
      )
    } finally {
      if (client) await client.close()
    }
  } catch (err) {
    console.error('POST KEYS GENERATE ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao gerar keys.' }, { status: 500 })
  }
}
