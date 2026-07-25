// Vehicle Identity Platform — localStorage-backed mock store.
//
// Exports the cross-agent surface documented in `types.ts`:
//   - getVehicleIdentity(vehicleId)   → VehicleIdentity | null
//   - listVehicleIdentities()         → VehicleIdentity[]
//   - updatePermissions(vehicleId, permissions) → void
//
// Subagent A's C-52 (`/my-car`) reads through `getVehicleIdentity(vehicleId)`.
// This file is API-shaped so it can be swapped for real fetch calls later
// without any UI edit (see MODULES.md → "Mock-first data pattern").

import { readJson, writeJson } from "@/shared/lib/storage";
import type { VehicleIdentity } from "./types";

const IDENTITIES_KEY = "vipVehicleIdentities";

// ─── Seed data (Chennai, 3 rich vehicles) ───────────────────────────────
//
// Deterministic so the demo looks stable across reloads. Ownership chains
// go back to 2018 so the timelines feel populated.

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString();

const SEED_IDENTITIES: VehicleIdentity[] = [
  {
    vehicleId: "veh-mg-zsev-01",
    vin: "MA3ZSEV1TN0000101",
    plate: "TN 07 CX 4421",
    make: "MG",
    model: "ZS EV",
    year: 2022,
    ownershipChain: [
      { owner: "Aravind Ramesh", from: "2022-04-11", to: "2024-08-22" },
      { owner: "Priya Iyer", from: "2024-08-23" },
    ],
    docs: [
      {
        id: "d-mg-rc",
        kind: "rc",
        issuer: "RTO Chennai South",
        expiresAt: "2037-04-11",
        url: "#rc",
      },
      {
        id: "d-mg-ins",
        kind: "insurance",
        issuer: "Bajaj Allianz",
        expiresAt: daysAgo(-160),
        url: "#ins",
      },
      {
        id: "d-mg-puc",
        kind: "puc",
        issuer: "Ashoka Emission Center",
        expiresAt: daysAgo(-40),
        url: "#puc",
      },
      {
        id: "d-mg-warranty",
        kind: "warranty",
        issuer: "MG Motor India",
        expiresAt: "2030-04-11",
        url: "#warr",
      },
    ],
    serviceHistory: [
      {
        id: "h-mg-1",
        date: daysAgo(420),
        providerId: "prov-mg-anna",
        providerName: "MG Motor · Anna Nagar",
        kind: "service",
        summary: "20,000 km inspection · brake fluid, cabin filter",
        cost: 6800,
      },
      {
        id: "h-mg-2",
        date: daysAgo(320),
        providerId: "ev-seed-omr",
        providerName: "Auto Doc FastCharge OMR",
        kind: "charge",
        summary: "DC fast charge · 42 kWh · CCS 150 kW",
        cost: 924,
      },
      {
        id: "h-mg-3",
        date: daysAgo(210),
        providerId: "tow-op-01",
        providerName: "Chennai Tow Co.",
        kind: "tow",
        summary: "Flat tow after LFP contactor fault, delivered to service",
        cost: 2100,
      },
      {
        id: "h-mg-4",
        date: daysAgo(155),
        providerId: "prov-mg-anna",
        providerName: "MG Motor · Anna Nagar",
        kind: "service",
        summary: "Contactor replacement · warranty covered",
        cost: 0,
      },
      {
        id: "h-mg-5",
        date: daysAgo(80),
        providerId: "ev-seed-velachery",
        providerName: "Auto Doc EcoCharge Velachery",
        kind: "charge",
        summary: "AC slow charge overnight · 26 kWh · Type 2 7.4 kW",
        cost: 468,
      },
      {
        id: "h-mg-6",
        date: daysAgo(35),
        providerId: "rent-seed-1",
        providerName: "Anna Nagar Tower Parking",
        kind: "parking",
        summary: "Weekly covered rental · 7 days",
        cost: 1500,
      },
      {
        id: "h-mg-7",
        date: daysAgo(12),
        providerId: "ev-seed-tnagar",
        providerName: "Auto Doc Volt Hub T Nagar",
        kind: "charge",
        summary: "DC 60 kW · 32 kWh · CCS",
        cost: 680,
      },
    ],
    recalls: [
      {
        id: "r-mg-1",
        issuedAt: daysAgo(220),
        oem: "MG Motor India",
        summary:
          "LFP battery contactor thermal issue — service bulletin SB-24-071",
        status: "closed",
      },
    ],
    permissions: [
      {
        audience: "insurer",
        scopes: ["read:service_history", "read:tow_events"],
        grantedAt: daysAgo(200),
      },
      {
        audience: "mechanic",
        scopes: ["read:service_history", "read:recalls"],
        grantedAt: daysAgo(120),
        expiresAt: daysAgo(-90),
      },
      {
        audience: "oem",
        scopes: ["read:telematics_summary"],
        grantedAt: daysAgo(300),
      },
    ],
  },
  {
    vehicleId: "veh-tata-nexon-02",
    vin: "MAT625NXONEV000202",
    plate: "TN 09 BR 7712",
    make: "Tata",
    model: "Nexon EV Max",
    year: 2023,
    ownershipChain: [{ owner: "Suresh Krishnan", from: "2023-01-14" }],
    docs: [
      {
        id: "d-tt-rc",
        kind: "rc",
        issuer: "RTO Chennai Central",
        expiresAt: "2038-01-14",
        url: "#rc",
      },
      {
        id: "d-tt-ins",
        kind: "insurance",
        issuer: "ICICI Lombard",
        expiresAt: daysAgo(-45),
        url: "#ins",
      },
      {
        id: "d-tt-puc",
        kind: "puc",
        issuer: "Green Emissions",
        expiresAt: daysAgo(-15),
        url: "#puc",
      },
    ],
    serviceHistory: [
      {
        id: "h-tt-1",
        date: daysAgo(350),
        providerId: "prov-tata-guindy",
        providerName: "Tata Motors · Guindy",
        kind: "service",
        summary: "1,000 km first service · complimentary",
        cost: 0,
      },
      {
        id: "h-tt-2",
        date: daysAgo(240),
        providerId: "ev-seed-tnagar",
        providerName: "Auto Doc Volt Hub T Nagar",
        kind: "charge",
        summary: "DC fast charge · 28 kWh",
        cost: 560,
      },
      {
        id: "h-tt-3",
        date: daysAgo(190),
        providerId: "prov-tata-guindy",
        providerName: "Tata Motors · Guindy",
        kind: "service",
        summary: "Regular service, tyre rotation",
        cost: 4200,
      },
      {
        id: "h-tt-4",
        date: daysAgo(60),
        providerId: "ev-seed-omr",
        providerName: "Auto Doc FastCharge OMR",
        kind: "charge",
        summary: "DC 50 kW · 22 kWh",
        cost: 484,
      },
      {
        id: "h-tt-5",
        date: daysAgo(20),
        providerId: "rent-seed-2",
        providerName: "T Nagar Bike & Car Rack",
        kind: "parking",
        summary: "Monthly reserved slot renewal",
        cost: 5000,
      },
    ],
    recalls: [
      {
        id: "r-tt-1",
        issuedAt: daysAgo(90),
        oem: "Tata Motors",
        summary: "IVI firmware update — CAN bus latency fix",
        status: "open",
      },
    ],
    permissions: [
      {
        audience: "insurer",
        scopes: ["read:service_history"],
        grantedAt: daysAgo(340),
      },
      {
        audience: "buyer",
        scopes: ["read:service_history", "read:ownership"],
        grantedAt: daysAgo(6),
        expiresAt: daysAgo(-24),
      },
    ],
  },
  {
    vehicleId: "veh-hy-kona-03",
    vin: "MALCA51CLKW000303",
    plate: "TN 22 BJ 1024",
    make: "Hyundai",
    model: "Kona Electric",
    year: 2021,
    ownershipChain: [
      { owner: "Fleet Ops · GreenCab", from: "2021-05-02", to: "2023-11-30" },
      { owner: "Deepa Balaji", from: "2023-12-01" },
    ],
    docs: [
      {
        id: "d-hy-rc",
        kind: "rc",
        issuer: "RTO Chennai North",
        expiresAt: "2036-05-02",
      },
      {
        id: "d-hy-ins",
        kind: "insurance",
        issuer: "HDFC Ergo",
        expiresAt: daysAgo(20),
      },
      {
        id: "d-hy-warranty",
        kind: "warranty",
        issuer: "Hyundai Motor India",
        expiresAt: "2029-05-02",
      },
    ],
    serviceHistory: [
      {
        id: "h-hy-1",
        date: daysAgo(720),
        providerId: "prov-hy-mount",
        providerName: "Hyundai · Mount Road",
        kind: "service",
        summary: "Fleet handover inspection",
        cost: 3200,
      },
      {
        id: "h-hy-2",
        date: daysAgo(500),
        providerId: "tow-op-02",
        providerName: "Speedy Recovery",
        kind: "tow",
        summary: "Battery drain roadside — jumpstart failed, flatbed",
        cost: 3400,
      },
      {
        id: "h-hy-3",
        date: daysAgo(310),
        providerId: "prov-hy-mount",
        providerName: "Hyundai · Mount Road",
        kind: "service",
        summary: "12V battery replaced, coolant top-up",
        cost: 7800,
      },
      {
        id: "h-hy-4",
        date: daysAgo(140),
        providerId: "ev-seed-velachery",
        providerName: "Auto Doc EcoCharge Velachery",
        kind: "charge",
        summary: "AC 3.3 kW overnight · 18 kWh · Bharat AC",
        cost: 270,
      },
      {
        id: "h-hy-5",
        date: daysAgo(70),
        providerId: "prov-hy-mount",
        providerName: "Hyundai · Mount Road",
        kind: "service",
        summary: "Brake pads · rotors machined",
        cost: 11400,
      },
    ],
    recalls: [
      {
        id: "r-hy-1",
        issuedAt: daysAgo(510),
        oem: "Hyundai",
        summary: "BMS firmware update — SOC calibration",
        status: "closed",
      },
      {
        id: "r-hy-2",
        issuedAt: daysAgo(45),
        oem: "Hyundai",
        summary: "HV battery module inspection — voluntary campaign",
        status: "open",
      },
    ],
    permissions: [
      {
        audience: "insurer",
        scopes: [
          "read:service_history",
          "read:tow_events",
          "read:recalls",
        ],
        grantedAt: daysAgo(720),
      },
      {
        audience: "oem",
        scopes: ["read:telematics_summary", "read:recalls"],
        grantedAt: daysAgo(720),
      },
      {
        audience: "mechanic",
        scopes: ["read:service_history"],
        grantedAt: daysAgo(80),
      },
    ],
  },
];

// ─── Low-level load/save ────────────────────────────────────────────────

function loadAll(): VehicleIdentity[] {
  const existing = readJson<VehicleIdentity[] | null>(IDENTITIES_KEY, null);
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  writeJson(IDENTITIES_KEY, SEED_IDENTITIES);
  return SEED_IDENTITIES;
}

function saveAll(list: VehicleIdentity[]) {
  writeJson(IDENTITIES_KEY, list);
}

// ─── Public API (cross-agent contract) ──────────────────────────────────

export async function getVehicleIdentity(
  vehicleId: string,
): Promise<VehicleIdentity | null> {
  return loadAll().find((v) => v.vehicleId === vehicleId) ?? null;
}

export async function listVehicleIdentities(): Promise<VehicleIdentity[]> {
  return loadAll();
}

export async function updatePermissions(
  vehicleId: string,
  permissions: VehicleIdentity["permissions"],
): Promise<void> {
  const list = loadAll();
  const idx = list.findIndex((v) => v.vehicleId === vehicleId);
  if (idx === -1) return;
  list[idx] = { ...list[idx], permissions };
  saveAll(list);
}

// ─── Internal admin-only helpers (used by VIP-01…07 pages) ──────────────

export async function searchVehicles(
  query: string,
): Promise<VehicleIdentity[]> {
  const q = query.trim().toLowerCase();
  if (!q) return loadAll();
  return loadAll().filter(
    (v) =>
      v.plate.toLowerCase().includes(q) ||
      v.vin?.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q),
  );
}

// ─── Consumer-facing helper (C-52 My Car reads this) ────────────────────

/**
 * Deterministically map a consumer `vehicleId` (from the consumer garage) to
 * one of the seeded VIP identities so the C-52 My Car surface always renders
 * something meaningful. If `vehicleId` looks like a VIP-native id we return
 * that identity directly; otherwise we hash the string into the list.
 */
export async function getVehicleIdentityForConsumer(
  _userId: string,
  vehicleId?: string,
): Promise<VehicleIdentity | null> {
  const list = loadAll();
  if (!list.length) return null;
  if (!vehicleId) return list[0];
  const direct = list.find((v) => v.vehicleId === vehicleId);
  if (direct) return direct;
  // Cheap deterministic hash so the same consumer vehicleId always maps to
  // the same VIP identity across reloads.
  let h = 0;
  for (let i = 0; i < vehicleId.length; i++) {
    h = (h * 31 + vehicleId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % list.length;
  return list[idx];
}
