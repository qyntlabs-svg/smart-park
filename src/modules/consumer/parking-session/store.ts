// localStorage-backed mock store for Consumer Active Parking Sessions (C-21).
//
// Same discipline as modules/ev/store.ts:
//  - every function returns a Promise so hooks look network-shaped
//  - readJson / writeJson via shared/lib/storage
//  - a getActiveParkingSession() helper is exported for HomeScreen banner

import { makeId, readJson, writeJson } from "@/shared/lib/storage";
import type {
  ExtendParkingInput,
  ParkingSession,
  ParkingSessionStatus,
} from "./types";

const KEY = "consumerParkingSessions";

const SEED: ParkingSession[] = [
  {
    id: "psess-seed-1",
    userId: "guest",
    facilityId: "fac-seed-tnagar",
    facilityName: "Auto Doc Parking — T Nagar",
    facilityAddress: "Panagal Park, T Nagar, Chennai 600017",
    slotNumber: "B-14",
    vehicleId: "veh-demo",
    vehicleRegistration: "TN 01 AB 1234",
    hourlyRate: 30,
    startedAt: new Date(Date.now() - 80 * 60_000).toISOString(),
    runningCost: 40,
    extensions: 0,
    capMinutes: 240,
    status: "active",
    exitQrToken: "PARK-EXIT-DEMO-8842",
  },
];

function loadAll(): ParkingSession[] {
  const existing = readJson<ParkingSession[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function saveAll(list: ParkingSession[]) {
  writeJson(KEY, list);
}

export async function listUserParkingSessions(
  userId: string,
): Promise<ParkingSession[]> {
  return loadAll()
    .filter((s) => s.userId === userId || s.userId === "guest")
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export async function getParkingSession(
  id: string,
): Promise<ParkingSession | null> {
  return loadAll().find((s) => s.id === id) ?? null;
}

/** Convenience used by HomeScreen banner. Returns first active session, if any. */
export async function getActiveParkingSession(
  userId: string,
): Promise<ParkingSession | null> {
  return (
    loadAll().find(
      (s) =>
        (s.userId === userId || s.userId === "guest") &&
        s.status === "active",
    ) ?? null
  );
}

export async function createParkingSession(
  input: Omit<
    ParkingSession,
    "id" | "startedAt" | "runningCost" | "extensions" | "status" | "exitQrToken"
  >,
): Promise<ParkingSession> {
  const session: ParkingSession = {
    ...input,
    id: makeId("psess"),
    startedAt: new Date().toISOString(),
    runningCost: 0,
    extensions: 0,
    status: "active",
    exitQrToken: `PARK-EXIT-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  const list = loadAll();
  list.unshift(session);
  saveAll(list);
  return session;
}

/** Recompute running cost against wall clock. Idempotent. */
export async function tickParkingSession(
  id: string,
): Promise<ParkingSession | null> {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const s = list[idx];
  if (s.status !== "active") return s;
  const now = Date.now();
  const start = new Date(s.startedAt).getTime();
  const minutes = Math.max(0, (now - start) / 60_000);
  const cost = Math.round((minutes / 60) * s.hourlyRate);
  const updated: ParkingSession = { ...s, runningCost: cost };
  list[idx] = updated;
  saveAll(list);
  return updated;
}

export async function extendParkingSession(
  input: ExtendParkingInput,
): Promise<ParkingSession | null> {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === input.sessionId);
  if (idx === -1) return null;
  const s = list[idx];
  const capMinutes = (s.capMinutes ?? 240) + input.addMinutes;
  const updated: ParkingSession = {
    ...s,
    extensions: s.extensions + 1,
    capMinutes,
  };
  list[idx] = updated;
  saveAll(list);
  return updated;
}

export async function endParkingSession(
  id: string,
  status: Extract<ParkingSessionStatus, "completed" | "cancelled"> = "completed",
): Promise<ParkingSession | null> {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const updated: ParkingSession = {
    ...list[idx],
    status,
    endedAt: now,
  };
  list[idx] = updated;
  saveAll(list);
  return updated;
}
