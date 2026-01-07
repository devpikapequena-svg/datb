// src/models/AdSpend.ts
import mongoose, { Schema, Document, models, model } from 'mongoose'

export type AdSpendType = 'ad' | 'med'

export interface IAdSpend extends Document {
  userId: string
  siteSlug: string
  siteName: string
  refDate: string // Dia de referência no formato 'YYYY-MM-DD' (data de Brasília)
  amount: number
  notes?: string | null
  type: AdSpendType
}

const AdSpendSchema = new Schema<IAdSpend>(
  {
    userId: { type: String, required: true, index: true },
    siteSlug: { type: String, required: true },
    siteName: { type: String, required: true },
    refDate: { type: String, required: true, index: true }, // ex.: '2025-12-05'
    amount: { type: Number, required: true },
    notes: { type: String, default: null },

    // 🔥 novo campo: tipo de gasto (anúncio ou MED)
    type: {
      type: String,
      enum: ['ad', 'med'],
      default: 'ad',
      index: true,
    },
  },
  { timestamps: true },
)

AdSpendSchema.index({ userId: 1, refDate: 1, siteSlug: 1 })

export default (models.AdSpend as mongoose.Model<IAdSpend>) ||
  model<IAdSpend>('AdSpend', AdSpendSchema)
