// Developer Portal — localStorage-backed mock store.
// Same swap-later pattern as modules/ev/store.ts.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type {
  ApiKeyEnv,
  ApiKeyScope,
  DevApiKey,
  DevInvoice,
  DevPartnerApp,
  DevPlan,
  DevRequestLog,
  SandboxPayment,
  SandboxReservation,
  UsageDay,
  Webhook,
  WebhookDelivery,
  WebhookEvent,
} from "./types";

const K = {
  keys: "devApiKeys",
  webhooks: "devWebhooks",
  webhookDeliveries: "devWebhookDeliveries",
  sandboxReservations: "devSandboxReservations",
  sandboxPayments: "devSandboxPayments",
  logs: "devRequestLogs",
  usage: "devUsage",
  invoices: "devInvoices",
  apps: "devApps",
  plan: "devActivePlan",
} as const;

// ---------- Seed data ----------

const now = () => new Date().toISOString();
const daysAgo = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
};

const SEED_KEYS: DevApiKey[] = [
  {
    id: "k-live-primary",
    label: "Production integration",
    env: "live",
    keyMasked: "sk_live_****9f2a",
    scopes: ["reservations.read", "reservations.write", "sessions.read", "payments.read"],
    createdAt: daysAgo(120),
    lastUsedAt: daysAgo(0, 14),
    revoked: false,
  },
  {
    id: "k-live-readonly",
    label: "BI read-only",
    env: "live",
    keyMasked: "sk_live_****4b18",
    scopes: ["reservations.read", "sessions.read", "reports.read"],
    createdAt: daysAgo(58),
    lastUsedAt: daysAgo(1, 6),
    revoked: false,
  },
  {
    id: "k-test-main",
    label: "Sandbox — CI",
    env: "test",
    keyMasked: "sk_test_****ccd0",
    scopes: [
      "reservations.read",
      "reservations.write",
      "sessions.read",
      "sessions.write",
      "webhooks.write",
    ],
    createdAt: daysAgo(210),
    lastUsedAt: daysAgo(0, 9),
    revoked: false,
  },
];

const SEED_WEBHOOKS: Webhook[] = [
  {
    id: "wh-primary",
    url: "https://ops.parkerx.co/webhooks/smartpark",
    events: ["reservation.confirmed", "session.completed", "payment.paid"],
    secretMasked: "whsec_****3f81",
    signing: "hmac-sha256",
    active: true,
    createdAt: daysAgo(84),
    lastDeliveryAt: daysAgo(0, 15),
    lastStatusCode: 200,
  },
  {
    id: "wh-payments",
    url: "https://payouts.parkerx.co/hooks/paid",
    events: ["payment.paid", "payment.refunded"],
    secretMasked: "whsec_****a02b",
    signing: "hmac-sha256",
    active: true,
    createdAt: daysAgo(46),
    lastDeliveryAt: daysAgo(2),
    lastStatusCode: 200,
  },
  {
    id: "wh-alerts",
    url: "https://alerts.parkerx.co/incidents",
    events: ["station.offline", "charger.offline"],
    secretMasked: "whsec_****ff77",
    signing: "hmac-sha256",
    active: false,
    createdAt: daysAgo(180),
    lastDeliveryAt: daysAgo(90),
    lastStatusCode: 500,
  },
];

const SEED_DELIVERIES: WebhookDelivery[] = Array.from({ length: 32 }, (_, i) => {
  const event: WebhookEvent = (
    [
      "reservation.confirmed",
      "session.completed",
      "payment.paid",
      "charger.offline",
      "reservation.cancelled",
    ] as WebhookEvent[]
  )[i % 5];
  const statusCode = i % 8 === 0 ? 500 : i % 12 === 0 ? 404 : 200;
  return {
    id: `whd-${i + 1}`,
    webhookId: i % 3 === 0 ? "wh-primary" : i % 3 === 1 ? "wh-payments" : "wh-alerts",
    event,
    statusCode,
    attempts: statusCode === 200 ? 1 : Math.min(4, Math.floor(i / 3) + 1),
    requestBody: JSON.stringify(
      {
        id: `evt_${i + 1000}`,
        type: event,
        created: daysAgo(Math.floor(i / 2), 8 + (i % 12)),
        data: { object: {} },
      },
      null,
      2,
    ),
    responseBody:
      statusCode === 200
        ? '{"received":true}'
        : '{"error":"upstream timeout"}',
    createdAt: daysAgo(Math.floor(i / 2), 8 + (i % 12)),
  };
});

const SEED_SANDBOX_RES: SandboxReservation[] = Array.from({ length: 12 }, (_, i) => ({
  id: `sbx_res_${1000 + i}`,
  stationId: i % 2 === 0 ? "ev-seed-omr" : "ev-seed-velachery",
  chargerType: i % 2 === 0 ? "ccs" : "type2",
  amount: 400 + (i % 5) * 120,
  status:
    i % 5 === 0
      ? "completed"
      : i % 3 === 0
        ? "cancelled"
        : i < 4
          ? "requested"
          : "confirmed",
  createdAt: daysAgo(Math.floor(i / 2), 10 + i),
}));

const SEED_SANDBOX_PAY: SandboxPayment[] = SEED_SANDBOX_RES.slice(0, 8).map((r, i) => ({
  id: `sbx_pay_${5000 + i}`,
  reservationId: r.id,
  amount: r.amount,
  currency: "INR",
  status: i % 4 === 0 ? "refunded" : i % 5 === 0 ? "failed" : "captured",
  createdAt: r.createdAt,
}));

const PATHS = [
  { method: "POST" as const, path: "/v1/reservations", body: '{"stationId":"ev-seed-omr","chargerType":"ccs"}' },
  { method: "GET" as const, path: "/v1/sessions/:id" },
  { method: "GET" as const, path: "/v1/stations" },
  { method: "POST" as const, path: "/v1/payments/refunds", body: '{"reservationId":"evres_1"}' },
  { method: "GET" as const, path: "/v1/reservations" },
];

const SEED_LOGS: DevRequestLog[] = Array.from({ length: 40 }, (_, i) => {
  const p = PATHS[i % PATHS.length];
  const statusCode =
    i % 15 === 0 ? 500 : i % 11 === 0 ? 429 : i % 7 === 0 ? 400 : 200;
  return {
    id: `req_${i + 1}`,
    method: p.method,
    path: p.path,
    statusCode,
    latencyMs: 40 + Math.round(Math.random() * 380),
    keyId: i % 3 === 0 ? "k-test-main" : i % 3 === 1 ? "k-live-primary" : "k-live-readonly",
    createdAt: daysAgo(Math.floor(i / 4), 9 + (i % 10)),
    requestBody: p.body,
    responseBody:
      statusCode === 200
        ? '{"ok":true}'
        : statusCode === 429
          ? '{"error":"rate_limited"}'
          : statusCode === 400
            ? '{"error":"invalid_parameter"}'
            : '{"error":"internal_error"}',
  };
});

const SEED_USAGE: UsageDay[] = (() => {
  const days: UsageDay[] = [];
  const keys = ["k-live-primary", "k-live-readonly", "k-test-main"];
  for (let d = 29; d >= 0; d--) {
    keys.forEach((k) => {
      const base = k === "k-live-primary" ? 2600 : k === "k-live-readonly" ? 900 : 1450;
      const req = base + Math.round(Math.sin(d / 3) * 400) + Math.round(Math.random() * 300);
      const errors = Math.round(req * 0.012);
      days.push({
        date: new Date(Date.now() - d * 86400000).toISOString().slice(0, 10),
        keyId: k,
        requests: req,
        errors,
        rateLimitedCount: Math.round(req * 0.003),
      });
    });
  }
  return days;
})();

const SEED_INVOICES: DevInvoice[] = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const requests = 220000 + Math.round(Math.random() * 90000);
  const overage = Math.max(0, requests - 250000);
  const overageCost = overage * 0.002;
  return {
    id: `dev-inv-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    plan: "growth",
    requests,
    overageCost: Math.round(overageCost),
    total: 15000 + Math.round(overageCost),
    status: i === 0 ? "draft" : i === 1 ? "issued" : "paid",
    issuedAt: daysAgo(i * 30, 9),
  };
});

const SEED_APPS: DevPartnerApp[] = [
  {
    id: "app-parkerx",
    name: "ParkerX Dashboard",
    publisher: "ParkerX Labs",
    category: "Analytics",
    installs: 1240,
    rating: 4.7,
    description:
      "Bird's eye BI dashboard that ingests SmartPark reservations, sessions, and payouts in real time.",
    logoColor: "#6366f1",
    scopes: ["reservations.read", "sessions.read", "reports.read"],
    featured: true,
  },
  {
    id: "app-chargerelay",
    name: "ChargeRelay Roaming",
    publisher: "Relay Networks",
    category: "Roaming",
    installs: 812,
    rating: 4.5,
    description:
      "Bridges reservations from partner networks into your SmartPark operator dashboard.",
    logoColor: "#0ea5e9",
    scopes: ["reservations.write", "sessions.write"],
    featured: true,
  },
  {
    id: "app-fleetlens",
    name: "FleetLens for Ops",
    publisher: "Fleetlens Inc",
    category: "Fleet",
    installs: 604,
    rating: 4.3,
    description:
      "Ties Fleet OS energy analytics into your Slack + PagerDuty on-call rotation.",
    logoColor: "#f97316",
    scopes: ["vehicles.read", "drivers.read", "reports.read"],
    featured: false,
  },
  {
    id: "app-driverpay",
    name: "DriverPay Payroll",
    publisher: "DriverPay",
    category: "Payroll",
    installs: 380,
    rating: 4.1,
    description:
      "Automated per-driver stipends based on total km, no-show rate, and rating from the SmartPark API.",
    logoColor: "#22c55e",
    scopes: ["drivers.read", "reports.read"],
    featured: false,
  },
  {
    id: "app-refundops",
    name: "RefundOps",
    publisher: "TrustOps",
    category: "Support",
    installs: 210,
    rating: 4.6,
    description:
      "Zendesk macros to issue refunds and re-book reservations from the support desk.",
    logoColor: "#ef4444",
    scopes: ["reservations.read", "reservations.write", "payments.read"],
    featured: false,
  },
];

// ---------- helpers ----------

function readSeeded<T>(key: string, seed: T): T {
  const existing = readJson<T | null>(key, null);
  if (existing !== null && existing !== undefined) return existing;
  writeJson(key, seed);
  return seed;
}

// ---------- API keys ----------

export async function listDevApiKeys(): Promise<DevApiKey[]> {
  return readSeeded(K.keys, SEED_KEYS);
}

export async function createDevApiKey(input: {
  label: string;
  env: ApiKeyEnv;
  scopes: ApiKeyScope[];
}): Promise<{ key: DevApiKey; plaintext: string }> {
  const list = await listDevApiKeys();
  const secret = `sk_${input.env}_${Math.random().toString(36).slice(2, 12)}${Math.random()
    .toString(36)
    .slice(2, 12)}`;
  const rec: DevApiKey = {
    id: makeId("k"),
    label: input.label,
    env: input.env,
    keyMasked: `sk_${input.env}_****${secret.slice(-4)}`,
    scopes: input.scopes,
    createdAt: now(),
    revoked: false,
  };
  list.unshift(rec);
  writeJson(K.keys, list);
  return { key: rec, plaintext: secret };
}

export async function rotateDevApiKey(id: string): Promise<DevApiKey | null> {
  const list = await listDevApiKeys();
  const idx = list.findIndex((k) => k.id === id);
  if (idx === -1) return null;
  const secret = `sk_${list[idx].env}_${Math.random().toString(36).slice(2, 12)}`;
  list[idx] = {
    ...list[idx],
    keyMasked: `sk_${list[idx].env}_****${secret.slice(-4)}`,
    rotatedAt: now(),
  };
  writeJson(K.keys, list);
  return list[idx];
}

export async function revokeDevApiKey(id: string): Promise<DevApiKey | null> {
  const list = await listDevApiKeys();
  const idx = list.findIndex((k) => k.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], revoked: true };
  writeJson(K.keys, list);
  return list[idx];
}

// ---------- Webhooks ----------

export async function listWebhooks(): Promise<Webhook[]> {
  return readSeeded(K.webhooks, SEED_WEBHOOKS);
}

export async function upsertWebhook(w: Webhook): Promise<Webhook> {
  const list = await listWebhooks();
  const idx = list.findIndex((x) => x.id === w.id);
  if (idx === -1) list.unshift(w);
  else list[idx] = w;
  writeJson(K.webhooks, list);
  return w;
}

export async function createWebhook(input: {
  url: string;
  events: WebhookEvent[];
}): Promise<Webhook> {
  const secret = `whsec_${Math.random().toString(36).slice(2, 12)}`;
  const w: Webhook = {
    id: makeId("wh"),
    url: input.url,
    events: input.events,
    secretMasked: `whsec_****${secret.slice(-4)}`,
    signing: "hmac-sha256",
    active: true,
    createdAt: now(),
  };
  return upsertWebhook(w);
}

export async function toggleWebhook(id: string): Promise<Webhook | null> {
  const list = await listWebhooks();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], active: !list[idx].active };
  writeJson(K.webhooks, list);
  return list[idx];
}

export async function deleteWebhook(id: string): Promise<boolean> {
  const list = await listWebhooks();
  const next = list.filter((x) => x.id !== id);
  writeJson(K.webhooks, next);
  return next.length !== list.length;
}

export async function listWebhookDeliveries(): Promise<WebhookDelivery[]> {
  return readSeeded(K.webhookDeliveries, SEED_DELIVERIES);
}

// ---------- Sandbox ----------

export async function listSandboxReservations(): Promise<SandboxReservation[]> {
  return readSeeded(K.sandboxReservations, SEED_SANDBOX_RES);
}

export async function createSandboxReservation(input: {
  stationId: string;
  chargerType: string;
  amount: number;
}): Promise<SandboxReservation> {
  const list = await listSandboxReservations();
  const rec: SandboxReservation = {
    id: `sbx_res_${Math.floor(Math.random() * 100000)}`,
    ...input,
    status: "requested",
    createdAt: now(),
  };
  list.unshift(rec);
  writeJson(K.sandboxReservations, list);
  return rec;
}

export async function listSandboxPayments(): Promise<SandboxPayment[]> {
  return readSeeded(K.sandboxPayments, SEED_SANDBOX_PAY);
}

// ---------- Logs ----------

export async function listDevRequestLogs(): Promise<DevRequestLog[]> {
  return readSeeded(K.logs, SEED_LOGS);
}

// ---------- Usage ----------

export async function listDevUsage(): Promise<UsageDay[]> {
  return readSeeded(K.usage, SEED_USAGE);
}

// ---------- Plans / invoices ----------

export const PLANS: DevPlan[] = [
  {
    id: "sandbox",
    name: "Sandbox",
    monthlyPrice: 0,
    requestsIncluded: 10000,
    overageRate: 0,
    webhookRetentionDays: 3,
    features: ["Test mode only", "1 webhook", "Community support"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 4900,
    requestsIncluded: 100000,
    overageRate: 0.004,
    webhookRetentionDays: 14,
    features: ["Live mode", "5 webhooks", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 15000,
    requestsIncluded: 250000,
    overageRate: 0.002,
    webhookRetentionDays: 60,
    features: ["Live mode", "Unlimited webhooks", "Chat + email"],
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 45000,
    requestsIncluded: 1000000,
    overageRate: 0.001,
    webhookRetentionDays: 180,
    features: ["Priority routing", "24/7 support", "99.95% SLA"],
  },
];

export async function getActivePlan(): Promise<DevPlan> {
  const stored = readJson<string | null>(K.plan, "growth");
  return PLANS.find((p) => p.id === stored) ?? PLANS[2];
}

export async function setActivePlan(id: DevPlan["id"]): Promise<DevPlan> {
  writeJson(K.plan, id);
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export async function listDevInvoices(): Promise<DevInvoice[]> {
  return readSeeded(K.invoices, SEED_INVOICES);
}

// ---------- Apps ----------

export async function listPartnerApps(): Promise<DevPartnerApp[]> {
  return readSeeded(K.apps, SEED_APPS);
}
