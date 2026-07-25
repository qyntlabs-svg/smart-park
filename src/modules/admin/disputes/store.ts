// A-06 Admin Disputes — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import { pushAdminNotification, pushNotification } from "@/shared/lib/notifications";
import type { AdminDispute, AdminDisputeStatus } from "./types";

const KEY = "adminDisputes";
const dayMs = 86_400_000;

const SEED: AdminDispute[] = [
  {
    id: "ad_1",
    ref: "BK-8412",
    consumerName: "Priya S.",
    consumerPhone: "+91 98765 12340",
    providerName: "Anand Motors — T Nagar",
    providerKind: "parking",
    amount: 240,
    reason: "Overcharge — parked less than a hour",
    status: "under_review",
    openedAt: new Date(Date.now() - dayMs * 3).toISOString(),
    slaBreached: false,
    transcript: [
      { from: "consumer", text: "Charged ₹240 for 45 min stay.", at: new Date(Date.now() - dayMs * 3).toISOString() },
      { from: "vendor", text: "Meter shows 2h. Sharing CCTV.", at: new Date(Date.now() - dayMs * 2).toISOString() },
    ],
  },
  {
    id: "ad_2",
    ref: "BK-8390",
    consumerName: "Rahul K.",
    consumerPhone: "+91 98765 12341",
    providerName: "GreenCharge Hub — OMR",
    providerKind: "ev",
    amount: 180,
    reason: "Session incomplete — charger tripped",
    status: "open",
    openedAt: new Date(Date.now() - dayMs).toISOString(),
    slaBreached: true,
    transcript: [
      { from: "consumer", text: "Charger stopped after 5 min but I was charged full.", at: new Date(Date.now() - dayMs).toISOString() },
    ],
  },
  {
    id: "ad_3",
    ref: "BK-8102",
    consumerName: "Arjun P.",
    consumerPhone: "+91 98765 12343",
    providerName: "Adyar Bay Rental",
    providerKind: "rental",
    amount: 12500,
    reason: "Water damage during monsoon rental",
    status: "resolved_refunded",
    openedAt: new Date(Date.now() - dayMs * 8).toISOString(),
    transcript: [
      { from: "consumer", text: "Rain flooded the parking lot.", at: new Date(Date.now() - dayMs * 8).toISOString() },
      { from: "admin", text: "Approved refund based on video evidence.", at: new Date(Date.now() - dayMs * 6).toISOString() },
    ],
  },
];

function load(): AdminDispute[] {
  const existing = readJson<AdminDispute[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: AdminDispute[]) {
  writeJson(KEY, list);
}

export async function listAdminDisputes(
  status?: AdminDisputeStatus,
): Promise<AdminDispute[]> {
  return load()
    .filter((d) => (status ? d.status === status : true))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

/**
 * Simulate a new dispute reaching the admin queue. Fires an admin notification
 * so the A-06 disputes tab reflects the update in real time.
 */
export async function openAdminDispute(
  input: Omit<AdminDispute, "id" | "status" | "openedAt" | "transcript"> & {
    initialMessage?: string;
  },
): Promise<AdminDispute> {
  const list = load();
  const now = new Date().toISOString();
  const dispute: AdminDispute = {
    id: `ad_${Date.now().toString(36)}`,
    ...input,
    status: "open",
    openedAt: now,
    transcript: input.initialMessage
      ? [{ from: "consumer", text: input.initialMessage, at: now }]
      : [],
  };
  list.unshift(dispute);
  save(list);
  pushAdminNotification({
    title: "New dispute opened",
    body: `${dispute.ref} · ₹${dispute.amount} · ${dispute.reason}`,
  });
  return dispute;
}

export async function resolveAdminDispute(input: {
  id: string;
  reviewer: string;
  outcome: "refund" | "deny";
  note: string;
}): Promise<AdminDispute | null> {
  const list = load();
  const idx = list.findIndex((d) => d.id === input.id);
  if (idx === -1) return null;
  const status: AdminDisputeStatus =
    input.outcome === "refund" ? "resolved_refunded" : "resolved_denied";
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status,
    transcript: [
      ...list[idx].transcript,
      {
        from: "admin",
        text:
          input.outcome === "refund"
            ? `Refund of ₹${list[idx].amount} approved. ${input.note}`
            : `Refund denied. ${input.note}`,
        at: now,
      },
    ],
  };
  save(list);
  pushNotification({
    audience: "consumer",
    audienceId: list[idx].consumerPhone,
    title: input.outcome === "refund" ? "Refund approved" : "Refund denied",
    body: input.note,
  });
  pushNotification({
    audience: "vendor",
    audienceId: list[idx].providerName,
    title: "Dispute resolved by admin",
    body: `${list[idx].ref}: ${status}`,
  });
  return list[idx];
}
