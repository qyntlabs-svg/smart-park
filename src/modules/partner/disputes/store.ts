// V-19 Disputes — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";
import type { Dispute, DisputeStatus } from "./types";

const KEY = "partnerDisputes";
const dayMs = 86_400_000;

const SEED = (partnerId: string): Dispute[] => {
  const now = Date.now();
  return [
    {
      id: "d_seed_1",
      partnerId,
      consumerName: "Priya S.",
      consumerPhone: "+91 98765 12340",
      bookingRef: "BK-8412",
      amount: 240,
      reason: "overcharge",
      status: "awaiting_vendor",
      openedAt: new Date(now - dayMs * 1).toISOString(),
      slaHours: 48,
      messages: [
        {
          id: "m1",
          from: "consumer",
          text: "I was charged ₹240 for 2 hours but I left in 45 minutes. Please refund the difference.",
          createdAt: new Date(now - dayMs).toISOString(),
        },
      ],
    },
    {
      id: "d_seed_2",
      partnerId,
      consumerName: "Rahul K.",
      consumerPhone: "+91 98765 12341",
      bookingRef: "BK-8390",
      amount: 180,
      reason: "session_incomplete",
      status: "open",
      openedAt: new Date(now - 6 * 3600_000).toISOString(),
      slaHours: 48,
      messages: [
        {
          id: "m1",
          from: "consumer",
          text: "Charger stopped mid-session. Please refund.",
          createdAt: new Date(now - 6 * 3600_000).toISOString(),
        },
      ],
    },
    {
      id: "d_seed_3",
      partnerId,
      consumerName: "Meera N.",
      consumerPhone: "+91 98765 12342",
      bookingRef: "BK-8221",
      amount: 340,
      reason: "damage",
      status: "under_review",
      openedAt: new Date(now - dayMs * 4).toISOString(),
      slaHours: 48,
      messages: [
        {
          id: "m1",
          from: "consumer",
          text: "Scratch on my bumper from your gate.",
          createdAt: new Date(now - dayMs * 4).toISOString(),
        },
        {
          id: "m2",
          from: "vendor",
          text: "Sharing CCTV footage with admin for review.",
          createdAt: new Date(now - dayMs * 3).toISOString(),
        },
      ],
    },
    {
      id: "d_seed_4",
      partnerId,
      consumerName: "Arjun P.",
      consumerPhone: "+91 98765 12343",
      bookingRef: "BK-8102",
      amount: 120,
      reason: "no_show",
      status: "resolved_denied",
      openedAt: new Date(now - dayMs * 12).toISOString(),
      slaHours: 48,
      messages: [
        {
          id: "m1",
          from: "consumer",
          text: "I did not book this — please refund.",
          createdAt: new Date(now - dayMs * 12).toISOString(),
        },
        {
          id: "m2",
          from: "vendor",
          text: "OTP was verified at gate. Denying refund.",
          createdAt: new Date(now - dayMs * 11).toISOString(),
        },
      ],
    },
  ];
};

function load(partnerId: string): Dispute[] {
  const key = `${KEY}:${partnerId}`;
  const existing = readJson<Dispute[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED(partnerId);
  writeJson(key, seed);
  return seed;
}

function save(partnerId: string, list: Dispute[]) {
  writeJson(`${KEY}:${partnerId}`, list);
}

export async function listDisputes(partnerId: string): Promise<Dispute[]> {
  return load(partnerId).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

export async function respondToDispute(input: {
  partnerId: string;
  disputeId: string;
  text: string;
}): Promise<Dispute | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((d) => d.id === input.disputeId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status: "under_review",
    messages: [
      ...list[idx].messages,
      { id: makeId("m"), from: "vendor", text: input.text, createdAt: now },
    ],
  };
  save(input.partnerId, list);
  pushNotification({
    audience: "consumer",
    audienceId: list[idx].consumerPhone,
    title: "Vendor responded",
    body: `Dispute on ${list[idx].bookingRef}: vendor replied.`,
  });
  return list[idx];
}

export async function resolveDispute(input: {
  partnerId: string;
  disputeId: string;
  outcome: "refund" | "deny";
  note?: string;
}): Promise<Dispute | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((d) => d.id === input.disputeId);
  if (idx === -1) return null;
  const status: DisputeStatus =
    input.outcome === "refund" ? "resolved_refunded" : "resolved_denied";
  const now = new Date().toISOString();
  const text =
    input.outcome === "refund"
      ? `Refund of ₹${list[idx].amount} approved. ${input.note ?? ""}`.trim()
      : `Refund denied. ${input.note ?? ""}`.trim();
  list[idx] = {
    ...list[idx],
    status,
    messages: [
      ...list[idx].messages,
      { id: makeId("m"), from: "vendor", text, createdAt: now },
    ],
  };
  save(input.partnerId, list);
  pushNotification({
    audience: "consumer",
    audienceId: list[idx].consumerPhone,
    title:
      input.outcome === "refund"
        ? "Refund approved"
        : "Refund denied",
    body: text,
  });
  return list[idx];
}
