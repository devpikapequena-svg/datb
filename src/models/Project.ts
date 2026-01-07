import mongoose, { Schema, Document } from 'mongoose'

export interface ILinkedClient {
  email: string
  name?: string
  userId?: mongoose.Types.ObjectId // Opcional, para vincular usuários existentes
}

export interface IProject extends Document {
  name: string
  slug: string
  status: 'active' | 'paused' | 'archived'
  owner: mongoose.Types.ObjectId // Ref para User
  linkedClients: ILinkedClient[]
  collectionsCount: number
  keysTotal: number
  createdAt: Date
  updatedAt: Date
}

const LinkedClientSchema = new Schema<ILinkedClient>({
  email: { type: String, required: true, lowercase: true },
  name: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
})

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  linkedClients: [LinkedClientSchema],
  collectionsCount: { type: Number, default: 0 },
  keysTotal: { type: Number, default: 0 },
}, {
  timestamps: true,
})

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)