// V-20 Pricing Rules — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type { PricingConfig, TimeOfDayRule } from "./types";

const KEY = "partnerPricingConfigs";

const SEED = (partnerId: string): PricingConfig[] => [
  {
    partnerId,
    listingId: "parking-main",
    listingName: "T Nagar — Main lot",
    kind: "parking",
    basePrice: 40,
    baseUnit: "hour",
    surgeEnabled: true,
    surgeMaxMultiplier: 1.5,
    subsidyEnabled: false,
    subsidyLabel: "EV subsidy",
    subsidyDiscountPct: 10,
    timeOfDay: [
      {
        id: "rule_weekday_peak",
        label: "Weekday peak",
        startHour: 8,
        endHour: 11,
        multiplier: 1.4,
        daysOfWeek: [1, 2, 3, 4, 5],
        enabled: true,
      },
      {
        id: "rule_night",
        label: "Night discount",
        startHour: 22,
        endHour: 6,
        multiplier: 0.7,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    partnerId,
    listingId: "ev-omr",
    listingName: "EV FastCharge — OMR",
    kind: "ev",
    basePrice: 22,
    baseUnit: "kwh",
    surgeEnabled: true,
    surgeMaxMultiplier: 1.35,
    subsidyEnabled: true,
    subsidyLabel: "Weekday morning subsidy",
    subsidyDiscountPct: 15,
    timeOfDay: [
      {
        id: "rule_evening",
        label: "Evening surge",
        startHour: 17,
        endHour: 22,
        multiplier: 1.3,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    partnerId,
    listingId: "rental-velachery",
    listingName: "Rental — Velachery",
    kind: "rental",
    basePrice: 250,
    baseUnit: "day",
    surgeEnabled: false,
    surgeMaxMultiplier: 1.0,
    subsidyEnabled: false,
    subsidyLabel: "Weekly discount",
    subsidyDiscountPct: 12,
    timeOfDay: [],
    updatedAt: new Date().toISOString(),
  },
];

function load(partnerId: string): PricingConfig[] {
  const key = `${KEY}:${partnerId}`;
  const existing = readJson<PricingConfig[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED(partnerId);
  writeJson(key, seed);
  return seed;
}

function save(partnerId: string, list: PricingConfig[]) {
  writeJson(`${KEY}:${partnerId}`, list);
}

export async function listPricingConfigs(
  partnerId: string,
): Promise<PricingConfig[]> {
  return load(partnerId);
}

export async function updatePricingConfig(
  partnerId: string,
  listingId: string,
  patch: Partial<PricingConfig>,
): Promise<PricingConfig | null> {
  const list = load(partnerId);
  const idx = list.findIndex((c) => c.listingId === listingId);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  save(partnerId, list);
  return list[idx];
}

export async function upsertTimeRule(input: {
  partnerId: string;
  listingId: string;
  rule: Omit<TimeOfDayRule, "id"> & { id?: string };
}): Promise<PricingConfig | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((c) => c.listingId === input.listingId);
  if (idx === -1) return null;
  const cfg = list[idx];
  const rules = [...cfg.timeOfDay];
  if (input.rule.id) {
    const rIdx = rules.findIndex((r) => r.id === input.rule.id);
    if (rIdx !== -1) rules[rIdx] = input.rule as TimeOfDayRule;
  } else {
    rules.push({ ...input.rule, id: makeId("rule") } as TimeOfDayRule);
  }
  list[idx] = { ...cfg, timeOfDay: rules, updatedAt: new Date().toISOString() };
  save(input.partnerId, list);
  return list[idx];
}

export async function deleteTimeRule(input: {
  partnerId: string;
  listingId: string;
  ruleId: string;
}): Promise<PricingConfig | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((c) => c.listingId === input.listingId);
  if (idx === -1) return null;
  const cfg = list[idx];
  list[idx] = {
    ...cfg,
    timeOfDay: cfg.timeOfDay.filter((r) => r.id !== input.ruleId),
    updatedAt: new Date().toISOString(),
  };
  save(input.partnerId, list);
  return list[idx];
}
