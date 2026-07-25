// A-10 Feature Flags — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import type { FeatureFlag } from "./types";

const KEY = "adminFeatureFlags";

const SEED: FeatureFlag[] = [
  {
    key: "ev_wedge_v2",
    name: "EV wedge UI v2",
    description: "New charger selection sheet + live SOC display",
    kind: "rollout",
    enabled: true,
    rolloutPct: 30,
    updatedAt: new Date().toISOString(),
    updatedBy: "ops-01",
  },
  {
    key: "rental_launch",
    name: "Parking rentals launch",
    description: "Enable long-stay rental listing tab for consumers",
    kind: "city_list",
    enabled: true,
    cities: ["Chennai"],
    updatedAt: new Date().toISOString(),
  },
  {
    key: "ai_concierge",
    name: "AI Concierge chat",
    description: "Free-form LLM chat inside consumer app",
    kind: "boolean",
    enabled: false,
    updatedAt: new Date().toISOString(),
  },
  {
    key: "sos_dispatch",
    name: "Tow / SOS dispatch",
    description: "Big red button on consumer home",
    kind: "city_list",
    enabled: false,
    cities: [],
    updatedAt: new Date().toISOString(),
  },
  {
    key: "surge_pricing",
    name: "Surge multipliers",
    description: "Allow vendors to configure surge windows",
    kind: "rollout",
    enabled: true,
    rolloutPct: 100,
    updatedAt: new Date().toISOString(),
  },
];

function load(): FeatureFlag[] {
  const existing = readJson<FeatureFlag[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: FeatureFlag[]) {
  writeJson(KEY, list);
}

export async function listFlags(): Promise<FeatureFlag[]> {
  return load();
}

export async function updateFlag(
  key: string,
  patch: Partial<FeatureFlag>,
  updatedBy: string,
): Promise<FeatureFlag | null> {
  const list = load();
  const idx = list.findIndex((f) => f.key === key);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  save(list);
  return list[idx];
}
