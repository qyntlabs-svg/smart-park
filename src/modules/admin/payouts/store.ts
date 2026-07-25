// A-07 Payouts Ops — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type { PayoutBatch, PayoutException } from "./types";

const BATCH_KEY = "adminPayoutBatches";
const EXC_KEY = "adminPayoutExceptions";
const dayMs = 86_400_000;

const SEED_BATCHES: PayoutBatch[] = [
  { id: "b_1", runAt: new Date(Date.now() - dayMs * 1).toISOString(), status: "completed", total: 428300, count: 42, succeeded: 42, failed: 0, method: "upi" },
  { id: "b_2", runAt: new Date(Date.now() - dayMs * 8).toISOString(), status: "partial_failure", total: 512400, count: 51, succeeded: 49, failed: 2, method: "upi", operatorNote: "2 UPI mandates expired" },
  { id: "b_3", runAt: new Date(Date.now() - dayMs * 15).toISOString(), status: "completed", total: 389200, count: 40, succeeded: 40, failed: 0, method: "upi" },
  { id: "b_4", runAt: new Date(Date.now() - dayMs * 22).toISOString(), status: "completed", total: 411900, count: 38, succeeded: 38, failed: 0, method: "bank" },
  { id: "b_5", runAt: new Date(Date.now() + dayMs).toISOString(), status: "queued", total: 302100, count: 30, succeeded: 0, failed: 0, method: "upi" },
];

const SEED_EXCEPTIONS: PayoutException[] = [
  {
    id: "ex_1",
    batchId: "b_2",
    providerId: "p_3",
    providerName: "Panagal Multi-lot",
    amount: 12800,
    reason: "UPI mandate expired — needs reauth",
    createdAt: new Date(Date.now() - dayMs * 8).toISOString(),
    resolved: false,
  },
  {
    id: "ex_2",
    batchId: "b_2",
    providerId: "p_9",
    providerName: "RapidTow OMR",
    amount: 8900,
    reason: "IFSC changed — awaiting new bank detail",
    createdAt: new Date(Date.now() - dayMs * 8).toISOString(),
    resolved: false,
  },
];

function loadBatches(): PayoutBatch[] {
  const existing = readJson<PayoutBatch[] | null>(BATCH_KEY, null);
  if (existing) return existing;
  writeJson(BATCH_KEY, SEED_BATCHES);
  return SEED_BATCHES;
}

function saveBatches(list: PayoutBatch[]) {
  writeJson(BATCH_KEY, list);
}

function loadExceptions(): PayoutException[] {
  const existing = readJson<PayoutException[] | null>(EXC_KEY, null);
  if (existing) return existing;
  writeJson(EXC_KEY, SEED_EXCEPTIONS);
  return SEED_EXCEPTIONS;
}

function saveExceptions(list: PayoutException[]) {
  writeJson(EXC_KEY, list);
}

export async function listPayoutBatches(): Promise<PayoutBatch[]> {
  return loadBatches().sort((a, b) => b.runAt.localeCompare(a.runAt));
}

export async function listPayoutExceptions(): Promise<PayoutException[]> {
  return loadExceptions().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function runPayoutBatch(): Promise<PayoutBatch> {
  const list = loadBatches();
  const batch: PayoutBatch = {
    id: makeId("b"),
    runAt: new Date().toISOString(),
    status: "processing",
    total: 302100,
    count: 30,
    succeeded: 0,
    failed: 0,
    method: "upi",
  };
  list.unshift(batch);
  saveBatches(list);
  // Simulate completion after brief delay would require timers; keep sync for mock.
  setTimeout(() => {
    const l = loadBatches();
    const i = l.findIndex((b) => b.id === batch.id);
    if (i === -1) return;
    l[i] = { ...l[i], status: "completed", succeeded: 30, failed: 0 };
    saveBatches(l);
  }, 800);
  return batch;
}

export async function resolveException(id: string): Promise<PayoutException | null> {
  const list = loadExceptions();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], resolved: true };
  saveExceptions(list);
  return list[idx];
}

export interface PayoutOpsAggregate {
  last30dPaid: number;
  last30dCount: number;
  pendingSum: number;
  exceptionCount: number;
  weeklyTrend: Array<{ label: string; amount: number }>;
}

export async function getPayoutOpsAggregate(): Promise<PayoutOpsAggregate> {
  const batches = loadBatches();
  const exc = loadExceptions();
  const paid = batches.filter((b) => b.status === "completed" || b.status === "partial_failure");
  const pending = batches.filter((b) => b.status === "queued" || b.status === "processing");
  const now = Date.now();
  const weeklyTrend = Array.from({ length: 4 }).map((_, i) => {
    const start = now - (i + 1) * 7 * dayMs;
    const end = now - i * 7 * dayMs;
    const sum = paid
      .filter((b) => {
        const t = new Date(b.runAt).getTime();
        return t >= start && t < end;
      })
      .reduce((n, b) => n + b.total, 0);
    return { label: `W${4 - i}`, amount: sum };
  });
  return {
    last30dPaid: paid.reduce((n, b) => n + b.total, 0),
    last30dCount: paid.reduce((n, b) => n + b.count, 0),
    pendingSum: pending.reduce((n, b) => n + b.total, 0),
    exceptionCount: exc.filter((e) => !e.resolved).length,
    weeklyTrend,
  };
}
