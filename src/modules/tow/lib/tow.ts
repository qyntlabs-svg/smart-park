// Tow / SOS Operator — mock-first session + roster store.
//
// Mirrors the pattern used by `mechanic/lib/shops.ts` and `worker/lib/workers.ts`:
// self-contained localStorage-backed data + auth so we can ship the entire Tow
// operator surface without editing the shared `auth.store.ts` typings.
//
// A "tow operator" is one driver + one truck. Rosters + earnings live here.

import { makeId, readJson, writeJson, removeKey } from "@/shared/lib/storage";

// ---------- Types ----------

export type TowOperatorStatus = "off_duty" | "on_duty" | "on_break";

export type TruckType = "flatbed" | "wheel_lift" | "hook_chain" | "ev_safe";

export interface TowOperator {
  id: string;
  name: string;
  phone: string;
  truckPlate: string;
  truckType: TruckType;
  /** Capabilities used to filter which SOS requests they can accept. */
  capabilities: {
    flatbed: boolean;
    wheelLift: boolean;
    evSafe: boolean;
    heavyDuty: boolean;
    accidentRecovery: boolean;
  };
  city: string;
  status: TowOperatorStatus;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  registeredAt: string;
}

export interface TowAuth {
  operatorId: string;
}

export interface TowEarning {
  id: string;
  operatorId: string;
  sosRequestId: string;
  amount: number;
  serviceLabel: string;
  completedAt: string;
}

// ---------- Storage keys ----------

const AUTH_KEY = "towOperatorAuth";
const ROSTER_KEY = "towOperators";
const EARNINGS_KEY = "towEarnings";

// ---------- Seed ----------

const DEFAULT_SELF: TowOperator = {
  id: "tow-self",
  name: "Ramesh Kumar",
  phone: "+91 98765 90001",
  truckPlate: "TN 09 TB 1024",
  truckType: "flatbed",
  capabilities: {
    flatbed: true,
    wheelLift: true,
    evSafe: true,
    heavyDuty: false,
    accidentRecovery: true,
  },
  city: "Chennai",
  status: "off_duty",
  lat: 13.0678,
  lng: 80.2378,
  registeredAt: new Date().toISOString(),
};

function loadRoster(): TowOperator[] {
  const existing = readJson<TowOperator[] | null>(ROSTER_KEY, null);
  if (existing) return existing;
  writeJson(ROSTER_KEY, [DEFAULT_SELF]);
  return [DEFAULT_SELF];
}

function saveRoster(list: TowOperator[]) {
  writeJson(ROSTER_KEY, list);
}

// ---------- Auth ----------

export function getTowAuth(): TowAuth | null {
  return readJson<TowAuth | null>(AUTH_KEY, null);
}

export function setTowAuth(a: TowAuth | null) {
  if (!a) {
    removeKey(AUTH_KEY);
    return;
  }
  writeJson(AUTH_KEY, a);
}

// ---------- Operator CRUD ----------

export function listOperators(): TowOperator[] {
  return loadRoster();
}

export function getOperatorById(id: string): TowOperator | null {
  return loadRoster().find((o) => o.id === id) ?? null;
}

export function getCurrentOperator(): TowOperator | null {
  const auth = getTowAuth();
  if (!auth) return null;
  return getOperatorById(auth.operatorId);
}

export function upsertOperator(
  op: Omit<TowOperator, "id" | "registeredAt"> & {
    id?: string;
    registeredAt?: string;
  },
): TowOperator {
  const list = loadRoster();
  const idx = op.id ? list.findIndex((o) => o.id === op.id) : -1;
  if (idx >= 0) {
    const next: TowOperator = {
      ...list[idx],
      ...op,
      id: list[idx].id,
      registeredAt: list[idx].registeredAt,
    };
    list[idx] = next;
    saveRoster(list);
    return next;
  }
  const next: TowOperator = {
    ...op,
    id: op.id ?? makeId("tow"),
    registeredAt: op.registeredAt ?? new Date().toISOString(),
  };
  list.unshift(next);
  saveRoster(list);
  return next;
}

export function updateOperator(
  id: string,
  patch: Partial<TowOperator>,
): TowOperator | null {
  const list = loadRoster();
  const idx = list.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  const next: TowOperator = { ...list[idx], ...patch, id: list[idx].id };
  list[idx] = next;
  saveRoster(list);
  return next;
}

// ---------- Earnings ----------

export function listEarnings(operatorId: string): TowEarning[] {
  return readJson<TowEarning[]>(EARNINGS_KEY, []).filter(
    (e) => e.operatorId === operatorId,
  );
}

export function recordEarning(input: Omit<TowEarning, "id">): TowEarning {
  const all = readJson<TowEarning[]>(EARNINGS_KEY, []);
  const e: TowEarning = { ...input, id: makeId("earn") };
  all.unshift(e);
  writeJson(EARNINGS_KEY, all);
  return e;
}

/** Default flat rate for a completed SOS request when none is set explicitly. */
export function defaultTowFare(situation: string): number {
  switch (situation) {
    case "tow":
      return 1500;
    case "accident":
      return 2500;
    case "out_of_charge":
      return 900;
    case "breakdown":
      return 800;
    case "flat_tyre":
      return 500;
    default:
      return 750;
  }
}

// ---------- Labels ----------

export const TRUCK_TYPE_LABEL: Record<TruckType, string> = {
  flatbed: "Flatbed",
  wheel_lift: "Wheel lift",
  hook_chain: "Hook & chain",
  ev_safe: "EV-safe",
};

export const TOW_STATUS_LABEL: Record<TowOperatorStatus, string> = {
  off_duty: "Off duty",
  on_duty: "On duty",
  on_break: "On break",
};
