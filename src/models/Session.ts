// models/Session.ts (se não existir, crie)
import { Schema, model, models, Document } from 'mongoose'

export interface ISession extends Document {
  userId: string
  device: string
  location: string
  token: string
  ip: string
  lastActive: Date
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true },
    device: { type: String, required: true },
    location: { type: String, required: true },
    token: { type: String, required: true },
    ip: { type: String, required: true },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const Session = models.Session || model<ISession>('Session', SessionSchema)