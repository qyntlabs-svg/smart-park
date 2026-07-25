// Growth — localStorage-backed mock store for winback campaigns.
//
// Follows the pattern in `src/modules/ev/store.ts` — API-shaped so it can be
// swapped for a real backend without any UI edits.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";

export type WinbackChannel = "push" | "email" | "sms";
export type WinbackStatus = "draft" | "scheduled" | "sent";

export interface WinbackCampaign {
  id: string;
  name: string;
  audience: string; // e.g. "Inactive 30-60d"
  channel: WinbackChannel;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  incentivePct: number; // 0..100 (discount)
  status: WinbackStatus;
  scheduledFor?: string; // ISO
  createdAt: string;
  updatedAt: string;
  estReachedUsers: number;
  estConversionPct: number;
}

const KEY = "growthWinbackCampaigns";

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const SEED: WinbackCampaign[] = [
  {
    id: "wb-seed-1",
    name: "Miss you · 30-day churn",
    audience: "Inactive 30-60d · charged ≥1× before",
    channel: "push",
    headline: "We miss you",
    body:
      "Come back this week and get your first fast charge free (up to 25 kWh). See you at the plug.",
    ctaLabel: "Claim free charge",
    ctaHref: "/ev",
    incentivePct: 100,
    status: "sent",
    scheduledFor: daysAgo(4),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    estReachedUsers: 2410,
    estConversionPct: 12.4,
  },
  {
    id: "wb-seed-2",
    name: "OMR corridor · 15% off",
    audience: "OMR / Sholinganallur repeat commuters, silent 21d",
    channel: "email",
    headline: "OMR run cheaper today",
    body:
      "15% off the next 3 DC sessions at any OMR fast-charge station. Ends Sunday.",
    ctaLabel: "See offer",
    ctaHref: "/ev?zone=omr",
    incentivePct: 15,
    status: "scheduled",
    scheduledFor: daysAgo(-2),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
    estReachedUsers: 812,
    estConversionPct: 8.1,
  },
];

function loadAll(): WinbackCampaign[] {
  const existing = readJson<WinbackCampaign[] | null>(KEY, null);
  if (existing && existing.length > 0) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function saveAll(list: WinbackCampaign[]) {
  writeJson(KEY, list);
}

export async function listWinbackCampaigns(): Promise<WinbackCampaign[]> {
  return loadAll().slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function createWinbackCampaign(
  input: Omit<WinbackCampaign, "id" | "createdAt" | "updatedAt">,
): Promise<WinbackCampaign> {
  const list = loadAll();
  const c: WinbackCampaign = {
    ...input,
    id: makeId("wb"),
    createdAt: now(),
    updatedAt: now(),
  };
  list.unshift(c);
  saveAll(list);
  return c;
}

export async function updateWinbackCampaign(
  id: string,
  patch: Partial<WinbackCampaign>,
): Promise<WinbackCampaign | null> {
  const list = loadAll();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, updatedAt: now() };
  saveAll(list);
  return list[idx];
}

export async function deleteWinbackCampaign(id: string): Promise<boolean> {
  const list = loadAll();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  saveAll(next);
  return true;
}
