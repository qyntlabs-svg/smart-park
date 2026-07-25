// Operator SaaS — local store for pricing rules, maintenance orders, firmware
// jobs, payouts, roaming ledger, SLA incidents, and notifications.
// Real EV data (stations/sessions/reservations) lives in modules/ev/store.ts
// and is only read via lib/aggregations.ts.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type {
  FirmwareBundle,
  FirmwareJob,
  MaintenanceWorkOrder,
  OperatorNotice,
  OperatorPayout,
  PricingRule,
  RoamingEntry,
  RoamingPartner,
  SlaIncident,
} from "./types";

const K = {
  pricing: "operatorPricingRules",
  maintenance: "operatorMaintenance",
  firmwareBundles: "operatorFirmwareBundles",
  firmwareJobs: "operatorFirmwareJobs",
  payouts: "operatorPayouts",
  roamingPartners: "operatorRoamingPartners",
  roamingEntries: "operatorRoamingEntries",
  sla: "operatorSlaIncidents",
  notices: "operatorNotices",
} as const;

const now = () => new Date().toISOString();
const days = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
};

// ---------- Seed data ----------

const SEED_PRICING: PricingRule[] = [
  {
    id: "pr-tod-peak",
    stationId: "all",
    kind: "time_of_day",
    label: "Evening peak — +₹2/kWh",
    active: true,
    fromHour: 17,
    toHour: 22,
    perKwh: 20,
    createdAt: days(48),
  },
  {
    id: "pr-tod-offpeak",
    stationId: "all",
    kind: "time_of_day",
    label: "Night off-peak — –₹3/kWh",
    active: true,
    fromHour: 23,
    toHour: 6,
    perKwh: 14,
    createdAt: days(48),
  },
  {
    id: "pr-surge",
    stationId: "all",
    kind: "surge",
    label: "Surge — 1.25× when utilization > 80%",
    active: true,
    utilizationThresholdPct: 80,
    multiplier: 1.25,
    createdAt: days(30),
  },
  {
    id: "pr-ccs-fast",
    stationId: "ev-seed-omr",
    kind: "connector",
    label: "OMR — CCS 150kW premium",
    active: true,
    connectorType: "ccs",
    perKwh: 24,
    createdAt: days(20),
  },
];

const MAINT_ISSUES = [
  "Payment terminal frozen",
  "Cable retractor stuck",
  "Screen backlight failure",
  "Ground fault detected",
  "Contactor chatter on CCS gun 2",
];
const SEED_MAINT: MaintenanceWorkOrder[] = Array.from({ length: 8 }, (_, i) => {
  const status: MaintenanceWorkOrder["status"] =
    i < 2 ? "open" : i < 4 ? "dispatched" : i < 6 ? "on_site" : "resolved";
  return {
    id: `mwo-${i + 1}`,
    stationId: ["ev-seed-omr", "ev-seed-velachery", "ev-seed-tnagar"][i % 3],
    connectorId: i % 3 === 0 ? "c-omr-ccs" : undefined,
    issue: MAINT_ISSUES[i % MAINT_ISSUES.length],
    severity: i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low",
    status,
    fieldTech:
      status === "open" ? undefined : ["Ravi", "Kavya", "Vishnu"][i % 3],
    openedAt: days(i, 8 + i),
    resolvedAt: status === "resolved" ? days(Math.max(0, i - 1)) : undefined,
    partsUsed: status === "resolved" ? ["Contactor", "Retractor spring"] : [],
    slaMinutes: 240,
  };
});

const SEED_BUNDLES: FirmwareBundle[] = [
  {
    id: "fw-4-1-0",
    version: "4.1.0",
    releaseNotes: "Fixes OCPP 1.6-J heartbeat drift; adds Bharat DC-001 profile.",
    releasedAt: days(3),
    channel: "stable",
  },
  {
    id: "fw-4-0-2",
    version: "4.0.2",
    releaseNotes: "Improves ISO 15118 handshake reliability.",
    releasedAt: days(21),
    channel: "stable",
  },
  {
    id: "fw-4-2-0-beta",
    version: "4.2.0-beta.3",
    releaseNotes: "Beta: adaptive current limiting under grid stress.",
    releasedAt: days(1),
    channel: "beta",
  },
];

const SEED_JOBS: FirmwareJob[] = [
  {
    id: "fwj-1",
    stationId: "ev-seed-omr",
    bundleId: "fw-4-1-0",
    status: "in_progress",
    progressPct: 62,
    startedAt: days(0, 9),
  },
  {
    id: "fwj-2",
    stationId: "ev-seed-velachery",
    bundleId: "fw-4-1-0",
    status: "queued",
    progressPct: 0,
  },
  {
    id: "fwj-3",
    stationId: "ev-seed-tnagar",
    bundleId: "fw-4-0-2",
    status: "installed",
    progressPct: 100,
    startedAt: days(4, 8),
    finishedAt: days(4, 9),
  },
  {
    id: "fwj-4",
    stationId: "ev-seed-tnagar",
    bundleId: "fw-4-2-0-beta",
    status: "failed",
    progressPct: 71,
    startedAt: days(2, 11),
    finishedAt: days(2, 12),
  },
];

const SEED_PAYOUTS: OperatorPayout[] = Array.from({ length: 6 }, (_, i) => {
  const end = new Date();
  end.setDate(end.getDate() - i * 7);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const gross = 92000 + Math.round(Math.random() * 40000);
  const platformFee = Math.round(gross * 0.08);
  const taxes = Math.round(gross * 0.18 * 0.6);
  return {
    id: `payout-${i + 1}`,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    gross,
    platformFee,
    taxes,
    net: gross - platformFee - taxes,
    status: i === 0 ? "scheduled" : i === 1 ? "in_transit" : "paid",
    bankMasked: "HDFC ****5522",
    processedAt: i > 1 ? days(i * 7) : undefined,
  };
});

const SEED_PARTNERS: RoamingPartner[] = [
  {
    id: "rp-relay",
    name: "Relay Networks",
    country: "IN",
    networkSize: 640,
    status: "active",
    contractStart: days(180),
  },
  {
    id: "rp-euroamp",
    name: "EuroAmp",
    country: "DE",
    networkSize: 12800,
    status: "active",
    contractStart: days(90),
  },
  {
    id: "rp-borderline",
    name: "Borderline Charge",
    country: "SG",
    networkSize: 210,
    status: "pending",
    contractStart: days(4),
  },
];

const SEED_ROAM_ENTRIES: RoamingEntry[] = Array.from({ length: 14 }, (_, i) => {
  const dir: RoamingEntry["direction"] = i % 3 === 0 ? "outbound" : "inbound";
  const currency: RoamingEntry["currency"] = ["INR", "EUR", "USD"][i % 3] as RoamingEntry["currency"];
  return {
    id: `roam-${i + 1}`,
    partnerId: SEED_PARTNERS[i % SEED_PARTNERS.length].id,
    sessionId: `evses-external-${i + 1}`,
    direction: dir,
    kwh: 12 + (i % 30),
    costCents: 220 + i * 35,
    currency,
    settledAt: i > 3 ? days(i - 2, 9) : undefined,
    createdAt: days(i, 10),
  };
});

const SEED_SLA: SlaIncident[] = Array.from({ length: 8 }, (_, i) => {
  const opened = new Date();
  opened.setHours(opened.getHours() - i * 6);
  const durationMinutes = i === 0 ? 45 : 90 + Math.round(Math.random() * 240);
  const closed = new Date(opened.getTime() + durationMinutes * 60000);
  return {
    id: `sla-${i + 1}`,
    stationId: ["ev-seed-omr", "ev-seed-velachery", "ev-seed-tnagar"][i % 3],
    connectorId: i % 2 === 0 ? "c-omr-ccs" : undefined,
    reason:
      i % 3 === 0
        ? "charger_offline"
        : i % 3 === 1
          ? "station_offline"
          : "power_dip",
    openedAt: opened.toISOString(),
    closedAt: i === 0 ? undefined : closed.toISOString(),
    durationMinutes: i === 0 ? 45 : durationMinutes,
    penalty: durationMinutes > 240 ? 4500 + i * 500 : 0,
  };
});

const SEED_NOTICES: OperatorNotice[] = [
  {
    id: "on-1",
    severity: "critical",
    title: "CCS gun offline at OMR — 45 min",
    body: "3 confirmed reservations impacted. Payments held pending resolution.",
    stationId: "ev-seed-omr",
    createdAt: days(0, 15),
    read: false,
  },
  {
    id: "on-2",
    severity: "warning",
    title: "Payout scheduled for Sat 08:00",
    body: "Estimated ₹1.08L net after platform fee + tax pass-through.",
    createdAt: days(0, 8),
    read: false,
  },
  {
    id: "on-3",
    severity: "warning",
    title: "Firmware 4.2.0-beta failed on T-Nagar",
    body: "Rolled back to 4.0.2. See Firmware & OTA for retry.",
    stationId: "ev-seed-tnagar",
    createdAt: days(2, 12),
    read: false,
  },
  {
    id: "on-4",
    severity: "info",
    title: "Roaming: new partner request — Borderline Charge (SG)",
    body: "Review terms in Roaming Partners.",
    createdAt: days(1, 11),
    read: true,
  },
  {
    id: "on-5",
    severity: "info",
    title: "Utilization above 80% at OMR for 4 hours",
    body: "Surge pricing rule triggered.",
    stationId: "ev-seed-omr",
    createdAt: days(0, 20),
    read: true,
  },
];

function seeded<T>(key: string, seed: T): T {
  const existing = readJson<T | null>(key, null);
  if (existing !== null && existing !== undefined) return existing;
  writeJson(key, seed);
  return seed;
}

// ---------- Pricing ----------

export async function listPricingRules(): Promise<PricingRule[]> {
  return seeded(K.pricing, SEED_PRICING);
}

export async function upsertPricingRule(rule: PricingRule): Promise<PricingRule> {
  const list = await listPricingRules();
  const idx = list.findIndex((r) => r.id === rule.id);
  if (idx === -1) list.unshift(rule);
  else list[idx] = rule;
  writeJson(K.pricing, list);
  return rule;
}

export async function togglePricingRule(id: string): Promise<PricingRule | null> {
  const list = await listPricingRules();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], active: !list[idx].active };
  writeJson(K.pricing, list);
  return list[idx];
}

export async function deletePricingRule(id: string): Promise<boolean> {
  const list = await listPricingRules();
  const next = list.filter((r) => r.id !== id);
  writeJson(K.pricing, next);
  return next.length !== list.length;
}

// ---------- Maintenance ----------

export async function listMaintenanceOrders(): Promise<MaintenanceWorkOrder[]> {
  return seeded(K.maintenance, SEED_MAINT);
}

export async function createMaintenanceOrder(input: {
  stationId: string;
  connectorId?: string;
  issue: string;
  severity: MaintenanceWorkOrder["severity"];
}): Promise<MaintenanceWorkOrder> {
  const list = await listMaintenanceOrders();
  const rec: MaintenanceWorkOrder = {
    id: makeId("mwo"),
    stationId: input.stationId,
    connectorId: input.connectorId,
    issue: input.issue,
    severity: input.severity,
    status: "open",
    openedAt: now(),
    partsUsed: [],
    slaMinutes: 240,
  };
  list.unshift(rec);
  writeJson(K.maintenance, list);
  return rec;
}

export async function advanceMaintenance(
  id: string,
  status: MaintenanceWorkOrder["status"],
): Promise<MaintenanceWorkOrder | null> {
  const list = await listMaintenanceOrders();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    status,
    resolvedAt: status === "resolved" ? now() : list[idx].resolvedAt,
  };
  writeJson(K.maintenance, list);
  return list[idx];
}

// ---------- Firmware ----------

export async function listFirmwareBundles(): Promise<FirmwareBundle[]> {
  return seeded(K.firmwareBundles, SEED_BUNDLES);
}

export async function listFirmwareJobs(): Promise<FirmwareJob[]> {
  return seeded(K.firmwareJobs, SEED_JOBS);
}

export async function queueFirmwareJob(input: {
  stationId: string;
  bundleId: string;
}): Promise<FirmwareJob> {
  const list = await listFirmwareJobs();
  const rec: FirmwareJob = {
    id: makeId("fwj"),
    stationId: input.stationId,
    bundleId: input.bundleId,
    status: "queued",
    progressPct: 0,
    startedAt: now(),
  };
  list.unshift(rec);
  writeJson(K.firmwareJobs, list);
  return rec;
}

/**
 * Tick firmware jobs: promote `queued` → `in_progress`, advance each
 * `in_progress` job by ~10-20% until 100% then mark `installed`.
 * Persists to storage and returns whether anything changed.
 */
export async function advanceFirmwareJobs(): Promise<boolean> {
  const list = await listFirmwareJobs();
  let changed = false;
  const next = list.map((j) => {
    if (j.status === "queued") {
      changed = true;
      return {
        ...j,
        status: "in_progress" as const,
        progressPct: 5,
        startedAt: j.startedAt ?? now(),
      };
    }
    if (j.status === "in_progress") {
      const step = 10 + Math.floor(Math.random() * 11); // 10..20
      const nextPct = Math.min(100, j.progressPct + step);
      if (nextPct >= 100) {
        changed = true;
        return {
          ...j,
          status: "installed" as const,
          progressPct: 100,
          finishedAt: now(),
        };
      }
      changed = true;
      return { ...j, progressPct: nextPct };
    }
    return j;
  });
  if (changed) writeJson(K.firmwareJobs, next);
  return changed;
}

// ---------- Payouts ----------

export async function listPayouts(): Promise<OperatorPayout[]> {
  return seeded(K.payouts, SEED_PAYOUTS);
}

// ---------- Roaming ----------

export async function listRoamingPartners(): Promise<RoamingPartner[]> {
  return seeded(K.roamingPartners, SEED_PARTNERS);
}

export async function listRoamingEntries(): Promise<RoamingEntry[]> {
  return seeded(K.roamingEntries, SEED_ROAM_ENTRIES);
}

// ---------- SLA ----------

export async function listSlaIncidents(): Promise<SlaIncident[]> {
  return seeded(K.sla, SEED_SLA);
}

// ---------- Notices ----------

export async function listOperatorNotices(): Promise<OperatorNotice[]> {
  return seeded(K.notices, SEED_NOTICES);
}

export async function markOperatorNoticeRead(id: string): Promise<OperatorNotice | null> {
  const list = await listOperatorNotices();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], read: true };
  writeJson(K.notices, list);
  return list[idx];
}

export async function markAllOperatorNoticesRead(): Promise<OperatorNotice[]> {
  const list = await listOperatorNotices();
  const next = list.map((n) => ({ ...n, read: true }));
  writeJson(K.notices, next);
  return next;
}
