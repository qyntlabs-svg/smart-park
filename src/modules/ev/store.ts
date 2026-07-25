// EV Charging — localStorage-backed mock store.
//
// This file intentionally has an API-shaped surface (list / get / create /
// update / remove) so it can be swapped for real fetch calls later without
// touching any UI component. Real backend replacement path:
//
//   1. Keep this signature.
//   2. Replace the readJson/writeJson calls with axios calls to /ev/*.
//   3. Delete the SEED_* seed data.
//
// Every function here is synchronous but returns a Promise so hooks look
// identical to the real-network equivalents.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import { haversineKm } from "@/shared/lib/geo";
import { pushNotification } from "@/shared/lib/notifications";
import type {
  ChargerStatus,
  EvReservation,
  EvReservationTarget,
  EvReview,
  EvSearchFilters,
  EvSession,
  EvStation,
  EvVehicleProfile,
} from "./types";

const STATIONS_KEY = "evStations";
const RESERVATIONS_KEY = "evReservations";
const SESSIONS_KEY = "evSessions";
const REVIEWS_KEY = "evReviews";
const VEHICLE_PROFILES_KEY = "evVehicleProfiles";

// ---------- Seed data (only written on first read) ----------
//
// Chennai wedge cities (T Nagar, Velachery, OMR) — one station per pin so the
// map shows realistic coverage for the Phase 0 demo.

const SEED_STATIONS: EvStation[] = [
  {
    id: "ev-seed-tnagar",
    partnerId: "partner-demo",
    name: "Auto Doc Volt Hub — T Nagar",
    address: "Panagal Park, T Nagar, Chennai 600017",
    lat: 13.0426,
    lng: 80.2331,
    connectors: [
      {
        id: "c-tnagar-ccs",
        type: "ccs",
        powerKw: 60,
        count: 2,
        available: 2,
        status: ["available", "available"],
      },
      {
        id: "c-tnagar-type2",
        type: "type2",
        powerKw: 22,
        count: 3,
        available: 2,
        status: ["available", "available", "in_use"],
      },
    ],
    pricing: { unit: "per_kwh", amount: 18, idleFeePerMinute: 2, taxPct: 18 },
    amenities: ["cafe", "wifi", "shade", "cctv", "atm"],
    photos: [],
    status: "active",
    isOpen24x7: false,
    openTime: "06:00",
    closeTime: "23:00",
    supportPhone: "+91 98765 40002",
    rating: 4.6,
    reviewCount: 42,
    createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "ev-seed-velachery",
    partnerId: "partner-demo",
    name: "Auto Doc EcoCharge — Velachery",
    address: "Vijaya Nagar, Velachery, Chennai 600042",
    lat: 12.9791,
    lng: 80.2216,
    connectors: [
      {
        id: "c-vel-type2",
        type: "type2",
        powerKw: 7.4,
        count: 4,
        available: 4,
        status: ["available", "available", "available", "available"],
      },
      {
        id: "c-vel-bharat",
        type: "bharat_ac_001",
        powerKw: 3.3,
        count: 2,
        available: 1,
        status: ["available", "in_use"],
      },
    ],
    pricing: { unit: "per_kwh", amount: 15, idleFeePerMinute: 1, taxPct: 18 },
    amenities: ["restroom", "shade", "24x7", "cctv"],
    photos: [],
    status: "active",
    isOpen24x7: true,
    supportPhone: "+91 98765 40003",
    rating: 4.3,
    reviewCount: 27,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "ev-seed-omr",
    partnerId: "partner-demo",
    name: "Auto Doc FastCharge — OMR (Sholinganallur)",
    address: "Old Mahabalipuram Road, Sholinganallur, Chennai 600119",
    lat: 12.9007,
    lng: 80.2278,
    connectors: [
      {
        id: "c-omr-ccs",
        type: "ccs",
        powerKw: 150,
        count: 2,
        available: 1,
        status: ["available", "in_use"],
      },
      {
        id: "c-omr-chademo",
        type: "chademo",
        powerKw: 50,
        count: 1,
        available: 1,
        status: ["available"],
      },
      {
        id: "c-omr-type2",
        type: "type2",
        powerKw: 22,
        count: 4,
        available: 3,
        status: ["available", "available", "available", "in_use"],
      },
    ],
    pricing: { unit: "per_kwh", amount: 22, idleFeePerMinute: 3, taxPct: 18 },
    amenities: ["restroom", "cafe", "wifi", "24x7", "cctv"],
    photos: [],
    status: "active",
    isOpen24x7: true,
    supportPhone: "+91 98765 40001",
    rating: 4.7,
    reviewCount: 61,
    createdAt: new Date(Date.now() - 86400000 * 55).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ---------- Low-level load/save ----------

function loadAll(): EvStation[] {
  const existing = readJson<EvStation[] | null>(STATIONS_KEY, null);
  if (existing) return migrateStations(existing);
  writeJson(STATIONS_KEY, SEED_STATIONS);
  return SEED_STATIONS;
}

/** Backfill `status[]` on connectors saved from the pre-Phase-0 schema. */
function migrateStations(list: EvStation[]): EvStation[] {
  let mutated = false;
  const migrated = list.map((s) => {
    const connectors = s.connectors.map((c) => {
      if (c.status && c.status.length === c.count) return c;
      mutated = true;
      const arr: ChargerStatus[] = [];
      for (let i = 0; i < c.count; i++) {
        arr.push(i < c.available ? "available" : "in_use");
      }
      return { ...c, status: arr };
    });
    return { ...s, connectors };
  });
  if (mutated) writeJson(STATIONS_KEY, migrated);
  return migrated;
}

function saveAll(list: EvStation[]) {
  writeJson(STATIONS_KEY, list);
}

function loadReservations(): EvReservation[] {
  return readJson<EvReservation[]>(RESERVATIONS_KEY, []);
}

function saveReservations(list: EvReservation[]) {
  writeJson(RESERVATIONS_KEY, list);
}

function loadSessions(): EvSession[] {
  return readJson<EvSession[]>(SESSIONS_KEY, []);
}

function saveSessions(list: EvSession[]) {
  writeJson(SESSIONS_KEY, list);
}

function loadReviews(): EvReview[] {
  return readJson<EvReview[]>(REVIEWS_KEY, []);
}

function saveReviews(list: EvReview[]) {
  writeJson(REVIEWS_KEY, list);
}

function loadVehicleProfiles(): EvVehicleProfile[] {
  return readJson<EvVehicleProfile[]>(VEHICLE_PROFILES_KEY, []);
}

function saveVehicleProfiles(list: EvVehicleProfile[]) {
  writeJson(VEHICLE_PROFILES_KEY, list);
}

// ---------- Station filtering ----------

function passesFilters(s: EvStation, f: EvSearchFilters): boolean {
  if (f.onlyOpen && s.status !== "active") return false;
  if (f.connectorType && !s.connectors.some((c) => c.type === f.connectorType))
    return false;
  if (
    typeof f.minPowerKw === "number" &&
    !s.connectors.some((c) => c.powerKw >= f.minPowerKw!)
  )
    return false;
  if (typeof f.maxPriceAmount === "number" && s.pricing.amount > f.maxPriceAmount)
    return false;
  if (f.amenities?.length) {
    if (!f.amenities.every((a) => s.amenities.includes(a))) return false;
  }
  return true;
}

// ---------- Stations: public API ----------

export async function listStations(
  filters: EvSearchFilters = {},
  origin?: { lat: number; lng: number },
): Promise<Array<EvStation & { distanceKm?: number }>> {
  const all = loadAll().filter((s) => passesFilters(s, filters));
  const withDistance: Array<EvStation & { distanceKm?: number }> = origin
    ? all.map((s) => ({
        ...s,
        distanceKm: haversineKm(origin, { lat: s.lat, lng: s.lng }),
      }))
    : all;
  return withDistance.sort(
    (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
  );
}

export async function listStationsByPartner(
  partnerId: string,
): Promise<EvStation[]> {
  return loadAll().filter((s) => s.partnerId === partnerId);
}

export async function getStation(id: string): Promise<EvStation | null> {
  return loadAll().find((s) => s.id === id) ?? null;
}

export async function createStation(
  input: Omit<
    EvStation,
    "id" | "createdAt" | "updatedAt" | "rating" | "reviewCount"
  >,
): Promise<EvStation> {
  const now = new Date().toISOString();
  // Backfill per-gun status arrays for new stations.
  const connectors = input.connectors.map((c) => {
    if (c.status && c.status.length === c.count) return c;
    const arr: ChargerStatus[] = [];
    for (let i = 0; i < c.count; i++) {
      arr.push(i < c.available ? "available" : "in_use");
    }
    return { ...c, status: arr };
  });
  const station: EvStation = {
    ...input,
    connectors,
    id: makeId("ev"),
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const list = loadAll();
  list.unshift(station);
  saveAll(list);

  pushNotification({
    audience: "owner",
    audienceId: input.partnerId,
    title: "EV station published",
    body: `${station.name} is now visible to consumers.`,
  });

  return station;
}

export async function updateStation(
  id: string,
  patch: Partial<EvStation>,
): Promise<EvStation | null> {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: EvStation = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  saveAll(list);
  return updated;
}

export async function deleteStation(id: string): Promise<boolean> {
  const list = loadAll();
  const next = list.filter((s) => s.id !== id);
  if (next.length === list.length) return false;
  saveAll(next);
  return true;
}

export async function toggleStationStatus(
  id: string,
): Promise<EvStation | null> {
  const st = await getStation(id);
  if (!st) return null;
  return updateStation(id, {
    status: st.status === "active" ? "paused" : "active",
  });
}

// ---------- Per-charger status ----------

function recomputeAvailable(statuses: ChargerStatus[]): number {
  return statuses.filter((s) => s === "available").length;
}

/** Set one physical gun's status (index into `connector.status[]`). */
export async function setChargerStatus(
  stationId: string,
  connectorId: string,
  gunIndex: number,
  status: ChargerStatus,
): Promise<EvStation | null> {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === stationId);
  if (idx === -1) return null;
  const station = list[idx];
  const nextConnectors = station.connectors.map((c) => {
    if (c.id !== connectorId) return c;
    const statuses = [...(c.status ?? [])];
    while (statuses.length < c.count) statuses.push("available");
    statuses[gunIndex] = status;
    return {
      ...c,
      status: statuses,
      available: recomputeAvailable(statuses),
    };
  });
  const updated: EvStation = {
    ...station,
    connectors: nextConnectors,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  saveAll(list);

  // Cascade: if this gun goes offline while a confirmed reservation targets it,
  // mark that reservation as at_risk and notify the consumer.
  if (status === "offline" || status === "maintenance") {
    const affected = loadReservations().filter(
      (r) =>
        r.stationId === stationId &&
        r.chargerId === connectorId &&
        (r.status === "confirmed" || r.status === "requested"),
    );
    if (affected.length) {
      await Promise.all(
        affected.map((r) =>
          markAtRisk(r.id, "charger_offline", "Vendor took charger offline"),
        ),
      );
    }
  }
  return updated;
}

// ---------- Reservations ----------

function generatePlugInCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return n.toString();
}

function estimateSessionKwh(
  target: EvReservationTarget,
  batteryKwh: number,
  currentSocPct: number,
  ratedKw: number,
): number {
  switch (target.kind) {
    case "soc":
      return Math.max(
        0,
        ((target.targetSocPct - currentSocPct) / 100) * batteryKwh,
      );
    case "duration":
      return (ratedKw * target.minutes) / 60;
    case "full":
      return Math.max(0, ((100 - currentSocPct) / 100) * batteryKwh);
  }
}

function estimateSessionCost(
  kwh: number,
  pricePerKwh: number,
  taxPct: number,
): number {
  const energy = kwh * pricePerKwh;
  const withTax = energy * (1 + taxPct / 100);
  return Math.round(withTax);
}

export async function createReservation(input: {
  stationId: string;
  chargerId: string;
  vehicleId: string;
  userId: string;
  requestedStart: string;
  target: EvReservationTarget;
  batteryKwh: number;
  currentSocPct: number;
}): Promise<EvReservation> {
  const station = await getStation(input.stationId);
  if (!station) throw new Error("Station not found");
  const connector = station.connectors.find((c) => c.id === input.chargerId);
  if (!connector) throw new Error("Charger not found");

  const pricePerKwh =
    station.pricing.unit === "per_kwh"
      ? station.pricing.amount
      : station.pricing.amount / connector.powerKw;
  const taxPct = station.pricing.taxPct ?? 18;

  const targetKwh = estimateSessionKwh(
    input.target,
    input.batteryKwh,
    input.currentSocPct,
    connector.powerKw,
  );
  const estimatedMinutes = Math.max(15, (targetKwh / connector.powerKw) * 60);
  const start = new Date(input.requestedStart);
  const end = new Date(start.getTime() + estimatedMinutes * 60_000);

  const reservation: EvReservation = {
    id: makeId("evres"),
    stationId: input.stationId,
    chargerId: input.chargerId,
    connectorType: connector.type,
    powerKw: connector.powerKw,
    vehicleId: input.vehicleId,
    userId: input.userId,
    requestedStart: start.toISOString(),
    requestedEnd: end.toISOString(),
    target: input.target,
    targetKwh,
    estimatedCost: estimateSessionCost(targetKwh, pricePerKwh, taxPct),
    status: "requested",
    plugInCode: generatePlugInCode(),
    holdMinutes: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = loadReservations();
  list.unshift(reservation);
  saveReservations(list);

  return reservation;
}

export async function confirmReservation(
  id: string,
  paymentId?: string,
): Promise<{ reservation: EvReservation; session: EvSession } | null> {
  const list = loadReservations();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const reservation: EvReservation = {
    ...list[idx],
    status: "confirmed",
    paymentId,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = reservation;
  saveReservations(list);

  const station = await getStation(reservation.stationId);
  const session = await createScheduledSession(reservation);

  // Notify consumer + vendor.
  pushNotification({
    audience: "consumer",
    audienceId: reservation.userId,
    title: "Charger reserved",
    body: `Your charger at ${station?.name ?? "the station"} is held. Plug-in code: ${reservation.plugInCode}`,
  });
  pushNotification({
    audience: "vendor",
    audienceId: station?.partnerId ?? "partner-demo",
    title: "New EV reservation",
    body: `A consumer reserved ${reservation.connectorType.toUpperCase()} · ${reservation.powerKw}kW at ${station?.name ?? "your station"}.`,
  });
  // Legacy mirror to "owner" so existing partner UIs still see the event.
  pushNotification({
    audience: "owner",
    audienceId: station?.partnerId ?? "partner-demo",
    title: "New EV reservation",
    body: `A consumer reserved ${reservation.connectorType.toUpperCase()} · ${reservation.powerKw}kW at ${station?.name ?? "your station"}.`,
  });

  // Schedule no-show auto-release for 30 min after requestedStart. This
  // setTimeout does NOT survive a page reload — the AppBootstrap sweep below
  // catches any confirmed reservations past their grace period.
  scheduleNoShowCheck(reservation);

  return { reservation, session };
}

/**
 * Schedule a client-side no-show release 30 minutes after `requestedStart`.
 * If the reservation is still `confirmed` when the timer fires we mark it
 * `no_show`. This is best-effort — the {@link sweepReservationLifecycle}
 * function below is the durable safety net.
 */
function scheduleNoShowCheck(reservation: EvReservation) {
  if (typeof window === "undefined") return;
  const startMs = new Date(reservation.requestedStart).getTime();
  const graceMs = 30 * 60 * 1000;
  const delay = Math.max(0, startMs + graceMs - Date.now());
  // Cap at ~24h to avoid holding onto a setTimeout forever in dev sessions.
  if (delay > 24 * 60 * 60 * 1000) return;
  window.setTimeout(async () => {
    const latest = await getReservation(reservation.id);
    if (latest && latest.status === "confirmed") {
      await markNoShow(reservation.id);
    }
  }, delay);
}

/**
 * Boot-time sweep: enforces reservation lifecycle rules that can only be
 * observed after the fact (e.g. after a page reload, or if the app was closed
 * for hours).
 *
 * - `confirmed` reservations whose hold has expired (now > requestedStart +
 *   holdMinutes) and whose start is still in the future get cancelled with
 *   reason `"hold_expired"` and a consumer notification.
 * - `confirmed` reservations whose grace period (30 min after requestedStart)
 *   has elapsed get marked `no_show` with consumer + vendor notifications.
 *
 * Returns the number of reservations touched so callers can invalidate
 * relevant query caches.
 */
export async function sweepReservationLifecycle(): Promise<number> {
  const list = loadReservations();
  const now = Date.now();
  let changed = 0;

  for (let i = 0; i < list.length; i += 1) {
    const r = list[i];
    if (r.status !== "confirmed") continue;
    const startMs = new Date(r.requestedStart).getTime();
    const holdEndMs = startMs + Math.max(0, r.holdMinutes) * 60 * 1000;
    const graceEndMs = startMs + 30 * 60 * 1000;

    if (now >= graceEndMs) {
      // Past 30-min grace after start — treat as no-show. `markNoShow`
      // persists the change and fires consumer + vendor notifications.
      await markNoShow(r.id);
      changed += 1;
      continue;
    }

    if (now >= holdEndMs && now < startMs) {
      // Held past hold window but reservation start is still in the future
      // (edge: hold window ends before requestedStart). Release with
      // hold_expired.
      const updated: EvReservation = {
        ...r,
        status: "cancelled",
        reason: "hold_expired",
        updatedAt: new Date().toISOString(),
      };
      list[i] = updated;
      changed += 1;
      pushNotification({
        audience: "consumer",
        audienceId: r.userId,
        title: "Reservation released",
        body: `Your hold expired before you confirmed. Try again anytime.`,
      });
    }
  }
  if (changed > 0) saveReservations(list);
  return changed;
}

export async function cancelReservation(id: string): Promise<EvReservation | null> {
  const list = loadReservations();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const reservation: EvReservation = {
    ...list[idx],
    status: "cancelled",
    reason: "user_cancelled",
    updatedAt: new Date().toISOString(),
  };
  list[idx] = reservation;
  saveReservations(list);
  return reservation;
}

export async function markNoShow(id: string): Promise<EvReservation | null> {
  const list = loadReservations();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const reservation: EvReservation = {
    ...list[idx],
    status: "no_show",
    reason: "no_show",
    updatedAt: new Date().toISOString(),
  };
  list[idx] = reservation;
  saveReservations(list);

  const station = await getStation(reservation.stationId);
  pushNotification({
    audience: "consumer",
    audienceId: reservation.userId,
    title: "Reservation expired",
    body: `We released your charger at ${station?.name ?? "the station"} after 30 minutes.`,
  });
  pushNotification({
    audience: "vendor",
    audienceId: station?.partnerId ?? "partner-demo",
    title: "Consumer no-show",
    body: `Reservation ${reservation.id.slice(-6).toUpperCase()} released after 30 min.`,
  });
  return reservation;
}

export async function markAtRisk(
  id: string,
  reason: EvReservation["reason"],
  message: string,
): Promise<EvReservation | null> {
  const list = loadReservations();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const reservation: EvReservation = {
    ...list[idx],
    status: "at_risk",
    reason,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = reservation;
  saveReservations(list);

  pushNotification({
    audience: "consumer",
    audienceId: reservation.userId,
    title: "Reservation at risk",
    body: message,
  });
  return reservation;
}

export async function getReservation(id: string): Promise<EvReservation | null> {
  return loadReservations().find((r) => r.id === id) ?? null;
}

export async function getUserReservations(userId: string): Promise<EvReservation[]> {
  return loadReservations()
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getReservationsForStation(
  stationId: string,
): Promise<EvReservation[]> {
  return loadReservations().filter((r) => r.stationId === stationId);
}

// ---------- Sessions ----------

async function createScheduledSession(
  reservation: EvReservation,
): Promise<EvSession> {
  const station = await getStation(reservation.stationId);
  const connector = station?.connectors.find(
    (c) => c.id === reservation.chargerId,
  );
  const pricePerKwh =
    station && connector
      ? station.pricing.unit === "per_kwh"
        ? station.pricing.amount
        : station.pricing.amount / connector.powerKw
      : 18;

  const profile = await getVehicleProfile(reservation.vehicleId);

  const session: EvSession = {
    id: makeId("evses"),
    reservationId: reservation.id,
    stationId: reservation.stationId,
    chargerId: reservation.chargerId,
    connectorType: reservation.connectorType,
    ratedKw: reservation.powerKw,
    vehicleId: reservation.vehicleId,
    userId: reservation.userId,
    status: "scheduled",
    scheduledFor: reservation.requestedStart,
    kwhDelivered: 0,
    currentKw: 0,
    peakKw: 0,
    cost: 0,
    targetKwh: reservation.targetKwh,
    targetSocPct:
      reservation.target.kind === "soc"
        ? reservation.target.targetSocPct
        : reservation.target.kind === "full"
          ? 100
          : undefined,
    currentSocPct: profile?.currentSocPct,
    startSocPct: profile?.currentSocPct,
    pricePerKwh,
    taxPct: station?.pricing.taxPct ?? 18,
    idleFeePerMinute: station?.pricing.idleFeePerMinute ?? 0,
    lastTickAt: new Date().toISOString(),
    powerDip: false,
    dipCooldown: 0,
  };
  const list = loadSessions();
  list.unshift(session);
  saveSessions(list);
  return session;
}

export async function startSession(
  reservationId: string,
): Promise<EvSession | null> {
  const sessions = loadSessions();
  const idx = sessions.findIndex(
    (s) => s.reservationId === reservationId && s.status === "scheduled",
  );
  if (idx === -1) return null;
  const now = new Date().toISOString();
  sessions[idx] = {
    ...sessions[idx],
    status: "active",
    startedAt: now,
    lastTickAt: now,
  };
  saveSessions(sessions);

  // Flip reservation → active.
  const reservations = loadReservations();
  const rIdx = reservations.findIndex((r) => r.id === reservationId);
  if (rIdx !== -1) {
    reservations[rIdx] = {
      ...reservations[rIdx],
      status: "active",
      updatedAt: now,
    };
    saveReservations(reservations);
  }

  const station = await getStation(sessions[idx].stationId);
  pushNotification({
    audience: "vendor",
    audienceId: station?.partnerId ?? "partner-demo",
    title: "Charging session started",
    body: `${sessions[idx].connectorType.toUpperCase()} at ${station?.name ?? "your station"} is now delivering power.`,
  });

  return sessions[idx];
}

/**
 * Advance one telemetry tick. Deterministic ramp-up + linear delivery.
 *  - Time is scaled 60× so 1 real second == 1 simulated minute.
 *  - kW ramps 0 → ratedKw over ~30 real seconds.
 *  - 5% chance per 30-tick window of a visible "power dip" (kW temporarily 0).
 * Returns the updated session (or null if none active).
 */
export async function tickTelemetry(
  sessionId: string,
): Promise<EvSession | null> {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  const s = sessions[idx];
  if (s.status !== "active") return s;

  const now = new Date();
  const last = new Date(s.lastTickAt);
  const realSecs = Math.max(0.5, (now.getTime() - last.getTime()) / 1000);
  const simMinutes = realSecs; // 1 real second = 1 sim minute

  // Ramp: kW rises from 0 → ratedKw over 30 real seconds since start.
  const startedAt = s.startedAt ? new Date(s.startedAt) : now;
  const rampSeconds = 30;
  const sinceStart = (now.getTime() - startedAt.getTime()) / 1000;
  const rampFrac = Math.min(1, sinceStart / rampSeconds);

  // Power dip logic: 5% chance every 30 sim-minutes to enter a dip; auto-clears.
  let powerDip = s.powerDip;
  let dipCooldown = s.dipCooldown + simMinutes;
  if (powerDip && dipCooldown > 8) {
    powerDip = false;
    dipCooldown = 0;
  } else if (!powerDip && dipCooldown > 30) {
    if (Math.random() < 0.05) {
      powerDip = true;
      dipCooldown = 0;
    } else {
      dipCooldown = 0; // reset window
    }
  }

  const currentKw = powerDip ? 0 : Math.round(s.ratedKw * rampFrac * 10) / 10;

  // Deliver kWh over sim minutes.
  const deltaKwh = (currentKw * simMinutes) / 60;
  const kwhDelivered = Math.min(s.targetKwh, s.kwhDelivered + deltaKwh);
  const cost = Math.round(kwhDelivered * s.pricePerKwh);

  // Update SOC if we know battery capacity via vehicle profile.
  const profile = await getVehicleProfile(s.vehicleId);
  let currentSocPct = s.currentSocPct;
  if (profile && s.startSocPct != null) {
    const added = (kwhDelivered / profile.batteryKwh) * 100;
    currentSocPct = Math.min(100, s.startSocPct + added);
  }

  const nextStatus: EvSession["status"] =
    kwhDelivered >= s.targetKwh - 0.001 ? "completed" : "active";
  const endedAt = nextStatus === "completed" ? now.toISOString() : s.endedAt;

  const updated: EvSession = {
    ...s,
    currentKw,
    kwhDelivered,
    peakKw: Math.max(s.peakKw, currentKw),
    cost,
    currentSocPct,
    powerDip,
    dipCooldown,
    lastTickAt: now.toISOString(),
    status: nextStatus,
    endedAt,
  };
  sessions[idx] = updated;
  saveSessions(sessions);

  if (nextStatus === "completed") {
    await finalizeSession(updated);
  }

  return updated;
}

async function finalizeSession(session: EvSession): Promise<void> {
  const reservations = loadReservations();
  const rIdx = reservations.findIndex((r) => r.id === session.reservationId);
  if (rIdx !== -1) {
    reservations[rIdx] = {
      ...reservations[rIdx],
      status: "completed",
      actualCost: session.cost,
      updatedAt: new Date().toISOString(),
    };
    saveReservations(reservations);
  }
  const station = await getStation(session.stationId);
  pushNotification({
    audience: "consumer",
    audienceId: session.userId,
    title: "Charging complete",
    body: `${session.kwhDelivered.toFixed(1)} kWh delivered · ₹${session.cost} total.`,
  });
  pushNotification({
    audience: "vendor",
    audienceId: station?.partnerId ?? "partner-demo",
    title: "Session completed",
    body: `${session.connectorType.toUpperCase()} · ${session.kwhDelivered.toFixed(1)} kWh · ₹${session.cost}.`,
  });

  // Persist final SOC back to vehicle profile.
  if (session.currentSocPct != null) {
    await upsertVehicleProfile({
      vehicleId: session.vehicleId,
      connectorType: session.connectorType,
      batteryKwh:
        (await getVehicleProfile(session.vehicleId))?.batteryKwh ?? 40,
      currentSocPct: session.currentSocPct,
    });
  }
}

export async function endSession(
  sessionId: string,
  opts?: { reason?: "user_stopped" },
): Promise<EvSession | null> {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const updated: EvSession = {
    ...sessions[idx],
    status: "completed",
    endedAt: now,
    lastTickAt: now,
    currentKw: 0,
  };
  sessions[idx] = updated;
  saveSessions(sessions);
  await finalizeSession(updated);
  return updated;
}

export async function getSession(id: string): Promise<EvSession | null> {
  return loadSessions().find((s) => s.id === id) ?? null;
}

export async function getSessionByReservation(
  reservationId: string,
): Promise<EvSession | null> {
  return (
    loadSessions().find((s) => s.reservationId === reservationId) ?? null
  );
}

export async function getUserSessions(userId: string): Promise<EvSession[]> {
  return loadSessions()
    .filter((s) => s.userId === userId)
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
}

export async function getStationSessions(
  stationId: string,
): Promise<EvSession[]> {
  return loadSessions()
    .filter((s) => s.stationId === stationId)
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
}

// ---------- Reviews ----------

export async function createReview(
  input: Omit<EvReview, "id" | "createdAt">,
): Promise<EvReview> {
  const review: EvReview = {
    ...input,
    id: makeId("evrev"),
    createdAt: new Date().toISOString(),
  };
  const list = loadReviews();
  list.unshift(review);
  saveReviews(list);

  // Roll up rating on station.
  const stations = loadAll();
  const idx = stations.findIndex((s) => s.id === input.stationId);
  if (idx !== -1) {
    const stationReviews = list.filter((r) => r.stationId === input.stationId);
    const avg =
      stationReviews.reduce((n, r) => n + r.rating, 0) / stationReviews.length;
    stations[idx] = {
      ...stations[idx],
      rating: Math.round(avg * 10) / 10,
      reviewCount: stationReviews.length,
      updatedAt: new Date().toISOString(),
    };
    saveAll(stations);
  }
  return review;
}

export async function getReviewsForStation(
  stationId: string,
): Promise<EvReview[]> {
  return loadReviews().filter((r) => r.stationId === stationId);
}

// ---------- Vehicle profiles ----------

export async function getVehicleProfile(
  vehicleId: string,
): Promise<EvVehicleProfile | null> {
  return loadVehicleProfiles().find((p) => p.vehicleId === vehicleId) ?? null;
}

export async function upsertVehicleProfile(
  profile: EvVehicleProfile,
): Promise<EvVehicleProfile> {
  const list = loadVehicleProfiles();
  const idx = list.findIndex((p) => p.vehicleId === profile.vehicleId);
  if (idx === -1) list.unshift(profile);
  else list[idx] = profile;
  saveVehicleProfiles(list);
  return profile;
}

export async function listVehicleProfiles(): Promise<EvVehicleProfile[]> {
  return loadVehicleProfiles();
}
