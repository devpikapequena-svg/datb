// src/interfaces/utmify.ts

export interface UtmifyCustomer {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  country?: string; // ISO 3166-1 alfa-2
  ip?: string | null;
}

export interface UtmifyProduct {
  id: string; // ID do seu produto
  name: string;
  planId: string | null;
  planName: string | null;
  quantity: number;
  priceInCents: number;
}

export interface UtmifyTrackingParameters {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface UtmifyCommission {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS' | 'CAD';
}

export type UtmifyPaymentMethod =
  | 'credit_card'
  | 'boleto'
  | 'pix'
  | 'paypal'
  | 'free_price';

export type UtmifyOrderStatus =
  | 'waiting_payment'
  | 'paid'
  | 'refused'
  | 'refunded'
  | 'chargedback'
  | 'in_protest'
  | 'chargeback_reversal';

export interface UtmifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: UtmifyPaymentMethod;
  status: UtmifyOrderStatus;
  createdAt: string | null;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: UtmifyCustomer;
  products: UtmifyProduct[];
  trackingParameters: UtmifyTrackingParameters;
  commission: UtmifyCommission;
  isTest?: boolean;
}
