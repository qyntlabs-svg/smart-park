// A-04 Provider Directory — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";
import type { ProviderRow, ProviderState, ProviderTab } from "./types";

const KEY = "adminProviders";
const dayMs = 86_400_000;

const SEED: ProviderRow[] = [
  { id: "p_1", name: "Anand Motors — T Nagar", tab: "parking", city: "Chennai", contact: "+91 98765 30001", listings: 3, rating: 4.6, gmv30d: 148230, state: "active", onboardedAt: new Date(Date.now() - dayMs * 30).toISOString() },
  { id: "p_2", name: "Adyar Bay Rental", tab: "parking", city: "Chennai", contact: "+91 98765 30003", listings: 2, rating: 4.2, gmv30d: 42120, state: "active", onboardedAt: new Date(Date.now() - dayMs * 60).toISOString() },
  { id: "p_3", name: "Panagal Multi-lot", tab: "parking", city: "Chennai", contact: "+91 98765 30011", listings: 1, rating: 3.9, gmv30d: 21990, state: "paused", onboardedAt: new Date(Date.now() - dayMs * 90).toISOString() },
  { id: "p_4", name: "GreenCharge Hub — OMR", tab: "ev", city: "Chennai", contact: "+91 98765 30002", listings: 4, rating: 4.7, gmv30d: 328400, state: "active", onboardedAt: new Date(Date.now() - dayMs * 45).toISOString() },
  { id: "p_5", name: "Volt Beacon Chargers", tab: "ev", city: "Bengaluru", contact: "+91 98765 30021", listings: 6, rating: 4.4, gmv30d: 512000, state: "active", onboardedAt: new Date(Date.now() - dayMs * 120).toISOString() },
  { id: "p_6", name: "AutoMech Deepa", tab: "mechanic", city: "Chennai", contact: "+91 98765 30004", listings: 1, rating: 4.8, gmv30d: 89900, state: "active", onboardedAt: new Date(Date.now() - dayMs * 100).toISOString() },
  { id: "p_7", name: "Nungambakkam Auto Care", tab: "mechanic", city: "Chennai", contact: "+91 98765 30031", listings: 1, rating: 4.3, gmv30d: 65200, state: "active", onboardedAt: new Date(Date.now() - dayMs * 200).toISOString() },
  { id: "p_8", name: "TowExpress Chennai", tab: "tow", city: "Chennai", contact: "+91 98765 30005", listings: 4, rating: 4.5, gmv30d: 122500, state: "active", onboardedAt: new Date(Date.now() - dayMs * 40).toISOString() },
  { id: "p_9", name: "RapidTow OMR", tab: "tow", city: "Chennai", contact: "+91 98765 30041", listings: 2, rating: 4.1, gmv30d: 88900, state: "suspended", onboardedAt: new Date(Date.now() - dayMs * 200).toISOString() },
];

function load(): ProviderRow[] {
  const existing = readJson<ProviderRow[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: ProviderRow[]) {
  writeJson(KEY, list);
}

export async function listProviders(
  tab: ProviderTab,
  query?: string,
): Promise<ProviderRow[]> {
  return load()
    .filter((p) => p.tab === tab)
    .filter((p) =>
      query
        ? [p.name, p.city, p.contact]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true,
    )
    .sort((a, b) => b.gmv30d - a.gmv30d);
}

export async function setProviderState(
  id: string,
  state: ProviderState,
  note?: string,
): Promise<ProviderRow | null> {
  const list = load();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], state };
  save(list);
  pushNotification({
    audience: "vendor",
    audienceId: id,
    title:
      state === "suspended"
        ? "Account suspended"
        : state === "paused"
          ? "Account paused"
          : "Account reactivated",
    body: note ?? `Your account is now ${state}.`,
  });
  return list[idx];
}
