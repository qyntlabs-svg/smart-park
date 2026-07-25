// A-11 Platform Pricing Rules — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import type { PromoCampaign, Subsidy, TakeRate } from "./types";

const TAKE_KEY = "adminTakeRates";
const SUB_KEY = "adminSubsidies";
const PROMO_KEY = "adminPromos";

const SEED_TAKES: TakeRate[] = [
  { kind: "parking", percentage: 8, minFee: 5, updatedAt: new Date().toISOString() },
  { kind: "ev", percentage: 10, minFee: 2, updatedAt: new Date().toISOString() },
  { kind: "mechanic", percentage: 12, minFee: 20, updatedAt: new Date().toISOString() },
  { kind: "tow", percentage: 15, minFee: 25, updatedAt: new Date().toISOString() },
  { kind: "rental", percentage: 6, minFee: 15, updatedAt: new Date().toISOString() },
];

const SEED_SUBSIDIES: Subsidy[] = [
  {
    id: "sub_1",
    name: "EV weekday morning subsidy",
    description: "₹40 off first hour, Mon–Fri 8–11am",
    target: "consumer",
    amountPct: 20,
    budget: 500_000,
    spent: 128_400,
    active: true,
    validUntil: new Date(Date.now() + 60 * 86_400_000).toISOString(),
  },
  {
    id: "sub_2",
    name: "New vendor waived take-rate",
    description: "0% platform fee for first 30 days after activation",
    target: "vendor",
    amountPct: 8,
    budget: 200_000,
    spent: 44_800,
    active: true,
    validUntil: new Date(Date.now() + 90 * 86_400_000).toISOString(),
  },
];

const SEED_PROMOS: PromoCampaign[] = [
  {
    id: "pr_1",
    code: "FIRSTPARK50",
    name: "First-time consumer ₹50 off",
    discountPct: 100,
    maxOffAmount: 50,
    redemptions: 320,
    budget: 16_000,
    active: true,
    startsAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    endsAt: new Date(Date.now() + 20 * 86_400_000).toISOString(),
  },
  {
    id: "pr_2",
    code: "EVFIRST",
    name: "EV first charge free (kWh cap 8)",
    discountPct: 100,
    maxOffAmount: 200,
    redemptions: 84,
    budget: 16_800,
    active: false,
    startsAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
    endsAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
];

function loadTakes(): TakeRate[] {
  const e = readJson<TakeRate[] | null>(TAKE_KEY, null);
  if (e) return e;
  writeJson(TAKE_KEY, SEED_TAKES);
  return SEED_TAKES;
}
function saveTakes(list: TakeRate[]) {
  writeJson(TAKE_KEY, list);
}
function loadSubsidies(): Subsidy[] {
  const e = readJson<Subsidy[] | null>(SUB_KEY, null);
  if (e) return e;
  writeJson(SUB_KEY, SEED_SUBSIDIES);
  return SEED_SUBSIDIES;
}
function saveSubsidies(list: Subsidy[]) {
  writeJson(SUB_KEY, list);
}
function loadPromos(): PromoCampaign[] {
  const e = readJson<PromoCampaign[] | null>(PROMO_KEY, null);
  if (e) return e;
  writeJson(PROMO_KEY, SEED_PROMOS);
  return SEED_PROMOS;
}
function savePromos(list: PromoCampaign[]) {
  writeJson(PROMO_KEY, list);
}

export async function listTakeRates(): Promise<TakeRate[]> {
  return loadTakes();
}

export async function updateTakeRate(
  kind: TakeRate["kind"],
  patch: Partial<TakeRate>,
): Promise<TakeRate | null> {
  const list = loadTakes();
  const idx = list.findIndex((t) => t.kind === kind);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  saveTakes(list);
  return list[idx];
}

export async function listSubsidies(): Promise<Subsidy[]> {
  return loadSubsidies();
}
export async function toggleSubsidy(id: string): Promise<Subsidy | null> {
  const list = loadSubsidies();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], active: !list[idx].active };
  saveSubsidies(list);
  return list[idx];
}

export async function listPromos(): Promise<PromoCampaign[]> {
  return loadPromos();
}
export async function togglePromo(id: string): Promise<PromoCampaign | null> {
  const list = loadPromos();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], active: !list[idx].active };
  savePromos(list);
  return list[idx];
}
