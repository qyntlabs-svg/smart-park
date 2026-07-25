// Fleet OS — localStorage-backed mock store.
// Follows the same pattern as modules/ev/store.ts: async API surface backed
// by localStorage today, swap for axios later without touching hooks/pages.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type {
  FleetAlert,
  FleetApiKey,
  FleetApiScope,
  FleetBatchReservation,
  FleetCostCenter,
  FleetDepot,
  FleetDriver,
  FleetInvoice,
  FleetMaintenanceOrder,
  FleetPolicy,
  FleetRoute,
  FleetShift,
  FleetSsoConfig,
  FleetVehicle,
} from "./types";
import {
  SEED_ALERTS,
  SEED_API_KEYS,
  SEED_BATCH,
  SEED_COST_CENTERS,
  SEED_DEPOTS,
  SEED_DRIVERS,
  SEED_INVOICES,
  SEED_MAINTENANCE,
  SEED_POLICIES,
  SEED_ROUTES,
  SEED_SHIFTS,
  SEED_SSO,
  SEED_VEHICLES,
} from "./lib/mock-data";

const K = {
  vehicles: "fleetVehicles",
  drivers: "fleetDrivers",
  shifts: "fleetShifts",
  costCenters: "fleetCostCenters",
  depots: "fleetDepots",
  routes: "fleetRoutes",
  maintenance: "fleetMaintenance",
  policies: "fleetPolicies",
  batch: "fleetBatchReservations",
  invoices: "fleetInvoices",
  apiKeys: "fleetApiKeys",
  sso: "fleetSsoConfig",
  alerts: "fleetAlerts",
} as const;

function readSeeded<T>(key: string, seed: T): T {
  const existing = readJson<T | null>(key, null);
  if (existing !== null && existing !== undefined) return existing;
  writeJson(key, seed);
  return seed;
}

// ---------- Vehicles ----------

export async function listFleetVehicles(): Promise<FleetVehicle[]> {
  return readSeeded(K.vehicles, SEED_VEHICLES);
}

export async function getFleetVehicle(id: string): Promise<FleetVehicle | null> {
  const list = await listFleetVehicles();
  return list.find((v) => v.id === id) ?? null;
}

export async function updateFleetVehicle(
  id: string,
  patch: Partial<FleetVehicle>,
): Promise<FleetVehicle | null> {
  const list = await listFleetVehicles();
  const idx = list.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const next: FleetVehicle = { ...list[idx], ...patch };
  list[idx] = next;
  writeJson(K.vehicles, list);
  return next;
}

// ---------- Drivers ----------

export async function listFleetDrivers(): Promise<FleetDriver[]> {
  return readSeeded(K.drivers, SEED_DRIVERS);
}

export async function getFleetDriver(id: string): Promise<FleetDriver | null> {
  const list = await listFleetDrivers();
  return list.find((d) => d.id === id) ?? null;
}

export async function updateFleetDriver(
  id: string,
  patch: Partial<FleetDriver>,
): Promise<FleetDriver | null> {
  const list = await listFleetDrivers();
  const idx = list.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const next: FleetDriver = { ...list[idx], ...patch };
  list[idx] = next;
  writeJson(K.drivers, list);
  return next;
}

// ---------- Shifts ----------

export async function listFleetShifts(): Promise<FleetShift[]> {
  return readSeeded(K.shifts, SEED_SHIFTS);
}

// ---------- Cost centers ----------

export async function listCostCenters(): Promise<FleetCostCenter[]> {
  return readSeeded(K.costCenters, SEED_COST_CENTERS);
}

// ---------- Depots ----------

export async function listDepots(): Promise<FleetDepot[]> {
  return readSeeded(K.depots, SEED_DEPOTS);
}

// ---------- Routes ----------

export async function listRoutes(): Promise<FleetRoute[]> {
  return readSeeded(K.routes, SEED_ROUTES);
}

export async function reoptimizeRoute(id: string): Promise<FleetRoute | null> {
  const list = await listRoutes();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const next: FleetRoute = {
    ...list[idx],
    optimizedAt: new Date().toISOString(),
    distanceKm: Math.max(5, list[idx].distanceKm - Math.round(Math.random() * 4)),
  };
  list[idx] = next;
  writeJson(K.routes, list);
  return next;
}

// ---------- Maintenance ----------

export async function listMaintenance(): Promise<FleetMaintenanceOrder[]> {
  return readSeeded(K.maintenance, SEED_MAINTENANCE);
}

export async function scheduleMaintenance(input: {
  vehicleId: string;
  reason: string;
  scheduledAt: string;
  estCost?: number;
}): Promise<FleetMaintenanceOrder> {
  const list = await listMaintenance();
  const order: FleetMaintenanceOrder = {
    id: makeId("maint"),
    vehicleId: input.vehicleId,
    type: "scheduled",
    reason: input.reason,
    status: "booked",
    scheduledAt: input.scheduledAt,
    estCost: input.estCost ?? 2500,
    mechanicShopId: "mech-1",
  };
  list.unshift(order);
  writeJson(K.maintenance, list);
  return order;
}

export async function updateMaintenanceStatus(
  id: string,
  status: FleetMaintenanceOrder["status"],
): Promise<FleetMaintenanceOrder | null> {
  const list = await listMaintenance();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const next = {
    ...list[idx],
    status,
    completedAt:
      status === "completed" ? new Date().toISOString() : list[idx].completedAt,
  };
  list[idx] = next;
  writeJson(K.maintenance, list);
  return next;
}

// ---------- Policies ----------

export async function listPolicies(): Promise<FleetPolicy[]> {
  return readSeeded(K.policies, SEED_POLICIES);
}

export async function upsertPolicy(policy: FleetPolicy): Promise<FleetPolicy> {
  const list = await listPolicies();
  const idx = list.findIndex((p) => p.id === policy.id);
  if (idx === -1) list.unshift(policy);
  else list[idx] = policy;
  writeJson(K.policies, list);
  return policy;
}

export async function togglePolicy(id: string): Promise<FleetPolicy | null> {
  const list = await listPolicies();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], enabled: !list[idx].enabled };
  writeJson(K.policies, list);
  return list[idx];
}

// ---------- Batch reservations ----------

export async function listBatchReservations(): Promise<FleetBatchReservation[]> {
  return readSeeded(K.batch, SEED_BATCH);
}

export async function createBatchReservation(input: {
  label: string;
  depotId: string;
  windowStart: string;
  windowEnd: string;
  chargersNeeded: number;
}): Promise<FleetBatchReservation> {
  const list = await listBatchReservations();
  // Simulate a partial confirmation to make the demo feel real.
  const confirmedCount = Math.floor(input.chargersNeeded * (0.6 + Math.random() * 0.35));
  const rec: FleetBatchReservation = {
    id: makeId("batch"),
    label: input.label,
    depotId: input.depotId,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    chargersNeeded: input.chargersNeeded,
    status: confirmedCount === input.chargersNeeded ? "confirmed" : "partially_confirmed",
    confirmedIds: Array.from(
      { length: confirmedCount },
      (_, i) => `evres-batch-${Date.now()}-${i}`,
    ),
    createdAt: new Date().toISOString(),
  };
  list.unshift(rec);
  writeJson(K.batch, list);
  return rec;
}

// ---------- Invoices ----------

export async function listInvoices(): Promise<FleetInvoice[]> {
  return readSeeded(K.invoices, SEED_INVOICES);
}

// ---------- API keys ----------

export async function listApiKeys(): Promise<FleetApiKey[]> {
  return readSeeded(K.apiKeys, SEED_API_KEYS);
}

export async function createApiKey(input: {
  label: string;
  scopes: FleetApiScope[];
}): Promise<{ key: FleetApiKey; plaintext: string }> {
  const list = await listApiKeys();
  const secret = `sk_live_${Math.random().toString(36).slice(2, 12)}${Math.random()
    .toString(36)
    .slice(2, 12)}`;
  const rec: FleetApiKey = {
    id: makeId("fk"),
    label: input.label,
    keyMasked: `sk_live_****${secret.slice(-4)}`,
    scopes: input.scopes,
    createdAt: new Date().toISOString(),
    revoked: false,
  };
  list.unshift(rec);
  writeJson(K.apiKeys, list);
  return { key: rec, plaintext: secret };
}

export async function rotateApiKey(id: string): Promise<FleetApiKey | null> {
  const list = await listApiKeys();
  const idx = list.findIndex((k) => k.id === id);
  if (idx === -1) return null;
  const secret = `sk_live_${Math.random().toString(36).slice(2, 12)}`;
  const next: FleetApiKey = {
    ...list[idx],
    keyMasked: `sk_live_****${secret.slice(-4)}`,
    rotatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  writeJson(K.apiKeys, list);
  return next;
}

export async function revokeApiKey(id: string): Promise<FleetApiKey | null> {
  const list = await listApiKeys();
  const idx = list.findIndex((k) => k.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], revoked: true };
  writeJson(K.apiKeys, list);
  return list[idx];
}

// ---------- SSO ----------

export async function getSso(): Promise<FleetSsoConfig> {
  return readSeeded(K.sso, SEED_SSO);
}

export async function updateSso(patch: Partial<FleetSsoConfig>): Promise<FleetSsoConfig> {
  const current = await getSso();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  writeJson(K.sso, next);
  return next;
}

// ---------- Alerts ----------

export async function listAlerts(): Promise<FleetAlert[]> {
  return readSeeded(K.alerts, SEED_ALERTS);
}

export async function markAlertRead(id: string): Promise<FleetAlert | null> {
  const list = await listAlerts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], read: true };
  writeJson(K.alerts, list);
  return list[idx];
}

export async function markAllAlertsRead(): Promise<FleetAlert[]> {
  const list = await listAlerts();
  const next = list.map((a) => ({ ...a, read: true }));
  writeJson(K.alerts, next);
  return next;
}
