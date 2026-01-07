// src/app/api/dashboard/overview/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Project } from '@/models/Project'
import CollectionLink from '@/models/CollectionLink'
import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET as string
type Plan = 'none' | 'client' | 'empresarial'

type Announcement = {
  id: string
  title: string
  subtitle: string
  when: string
  authorName: string
  authorAvatar?: string | null
  ctaLabel?: string
  ctaHref?: string
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function fmtDeltaPct(current: number, prev: number) {
  if (prev <= 0) return current > 0 ? '+100%' : ''
  const pct = ((current - prev) / prev) * 100
  const rounded = Math.round(pct)
  if (rounded === 0) return ''
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

function getSPDayRange(base = new Date()) {
  const tz = 'America/Sao_Paulo'
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(base)

  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value

  // Sem DST hoje. Usamos -03:00.
  const start = new Date(`${y}-${m}-${d}T00:00:00-03:00`)
  const end = new Date(`${y}-${m}-${d}T23:59:59.999-03:00`)
  return { start, end }
}

async function countResetsTodayForProjects(projectIds: string[]) {
  // Se você tiver uma coleção/model real de resets, coloque aqui certinho.
  // Isso aqui tenta achar algumas coleções comuns; se não existir, retorna 0 (real, não fake).
  const db = mongoose.connection?.db
  if (!db) return 0

  const { start, end } = getSPDayRange(new Date())

  const candidateCollections = ['hwidresets', 'hwid_resets', 'resets', 'hwidResets']
  for (const name of candidateCollections) {
    try {
      const exists = await db.listCollections({ name }).hasNext()
      if (!exists) continue

      const coll = db.collection(name)
      const count = await coll.countDocuments({
        createdAt: { $gte: start, $lte: end },
        $or: [{ projectId: { $in: projectIds } }, { project: { $in: projectIds } }],
      })

      return count || 0
    } catch {
      // tenta próxima
    }
  }

  return 0
}

async function sumKeysForCollectionIds(args: {
  collectionIds: string[]
  integrationMap: Map<string, any>
}) {
  const { collectionIds, integrationMap } = args
  let total = 0

  for (const collectionId of collectionIds) {
    const parts = collectionId.split('-')
    if (parts.length < 3) continue

    const integrationId = parts[0]
    const dbName = parts.slice(1, -1).join('-')
    const collName = parts[parts.length - 1]

    const integration = integrationMap.get(integrationId)
    if (!integration?.connected || !integration.config?.uri) continue

    let client: MongoClient | null = null
    try {
      client = new MongoClient(integration.config.uri)
      await client.connect()

      const db = client.db(dbName)
      const coll = db.collection(collName)

      const hasRelevantField = await coll.findOne({
        $or: [{ key: { $exists: true } }, { hwid: { $exists: true } }, { code: { $exists: true } }],
      })
      if (!hasRelevantField) continue

      total += await coll.countDocuments()
    } catch (err) {
      console.error(`Erro ao contar keys em ${collectionId}:`, err)
    } finally {
      if (client) await client.close()
    }
  }

  return total
}

export async function GET() {
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
    const role: 'client' | 'empresarial' = plan === 'empresarial' ? 'empresarial' : 'client'

    // projetos visíveis: dono OU linkedClient
    const visibleProjects = await Project.find({
      $or: [{ owner: user._id }, { 'linkedClients.email': user.email.toLowerCase() }],
    }).lean()

    const projectIds = visibleProjects.map((p: any) => p._id.toString())
    const projectsTotal = visibleProjects.length

    // linked clients total (somatório) — só empresarial (somente projetos onde ele é dono)
    const linkedClientsTotal =
      role === 'empresarial'
        ? visibleProjects
            .filter((p: any) => String(p.owner) === String(user._id))
            .reduce((acc: number, p: any) => acc + (p.linkedClients?.length || 0), 0)
        : 0

    // collections total = quantidade de CollectionLinks nesses projetos
    const collectionsTotal = await CollectionLink.countDocuments({ projectId: { $in: projectIds } })

    // keys total = soma de docs nas coleções vinculadas (via URI do owner)
    let keysActiveTotal = 0

    if (role === 'empresarial') {
      const integrations = user.integrations || []
      const integrationMap = new Map(integrations.map((i: any) => [i.id, i]))

      const links = await CollectionLink.find({ projectId: { $in: projectIds } }).lean()
      const collectionIds = links.map((l: any) => l.collectionId)

      keysActiveTotal = await sumKeysForCollectionIds({ collectionIds, integrationMap })
    } else {
      for (const project of visibleProjects as any[]) {
        const ownerUser = await User.findById(project.owner).lean()
        if (!ownerUser) continue

        const integrations = ownerUser.integrations || []
        const integrationMap = new Map(integrations.map((i: any) => [i.id, i]))

        const links = await CollectionLink.find({ projectId: project._id }).lean()
        const collectionIds = links.map((l: any) => l.collectionId)

        keysActiveTotal += await sumKeysForCollectionIds({ collectionIds, integrationMap })
      }
    }

    // resets hoje (real: se não existir coleção, retorna 0)
    const resetsToday = await countResetsTodayForProjects(projectIds)

    // deltas reais onde dá (projects/collections com base em createdAt)
    const { end: yesterdayEnd } = getSPDayRange(new Date(Date.now() - 24 * 60 * 60 * 1000))

    const projectsTotalYesterday = await Project.countDocuments({
      $or: [{ owner: user._id }, { 'linkedClients.email': user.email.toLowerCase() }],
      createdAt: { $lte: yesterdayEnd },
    })

    const collectionsTotalYesterday = await CollectionLink.countDocuments({
      createdAt: { $lte: yesterdayEnd },
      projectId: { $in: projectIds },
    })

    // keys/resets/linkedClients: sem histórico/snapshot, não inventa delta
    const deltas = {
      projects: fmtDeltaPct(projectsTotal, projectsTotalYesterday),
      collections: fmtDeltaPct(collectionsTotal, collectionsTotalYesterday),
      keys: '',
      resets: '',
      linkedClients: '',
    }

    const announcements: Announcement[] = [
      {
        id: 'n1',
        title: 'Update — Sistema de geração de keys adicionado',
        subtitle:
          'Novo sistema de geração de keys disponível. Agora é possível criar e gerenciar keys com mais agilidade e controle no painel.',
        when: 'Hoje',
        authorName: 'Equipe',
        authorAvatar: '/avatar.jpg',
        ctaLabel: 'Abrir keys',
        ctaHref: '/keys',
      },
    ]

    return NextResponse.json(
      {
        role,
        projectsTotal,
        collectionsTotal,
        keysActiveTotal,
        resetsToday,
        linkedClientsTotal,
        deltas,
        announcements,
        giveaways: [],
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('GET DASHBOARD OVERVIEW ERROR', err)
    return NextResponse.json({ error: 'Erro interno ao buscar overview.' }, { status: 500 })
  }
}
