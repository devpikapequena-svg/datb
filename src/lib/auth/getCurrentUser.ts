// lib/auth/getCurrentUser.ts
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no .env.local')
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return null

  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }

  await connectDB()

  const user = await User.findById(decoded.id).lean()
  if (!user) return null

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    plan: user.plan,
  }
}
