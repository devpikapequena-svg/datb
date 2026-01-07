// models/User.ts
import { Schema, model, models, Document, Model } from 'mongoose'

export type Plan = 'none' | 'client' | 'empresarial'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  image?: string | null

  plan: Plan

  // ✅ Billing fields
  planPaidAt?: Date | null
  planExpiresAt?: Date | null
  planLastTransactionHash?: string | null
  planExternalId?: string | null

  integrations: any[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    password: { type: String, required: true, minlength: 6 },

    image: { type: String, default: null },

    plan: {
      type: String,
      enum: ['none', 'client', 'empresarial'],
      default: 'none',
    },

    // ✅ Billing fields (AGORA SALVA)
    planPaidAt: { type: Date, default: null },
    planExpiresAt: { type: Date, default: null },
    planLastTransactionHash: { type: String, default: null },
    planExternalId: { type: String, default: null },

    integrations: [Schema.Types.Mixed],
  },
  { timestamps: true },
)

export const User: Model<IUser> = models.User || model<IUser>('User', UserSchema)
