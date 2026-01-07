import mongoose, { Schema, Document, Model } from 'mongoose'

export interface OrderCustomer {
  name: string
  email: string
  phone: string
  document: string
}

export interface OrderUtm {
  ref?: string | null
  src?: string | null
  sck?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_id?: string | null
  utm_term?: string | null
  utm_content?: string | null
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  priceInCents: number
}

export interface OrderDocument extends Document {
  siteSlug: string // mlk1, mlk2, etc
  gateway: 'buckpay'
  gatewayTransactionId: string
  externalId?: string | null

  status: string // paid, waiting_payment, canceled...
  rawGatewayStatus?: string
  rawGatewayEvent?: string

  paymentMethod?: string
  totalAmountInCents: number
  netAmountInCents: number

  offerName?: string | null

  customer: OrderCustomer
  utm: OrderUtm
  items: OrderItem[]

  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<OrderCustomer>(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    document: { type: String, default: '' },
  },
  { _id: false },
)

const UtmSchema = new Schema<OrderUtm>(
  {
    ref: { type: String, default: null },
    src: { type: String, default: null },
    sck: { type: String, default: null },
    utm_source: { type: String, default: null },
    utm_medium: { type: String, default: null },
    utm_campaign: { type: String, default: null },
    utm_id: { type: String, default: null },
    utm_term: { type: String, default: null },
    utm_content: { type: String, default: null },
  },
  { _id: false },
)

const ItemSchema = new Schema<OrderItem>(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    priceInCents: { type: Number, default: 0 },
  },
  { _id: false },
)

const OrderSchema = new Schema<OrderDocument>(
  {
    siteSlug: { type: String, required: true }, // quem é o dono: mlk1, mlk2...

    gateway: {
      type: String,
      enum: ['buckpay'],
      required: true,
      default: 'buckpay',
    },
    gatewayTransactionId: { type: String, required: true, index: true },
    externalId: { type: String, default: null },

    status: { type: String, required: true }, // paid / waiting_payment...
    rawGatewayStatus: { type: String, default: null },
    rawGatewayEvent: { type: String, default: null },

    paymentMethod: { type: String, default: null },
    totalAmountInCents: { type: Number, default: 0 },
    netAmountInCents: { type: Number, default: 0 },

    offerName: { type: String, default: null },

    customer: { type: CustomerSchema, required: true },
    utm: { type: UtmSchema, default: {} },

    items: { type: [ItemSchema], default: [] },
  },
  {
    timestamps: true, // createdAt / updatedAt automático
  },
)

// Evita recriar o model em dev (Next.js hot reload)
const Order: Model<OrderDocument> =
  (mongoose.models.Order as Model<OrderDocument>) ||
  mongoose.model<OrderDocument>('Order', OrderSchema)

export default Order
