// localStorage-backed mock store for the Consumer Wallet (C-24) and
// Refunds & Disputes (C-25). Same async-shaped-API discipline as the wedge
// EV module so the surface can be swapped to a real backend later.

import { makeId, readJson, writeJson } from "@/shared/lib/storage";
import type {
  CardMethod,
  PaymentMethod,
  RefundEvent,
  RefundReason,
  RefundRequest,
  RefundStatus,
  UpiMethod,
} from "./types";

const METHODS_KEY = "consumerWalletMethods";
const REFUNDS_KEY = "consumerRefundRequests";

// ---- Payment methods ----

const SEED_METHODS: PaymentMethod[] = [
  {
    id: "pm-seed-upi",
    type: "upi",
    vpa: "demo@okhdfc",
    label: "Personal UPI",
    isDefault: true,
    addedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  } satisfies UpiMethod,
];

function loadMethods(): PaymentMethod[] {
  const existing = readJson<PaymentMethod[] | null>(METHODS_KEY, null);
  if (existing) return existing;
  writeJson(METHODS_KEY, SEED_METHODS);
  return SEED_METHODS;
}

function saveMethods(list: PaymentMethod[]) {
  writeJson(METHODS_KEY, list);
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  return loadMethods().sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0));
}

export async function addUpiMethod(input: {
  vpa: string;
  label?: string;
}): Promise<UpiMethod> {
  const list = loadMethods();
  const method: UpiMethod = {
    id: makeId("pm"),
    type: "upi",
    vpa: input.vpa.trim(),
    label: input.label?.trim() || undefined,
    isDefault: list.length === 0,
    addedAt: new Date().toISOString(),
  };
  list.unshift(method);
  saveMethods(list);
  return method;
}

export async function addCardMethod(input: {
  last4: string;
  brand: CardMethod["brand"];
  expMonth: number;
  expYear: number;
  holderName: string;
  label?: string;
}): Promise<CardMethod> {
  const list = loadMethods();
  const method: CardMethod = {
    id: makeId("pm"),
    type: "card",
    last4: input.last4.slice(-4),
    brand: input.brand,
    expMonth: input.expMonth,
    expYear: input.expYear,
    holderName: input.holderName.trim(),
    label: input.label?.trim() || undefined,
    isDefault: list.length === 0,
    addedAt: new Date().toISOString(),
  };
  list.unshift(method);
  saveMethods(list);
  return method;
}

export async function removePaymentMethod(id: string): Promise<boolean> {
  const list = loadMethods();
  const filtered = list.filter((m) => m.id !== id);
  if (filtered.length === list.length) return false;
  // If we removed the default, promote first remaining.
  const removedDefault = list.find((m) => m.id === id)?.isDefault;
  if (removedDefault && filtered[0]) filtered[0] = { ...filtered[0], isDefault: true };
  saveMethods(filtered);
  return true;
}

export async function setDefaultPaymentMethod(
  id: string,
): Promise<PaymentMethod | null> {
  const list = loadMethods().map((m) => ({ ...m, isDefault: m.id === id }));
  saveMethods(list);
  return list.find((m) => m.id === id) ?? null;
}

// ---- Refunds ----

const SEED_REFUNDS: RefundRequest[] = [
  {
    id: "ref-seed-1",
    userId: "guest",
    bookingRef: "evses-demo-1",
    bookingTitle: "OMR EV Charge · 18 Oct",
    amount: 240,
    reason: "charger_offline",
    detail: "Charger stopped mid-session. Only got 6 kWh out of 12.",
    status: "under_review",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    timeline: [
      {
        at: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: "submitted",
        note: "Refund request submitted",
      },
      {
        at: new Date(Date.now() - 86400000).toISOString(),
        status: "under_review",
        note: "Vendor asked to confirm session logs",
      },
    ],
  },
];

function loadRefunds(): RefundRequest[] {
  const existing = readJson<RefundRequest[] | null>(REFUNDS_KEY, null);
  if (existing) return existing;
  writeJson(REFUNDS_KEY, SEED_REFUNDS);
  return SEED_REFUNDS;
}

function saveRefunds(list: RefundRequest[]) {
  writeJson(REFUNDS_KEY, list);
}

export async function listRefundRequests(
  userId: string,
): Promise<RefundRequest[]> {
  return loadRefunds()
    .filter((r) => r.userId === userId || r.userId === "guest")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createRefundRequest(input: {
  userId: string;
  bookingRef: string;
  bookingTitle: string;
  amount: number;
  reason: RefundReason;
  detail?: string;
}): Promise<RefundRequest> {
  const now = new Date().toISOString();
  const req: RefundRequest = {
    id: makeId("ref"),
    userId: input.userId,
    bookingRef: input.bookingRef,
    bookingTitle: input.bookingTitle,
    amount: input.amount,
    reason: input.reason,
    detail: input.detail,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
    timeline: [
      { at: now, status: "submitted", note: "Refund request submitted" },
    ],
  };
  const list = loadRefunds();
  list.unshift(req);
  saveRefunds(list);
  return req;
}

export async function advanceRefundStatus(
  id: string,
  status: RefundStatus,
  note?: string,
): Promise<RefundRequest | null> {
  const list = loadRefunds();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const at = new Date().toISOString();
  const event: RefundEvent = { at, status, note };
  const updated: RefundRequest = {
    ...list[idx],
    status,
    updatedAt: at,
    timeline: [...list[idx].timeline, event],
  };
  list[idx] = updated;
  saveRefunds(list);
  return updated;
}
