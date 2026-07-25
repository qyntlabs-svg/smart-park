// Shared SOS / roadside-assistance store.
//
// This is THE single source of truth for a rescue request. Consumer SOS
// screens (C-41 /sos, C-42 /sos/:id) and Tow Operator screens (T-02 dispatch,
// T-03 active job, T-04 proof) both talk to this store.
//
// The consumer module `src/modules/consumer/sos/store.ts` is now a thin
// adapter that delegates writes here and reshapes reads for the consumer UI.
//
// Mock-first: localStorage-backed today, swap for API tomorrow without
// touching any component.

import { makeId, readJson, writeJson } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";

// ---------- Types ----------

export type SosStatus =
  | "searching"
  | "assigned"
  | "en_route"
  | "arrived"
  | "completed"
  | "cancelled";

export type SosSituation =
  | "breakdown"
  | "flat_tyre"
  | "tow"
  | "accident"
  | "out_of_charge";

/**
 * A single timeline event, mirrored from the consumer surface so both faces
 * can render a status history without maintaining a parallel field list.
 */
export interface SosEvent {
  at: string;
  status: SosStatus;
  note?: string;
}

/**
 * Driver metadata surfaced by the consumer live-status view. Populated once
 * the shared `acceptSosRequest` matches an operator (or when the consumer
 * lifecycle-tick seeds a demo driver for the mock flow).
 */
export interface SosDriver {
  name: string;
  phone: string;
  rating: number;
  vehicle: string; // e.g. "Tow truck TN 66 XX 9821"
  location: { lat: number; lng: number };
}

export interface SosCostBreakdown {
  base: number;
  distanceKm?: number;
  distanceCharge?: number;
  waiver?: number;
  total: number;
}

export interface SosRequest {
  id: string;
  userId: string;
  userPhone: string;
  situation: SosSituation;
  /** Canonical location shape. `address` is what the tow operator sees. */
  location: { lat: number; lng: number; address: string };
  vehicleId?: string;
  vehicleLabel?: string;
  createdAt: string;
  /** Bumped on every write; used by the consumer surface. */
  updatedAt?: string;
  status: SosStatus;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  assignedTruckPlate?: string;
  etaMinutes?: number;
  operatorLocation?: { lat: number; lng: number };
  proof?: {
    photos: string[];
    signature?: string;
    mileage?: number;
    notes?: string;
  };
  cost?: number;
  /** free-form situation notes captured at request time or on operator update */
  notes?: string;

  // ---- Consumer surface extensions ----
  /** Estimated ₹ quoted at request time. Locked once operator assigned. */
  estimatedCost?: number;
  estimatedEtaMinutes?: number;
  /** Structured timeline the consumer live view renders. */
  events?: SosEvent[];
  /** Detailed cost breakdown the consumer receipt renders. */
  costBreakdown?: SosCostBreakdown;
  /** Assigned driver, seeded once the request is `assigned`. */
  driver?: SosDriver;
}

// ---------- Labels ----------

export const SOS_SITUATION_LABEL: Record<SosSituation, string> = {
  breakdown: "Engine breakdown",
  flat_tyre: "Flat tyre",
  tow: "Need a tow",
  accident: "Accident",
  out_of_charge: "Out of charge (EV)",
};

export const SOS_SITUATION_EMOJI: Record<SosSituation, string> = {
  breakdown: "🛠️",
  flat_tyre: "🛞",
  tow: "🚛",
  accident: "🚨",
  out_of_charge: "🔌",
};

export const SOS_STATUS_LABEL: Record<SosStatus, string> = {
  searching: "Finding help",
  assigned: "Operator assigned",
  en_route: "En route to you",
  arrived: "Arrived on scene",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ---------- Storage ----------

const SOS_KEY = "sosRequests";
const MAX_KEEP = 200;

// ---------- Seed ----------

// Three demo SOS requests scattered across Chennai (T Nagar / Velachery / OMR)
// so the Tow Dispatch queue (T-02) always has something to accept during demo.
const SEED_REQUESTS: SosRequest[] = [
  {
    id: "sos-seed-1",
    userId: "consumer-demo-1",
    userPhone: "+91 98400 11111",
    situation: "flat_tyre",
    location: {
      lat: 13.041,
      lng: 80.233,
      address: "Ranganathan St, T Nagar, Chennai",
    },
    vehicleId: "veh-1",
    vehicleLabel: "Honda City · TN 09 AB 1234",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    status: "searching",
    notes: "Rear-right tyre punctured near pavement.",
    estimatedCost: 399,
    estimatedEtaMinutes: 18,
    events: [
      {
        at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        status: "searching",
        note: "Looking for nearest available operator…",
      },
    ],
  },
  {
    id: "sos-seed-2",
    userId: "consumer-demo-2",
    userPhone: "+91 98400 22222",
    situation: "out_of_charge",
    location: {
      lat: 12.985,
      lng: 80.221,
      address: "Velachery Main Rd, Chennai",
    },
    vehicleId: "veh-2",
    vehicleLabel: "Tata Nexon EV · TN 22 XY 4599",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: "searching",
    notes: "Battery at 0%, stranded near Phoenix mall roundabout.",
    estimatedCost: 799,
    estimatedEtaMinutes: 25,
    events: [
      {
        at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        status: "searching",
        note: "Looking for nearest available operator…",
      },
    ],
  },
  {
    id: "sos-seed-3",
    userId: "consumer-demo-3",
    userPhone: "+91 98400 33333",
    situation: "tow",
    location: {
      lat: 12.905,
      lng: 80.229,
      address: "OMR, Sholinganallur signal, Chennai",
    },
    vehicleId: "veh-3",
    vehicleLabel: "Maruti Swift · TN 07 CD 8765",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    status: "searching",
    notes: "Engine won't start. Need flatbed to nearest workshop.",
    estimatedCost: 1499,
    estimatedEtaMinutes: 30,
    events: [
      {
        at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        status: "searching",
        note: "Looking for nearest available operator…",
      },
    ],
  },
];

function loadAll(): SosRequest[] {
  const existing = readJson<SosRequest[] | null>(SOS_KEY, null);
  if (existing) return existing;
  writeJson(SOS_KEY, SEED_REQUESTS);
  return SEED_REQUESTS;
}

function saveAll(list: SosRequest[]) {
  writeJson(SOS_KEY, list.slice(0, MAX_KEEP));
}

// ---------- API ----------

export interface CreateSosInput {
  userId: string;
  userPhone: string;
  situation: SosSituation;
  location: { lat: number; lng: number; address: string };
  vehicleId?: string;
  vehicleLabel?: string;
  notes?: string;
  /** Optional extended fields — consumer surface uses these. */
  estimatedCost?: number;
  estimatedEtaMinutes?: number;
  events?: SosEvent[];
}

export async function createSosRequest(
  input: CreateSosInput,
): Promise<SosRequest> {
  const now = new Date().toISOString();
  const req: SosRequest = {
    id: makeId("sos"),
    userId: input.userId,
    userPhone: input.userPhone,
    situation: input.situation,
    location: input.location,
    vehicleId: input.vehicleId,
    vehicleLabel: input.vehicleLabel,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    status: "searching",
    estimatedCost: input.estimatedCost,
    estimatedEtaMinutes: input.estimatedEtaMinutes,
    events: input.events ?? [
      {
        at: now,
        status: "searching",
        note: "Looking for nearest available operator…",
      },
    ],
  };
  const all = loadAll();
  all.unshift(req);
  saveAll(all);
  return req;
}

export interface SosListFilter {
  status?: SosStatus | SosStatus[];
  operatorId?: string;
  userId?: string;
  userPhone?: string;
  /** Only requests whose location is within this radius (km) of `origin`. */
  nearOrigin?: { lat: number; lng: number; radiusKm: number };
  /** Include requests newer than `sinceMs` epoch. */
  sinceMs?: number;
}

export async function listSosRequests(
  filter: SosListFilter = {},
): Promise<SosRequest[]> {
  let all = loadAll();
  if (filter.status) {
    const wanted = Array.isArray(filter.status)
      ? filter.status
      : [filter.status];
    all = all.filter((r) => wanted.includes(r.status));
  }
  if (filter.operatorId) {
    all = all.filter((r) => r.assignedOperatorId === filter.operatorId);
  }
  if (filter.userPhone) {
    all = all.filter((r) => r.userPhone === filter.userPhone);
  }
  if (filter.userId) {
    all = all.filter((r) => r.userId === filter.userId);
  }
  if (filter.sinceMs) {
    all = all.filter(
      (r) => new Date(r.createdAt).getTime() >= filter.sinceMs!,
    );
  }
  if (filter.nearOrigin) {
    const { lat, lng, radiusKm } = filter.nearOrigin;
    all = all.filter(
      (r) => haversineKm({ lat, lng }, r.location) <= radiusKm,
    );
  }
  return all;
}

export async function getSosRequest(id: string): Promise<SosRequest | null> {
  return loadAll().find((r) => r.id === id) ?? null;
}

export async function updateSosRequest(
  id: string,
  patch: Partial<SosRequest>,
  options: { appendEvent?: SosEvent } = {},
): Promise<SosRequest | null> {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const prev = all[idx];
  const events = options.appendEvent
    ? [...(prev.events ?? []), options.appendEvent]
    : (patch.events ?? prev.events);
  const next: SosRequest = {
    ...prev,
    ...patch,
    events,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = next;
  saveAll(all);

  // Cross-notify on interesting transitions.
  if (patch.status && patch.status !== prev.status) {
    pushNotification({
      audience: "consumer",
      audienceId: next.userPhone,
      title: `SOS · ${SOS_STATUS_LABEL[next.status]}`,
      body: next.assignedOperatorName
        ? `${next.assignedOperatorName} · ${SOS_SITUATION_LABEL[next.situation]}`
        : SOS_SITUATION_LABEL[next.situation],
    });
  }
  return next;
}

export async function acceptSosRequest(
  id: string,
  operator: { id: string; name: string; plate: string },
): Promise<SosRequest | null> {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  if (all[idx].status !== "searching") return null; // already taken
  const now = new Date().toISOString();
  const prev = all[idx];
  const next: SosRequest = {
    ...prev,
    status: "assigned",
    assignedOperatorId: operator.id,
    assignedOperatorName: operator.name,
    assignedTruckPlate: operator.plate,
    etaMinutes: 12,
    updatedAt: now,
    // Seed driver metadata so the consumer surface renders immediately.
    driver: prev.driver ?? {
      name: operator.name,
      phone: "+91 98765 90210",
      rating: 4.8,
      vehicle: `Tow truck ${operator.plate}`,
      location: {
        lat: prev.location.lat + 0.01,
        lng: prev.location.lng + 0.01,
      },
    },
    events: [
      ...(prev.events ?? []),
      { at: now, status: "assigned", note: `Assigned to ${operator.name}` },
    ],
  };
  all[idx] = next;
  saveAll(all);
  pushNotification({
    audience: "consumer",
    audienceId: next.userPhone,
    title: "Rescue truck on the way",
    body: `${operator.name} (${operator.plate}) · ETA ${next.etaMinutes} min`,
  });
  return next;
}

export async function cancelSosRequest(
  id: string,
  by: "consumer" | "operator",
  reason?: string,
): Promise<SosRequest | null> {
  const note = reason
    ? `Cancelled by ${by}: ${reason}`
    : `Cancelled by ${by}`;
  return updateSosRequest(
    id,
    { status: "cancelled", notes: note },
    {
      appendEvent: {
        at: new Date().toISOString(),
        status: "cancelled",
        note,
      },
    },
  );
}

/** Local haversine to avoid a hard dep on shared/lib/geo for a mock file. */
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
