// A-09 Fraud & Risk — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";
import type { FlaggedAccount, FraudTrendPoint } from "./types";

const KEY = "adminFraudFlags";
const dayMs = 86_400_000;

const SEED: FlaggedAccount[] = [
  {
    id: "f_1",
    name: "Rakesh V.",
    phone: "+91 98765 40001",
    reason: "5 chargebacks in 30 days",
    score: 92,
    level: "critical",
    chargebacks: 5,
    disputes: 4,
    bookings: 12,
    chargebackRatePct: 41,
    city: "Chennai",
    lastActivity: new Date(Date.now() - 3600_000 * 4).toISOString(),
    status: "flagged",
  },
  {
    id: "f_2",
    name: "Nikhil D.",
    phone: "+91 98765 40002",
    reason: "Signup from prepaid SIM + refund abuse",
    score: 78,
    level: "high",
    chargebacks: 2,
    disputes: 3,
    bookings: 9,
    chargebackRatePct: 22,
    city: "Bengaluru",
    lastActivity: new Date(Date.now() - dayMs).toISOString(),
    status: "flagged",
  },
  {
    id: "f_3",
    name: "Vishal A.",
    phone: "+91 98765 40003",
    reason: "Multiple payment methods rotated",
    score: 55,
    level: "med",
    chargebacks: 1,
    disputes: 1,
    bookings: 21,
    chargebackRatePct: 4.7,
    city: "Chennai",
    lastActivity: new Date(Date.now() - dayMs * 3).toISOString(),
    status: "reviewed_ok",
  },
  {
    id: "f_4",
    name: "Bhargav P.",
    phone: "+91 98765 40004",
    reason: "Compromised device — anti-fraud match",
    score: 88,
    level: "critical",
    chargebacks: 3,
    disputes: 2,
    bookings: 6,
    chargebackRatePct: 50,
    city: "Chennai",
    lastActivity: new Date(Date.now() - 3600_000 * 12).toISOString(),
    status: "blocked",
  },
];

function load(): FlaggedAccount[] {
  const existing = readJson<FlaggedAccount[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: FlaggedAccount[]) {
  writeJson(KEY, list);
}

export async function listFlags(): Promise<FlaggedAccount[]> {
  return load().sort((a, b) => b.score - a.score);
}

export async function updateFlagStatus(
  id: string,
  status: FlaggedAccount["status"],
): Promise<FlaggedAccount | null> {
  const list = load();
  const idx = list.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status };
  save(list);
  if (status === "blocked") {
    pushNotification({
      audience: "consumer",
      audienceId: list[idx].phone,
      title: "Account blocked",
      body: "Contact support to appeal.",
    });
  }
  return list[idx];
}

export async function getFraudTrend(): Promise<FraudTrendPoint[]> {
  // Deterministic mock trend
  return Array.from({ length: 12 }).map((_, i) => ({
    label: `W${i + 1}`,
    chargebackRate: Math.max(0.4, +(1.2 + Math.sin(i / 2) * 0.6).toFixed(2)),
    disputeRate: Math.max(0.6, +(2.0 + Math.cos(i / 2) * 0.9).toFixed(2)),
  }));
}
