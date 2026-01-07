// models/NotificationSubscription.ts
import mongoose, { Schema, Document, models, model } from 'mongoose'

export interface NotificationSubscriptionDocument extends Document {
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  statuses: string[] // ['paid', 'pending', 'med']
  createdAt: Date
  updatedAt: Date
}

const NotificationSubscriptionSchema = new Schema<NotificationSubscriptionDocument>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    statuses: [{ type: String }],
  },
  {
    timestamps: true,
  },
)

const NotificationSubscription =
  (models.NotificationSubscription as mongoose.Model<NotificationSubscriptionDocument>) ||
  model<NotificationSubscriptionDocument>(
    'NotificationSubscription',
    NotificationSubscriptionSchema,
  )

export default NotificationSubscription
