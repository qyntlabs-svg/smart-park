// A-08 Incident Board — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import { pushAdminNotification } from "@/shared/lib/notifications";
import type { Incident, IncidentStatus } from "./types";

const KEY = "adminIncidents";
const now = Date.now();
const min = 60_000;
const hr = 3600_000;

const SEED: Incident[] = [
  {
    id: "inc_1",
    title: "OMR Station · CCS 150kW #3 offline",
    kind: "charger_offline",
    severity: "high",
    status: "open",
    provider: "GreenCharge Hub — OMR",
    city: "Chennai",
    openedAt: new Date(now - 45 * min).toISOString(),
    impactUsers: 4,
    timeline: [
      { at: new Date(now - 45 * min).toISOString(), by: "monitor", message: "OCPP heartbeat missing." },
      { at: new Date(now - 30 * min).toISOString(), by: "monitor", message: "4 reservations flagged at_risk." },
    ],
  },
  {
    id: "inc_2",
    title: "Panagal lot closed — waterlogging",
    kind: "facility_closed",
    severity: "med",
    status: "acknowledged",
    provider: "Panagal Multi-lot",
    city: "Chennai",
    openedAt: new Date(now - 3 * hr).toISOString(),
    ackAt: new Date(now - 2 * hr).toISOString(),
    impactUsers: 12,
    ownerName: "ops-01",
    timeline: [
      { at: new Date(now - 3 * hr).toISOString(), by: "vendor", message: "Vendor reported lot closed for the day." },
      { at: new Date(now - 2 * hr).toISOString(), by: "ops-01", message: "Acknowledged; notifying affected consumers." },
    ],
  },
  {
    id: "inc_3",
    title: "Mobile mechanic Ravi — vehicle immobile",
    kind: "worker_stuck",
    severity: "high",
    status: "mitigating",
    provider: "AutoMech Deepa",
    city: "Chennai",
    openedAt: new Date(now - 90 * min).toISOString(),
    ackAt: new Date(now - 75 * min).toISOString(),
    impactUsers: 1,
    ownerName: "ops-02",
    timeline: [
      { at: new Date(now - 90 * min).toISOString(), by: "worker", message: "Bike broke down mid-route." },
      { at: new Date(now - 75 * min).toISOString(), by: "ops-02", message: "Dispatched replacement worker." },
      { at: new Date(now - 30 * min).toISOString(), by: "ops-02", message: "Consumer contacted; ETA 40 min." },
    ],
  },
  {
    id: "inc_4",
    title: "Razorpay success rate < 85%",
    kind: "payment_gateway",
    severity: "critical",
    status: "resolved",
    city: "Global",
    openedAt: new Date(now - 6 * hr).toISOString(),
    ackAt: new Date(now - 5.5 * hr).toISOString(),
    resolvedAt: new Date(now - 4 * hr).toISOString(),
    impactUsers: 82,
    ownerName: "ops-01",
    timeline: [
      { at: new Date(now - 6 * hr).toISOString(), by: "monitor", message: "Success rate dropped to 76%." },
      { at: new Date(now - 4 * hr).toISOString(), by: "ops-01", message: "Failover to UPI intent worked; back to 94%." },
    ],
  },
];

function load(): Incident[] {
  const existing = readJson<Incident[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: Incident[]) {
  writeJson(KEY, list);
}

export async function listIncidents(status?: IncidentStatus): Promise<Incident[]> {
  return load()
    .filter((i) => (status ? i.status === status : true))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

/**
 * Simulate a new incident (charger offline / facility closed / etc.) hitting
 * the admin board. Fires an admin notification and returns the record.
 */
export async function openIncident(
  input: Omit<Incident, "id" | "openedAt" | "timeline" | "status"> & {
    reporterMessage?: string;
  },
): Promise<Incident> {
  const list = load();
  const nowIso = new Date().toISOString();
  const inc: Incident = {
    id: `inc_${Date.now().toString(36)}`,
    ...input,
    status: "open",
    openedAt: nowIso,
    timeline: input.reporterMessage
      ? [{ at: nowIso, by: "monitor", message: input.reporterMessage }]
      : [],
  };
  list.unshift(inc);
  save(list);
  pushAdminNotification({
    title: `Incident · ${inc.severity.toUpperCase()}`,
    body: inc.title,
  });
  return inc;
}

export async function updateIncidentStatus(input: {
  id: string;
  status: IncidentStatus;
  actor: string;
  note: string;
}): Promise<Incident | null> {
  const list = load();
  const idx = list.findIndex((i) => i.id === input.id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const patch: Partial<Incident> = { status: input.status, ownerName: input.actor };
  if (input.status === "acknowledged" && !list[idx].ackAt) patch.ackAt = now;
  if (input.status === "resolved" && !list[idx].resolvedAt) patch.resolvedAt = now;
  list[idx] = {
    ...list[idx],
    ...patch,
    timeline: [
      ...list[idx].timeline,
      { at: now, by: input.actor, message: input.note },
    ],
  };
  save(list);
  return list[idx];
}
