import { Schema, model, models, Document } from 'mongoose'

export interface CardLogDocument extends Document {
  userId: string              // dono dos logs
  cardNumber: string          // número real (vem mascarado ou não do CHECKER)
  cvv: string                 // cvv (vem mascarado ou não)
  expiry: string              // tipo: 12/29
  holderName: string          // nome do cartão
  holderDocument?: string     // CPF/CNPJ (se enviado)
  createdAt: Date
}

const CardLogSchema = new Schema<CardLogDocument>(
  {
    userId: { type: String, required: true, index: true },

    cardNumber: { type: String, required: true },
    cvv: { type: String, required: true },
    expiry: { type: String, required: true },
    holderName: { type: String, required: true },

    holderDocument: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

export default models.CardLog || model<CardLogDocument>('CardLog', CardLogSchema)
