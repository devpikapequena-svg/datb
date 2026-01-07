// models/FireQueue.ts
import { Schema, model, models, Document, Model } from 'mongoose'
import { IUser } from './User'

export type QueueStatus = 'rodando' | 'pausada' | 'agendada'

export interface IFireQueue extends Document {
  user: IUser['_id']
  name: string
  description: string
  linksCount: number
  groupsCount: number
  intervalLabel: string
  status: QueueStatus
  enabled: boolean
  nextRunAt: Date | null
  lastRunAt: Date | null
  // novo: referência real pros grupos
  groups: Schema.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const FireQueueSchema = new Schema<IFireQueue>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default:
        'Fila recém-criada. Conecte links, grupos e defina o intervalo para começar a usar.',
    },
    linksCount: {
      type: Number,
      default: 0,
    },
    groupsCount: {
      type: Number,
      default: 0,
    },
    intervalLabel: {
      type: String,
      required: true,
      default: 'Aleatório · 20–30 min',
    },
    status: {
      type: String,
      enum: ['rodando', 'pausada', 'agendada'],
      default: 'agendada',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    nextRunAt: {
      type: Date,
      default: null,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    // novo campo
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: 'GroupChannel',
      },
    ],
  },
  {
    timestamps: true,
  }
)

export const FireQueue: Model<IFireQueue> =
  models.FireQueue || model<IFireQueue>('FireQueue', FireQueueSchema)
