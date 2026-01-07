// src/models/CollectionLink.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface ICollectionLink extends Document {
  userId: mongoose.Types.ObjectId
  collectionId: string // e.g., "mongo-test-collectionName"
  projectId: string
  createdAt: Date
  updatedAt: Date
}

const CollectionLinkSchema = new Schema<ICollectionLink>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collectionId: { type: String, required: true },
  projectId: { type: String, required: true },
}, {
  timestamps: true,
})

// Índice único para evitar duplicatas
CollectionLinkSchema.index({ userId: 1, collectionId: 1 }, { unique: true })

export default mongoose.models.CollectionLink || mongoose.model<ICollectionLink>('CollectionLink', CollectionLinkSchema)