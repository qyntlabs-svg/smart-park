// Developer Portal module — public types shared across DEV-* screens
// (and reused by F-11 for the Fleet API keys screen).
// Mobility Kernel primitives: Identity, Provider, Payment, Notification.

export type ApiKeyScope =
  | "reservations.read"
  | "reservations.write"
  | "sessions.read"
  | "sessions.write"
  | "stations.read"
  | "webhooks.write"
  | "payments.read"
  | "vehicles.read"
  | "vehicles.write"
  | "drivers.read"
  | "reports.read";

export const SCOPE_LABEL: Record<ApiKeyScope, string> = {
  "reservations.read": "reservations · read",
  "reservations.write": "reservations · write",
  "sessions.read": "sessions · read",
  "sessions.write": "sessions · write",
  "stations.read": "stations · read",
  "webhooks.write": "webhooks · write",
  "payments.read": "payments · read",
  "vehicles.read": "vehicles · read",
  "vehicles.write": "vehicles · write",
  "drivers.read": "drivers · read",
  "reports.read": "reports · read",
};

export type ApiKeyEnv = "test" | "live";

export interface DevApiKey {
  id: string;
  label: string;
  env: ApiKeyEnv;
  keyMasked: string;
  scopes: ApiKeyScope[];
  createdAt: string;
  lastUsedAt?: string;
  rotatedAt?: string;
  revoked: boolean;
}

// ---------- Webhooks ----------

export type WebhookEvent =
  | "reservation.confirmed"
  | "reservation.cancelled"
  | "session.started"
  | "session.completed"
  | "payment.paid"
  | "payment.refunded"
  | "station.offline"
  | "charger.offline";

export const EVENT_LABEL: Record<WebhookEvent, string> = {
  "reservation.confirmed": "reservation.confirmed",
  "reservation.cancelled": "reservation.cancelled",
  "session.started": "session.started",
  "session.completed": "session.completed",
  "payment.paid": "payment.paid",
  "payment.refunded": "payment.refunded",
  "station.offline": "station.offline",
  "charger.offline": "charger.offline",
};

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secretMasked: string;
  signing: "hmac-sha256";
  active: boolean;
  createdAt: string;
  lastDeliveryAt?: string;
  lastStatusCode?: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  statusCode: number;
  attempts: number;
  requestBody: string;
  responseBody: string;
  createdAt: string;
}

// ---------- Sandbox ----------

export interface SandboxReservation {
  id: string;
  stationId: string;
  chargerType: string;
  amount: number;
  status: "requested" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface SandboxPayment {
  id: string;
  reservationId: string;
  amount: number;
  currency: "INR";
  status: "authorized" | "captured" | "failed" | "refunded";
  createdAt: string;
}

// ---------- Request logs ----------

export interface DevRequestLog {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  statusCode: number;
  latencyMs: number;
  keyId?: string;
  createdAt: string;
  requestBody?: string;
  responseBody?: string;
}

// ---------- Usage ----------

export interface UsageDay {
  date: string; // YYYY-MM-DD
  keyId: string;
  requests: number;
  errors: number;
  rateLimitedCount: number;
}

// ---------- Plans / billing ----------

export type DevPlanId = "sandbox" | "starter" | "growth" | "scale";

export interface DevPlan {
  id: DevPlanId;
  name: string;
  monthlyPrice: number;
  requestsIncluded: number;
  overageRate: number;
  webhookRetentionDays: number;
  features: string[];
}

export interface DevInvoice {
  id: string;
  month: string;
  plan: DevPlanId;
  requests: number;
  overageCost: number;
  total: number;
  status: "paid" | "issued" | "draft";
  issuedAt: string;
}

// ---------- Marketplace apps ----------

export interface DevPartnerApp {
  id: string;
  name: string;
  publisher: string;
  category: string;
  installs: number;
  rating: number;
  description: string;
  logoColor: string;
  scopes: ApiKeyScope[];
  featured: boolean;
}
