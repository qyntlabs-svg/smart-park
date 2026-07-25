// V-17 Payouts — localStorage-backed mock store.
// Swap readJson/writeJson for axios calls to /partner/payouts when backend ships.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";
import type { Payout, PayoutAccount, PayoutSchedule } from "./types";

const ACCOUNTS_KEY = "partnerPayoutAccounts";
const PAYOUTS_KEY = "partnerPayouts";

const SEED_ACCOUNT = (partnerId: string): PayoutAccount => ({
  partnerId,
  method: "upi",
  upiVpa: "vendor@okhdfcbank",
  bankAccountLast4: "4821",
  bankIfsc: "HDFC0001234",
  bankName: "HDFC Bank",
  holderName: "SmartPark Vendor Pvt Ltd",
  verified: true,
  schedule: "weekly",
  minBalance: 500,
  updatedAt: new Date().toISOString(),
});

const SEED_PAYOUTS = (partnerId: string): Payout[] => {
  const now = Date.now();
  const dayMs = 86_400_000;
  return [
    {
      id: "po_seed_1",
      partnerId,
      amount: 12480,
      fee: 62,
      net: 12418,
      currency: "INR",
      status: "paid",
      method: "upi",
      reference: "UPI7291F",
      scheduledFor: new Date(now - dayMs * 7).toISOString(),
      paidAt: new Date(now - dayMs * 7 + 3600000).toISOString(),
      periodStart: new Date(now - dayMs * 14).toISOString(),
      periodEnd: new Date(now - dayMs * 8).toISOString(),
    },
    {
      id: "po_seed_2",
      partnerId,
      amount: 9820,
      fee: 49,
      net: 9771,
      currency: "INR",
      status: "paid",
      method: "upi",
      reference: "UPI6182A",
      scheduledFor: new Date(now - dayMs * 14).toISOString(),
      paidAt: new Date(now - dayMs * 14 + 3600000).toISOString(),
      periodStart: new Date(now - dayMs * 21).toISOString(),
      periodEnd: new Date(now - dayMs * 15).toISOString(),
    },
    {
      id: "po_seed_3",
      partnerId,
      amount: 4310,
      fee: 21,
      net: 4289,
      currency: "INR",
      status: "in_transit",
      method: "upi",
      reference: "UPI9124C",
      scheduledFor: new Date(now - dayMs).toISOString(),
      periodStart: new Date(now - dayMs * 7).toISOString(),
      periodEnd: new Date(now - dayMs).toISOString(),
    },
    {
      id: "po_seed_4",
      partnerId,
      amount: 2865,
      fee: 14,
      net: 2851,
      currency: "INR",
      status: "pending",
      method: "upi",
      reference: "UPI-PEND",
      scheduledFor: new Date(now + dayMs * 3).toISOString(),
      periodStart: new Date(now).toISOString(),
      periodEnd: new Date(now + dayMs * 3).toISOString(),
    },
  ];
};

function loadAccount(partnerId: string): PayoutAccount {
  const all = readJson<Record<string, PayoutAccount>>(ACCOUNTS_KEY, {});
  if (all[partnerId]) return all[partnerId];
  all[partnerId] = SEED_ACCOUNT(partnerId);
  writeJson(ACCOUNTS_KEY, all);
  return all[partnerId];
}

function saveAccount(acc: PayoutAccount): PayoutAccount {
  const all = readJson<Record<string, PayoutAccount>>(ACCOUNTS_KEY, {});
  all[acc.partnerId] = { ...acc, updatedAt: new Date().toISOString() };
  writeJson(ACCOUNTS_KEY, all);
  return all[acc.partnerId];
}

function loadPayouts(partnerId: string): Payout[] {
  const key = `${PAYOUTS_KEY}:${partnerId}`;
  const existing = readJson<Payout[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED_PAYOUTS(partnerId);
  writeJson(key, seed);
  return seed;
}

function savePayouts(partnerId: string, list: Payout[]) {
  writeJson(`${PAYOUTS_KEY}:${partnerId}`, list);
}

export async function getPayoutAccount(partnerId: string): Promise<PayoutAccount> {
  return loadAccount(partnerId);
}

export async function updatePayoutAccount(
  partnerId: string,
  patch: Partial<PayoutAccount>,
): Promise<PayoutAccount> {
  const acc = loadAccount(partnerId);
  return saveAccount({ ...acc, ...patch });
}

export async function updatePayoutSchedule(
  partnerId: string,
  schedule: PayoutSchedule,
): Promise<PayoutAccount> {
  return updatePayoutAccount(partnerId, { schedule });
}

export async function listPayouts(partnerId: string): Promise<Payout[]> {
  return loadPayouts(partnerId).sort((a, b) =>
    b.scheduledFor.localeCompare(a.scheduledFor),
  );
}

export async function requestManualPayout(partnerId: string): Promise<Payout> {
  const list = loadPayouts(partnerId);
  const now = new Date();
  const p: Payout = {
    id: makeId("po"),
    partnerId,
    amount: 2865,
    fee: 14,
    net: 2851,
    currency: "INR",
    status: "pending",
    method: loadAccount(partnerId).method,
    reference: "MANUAL",
    scheduledFor: new Date(now.getTime() + 86_400_000).toISOString(),
    periodStart: new Date(now.getTime() - 86_400_000 * 7).toISOString(),
    periodEnd: now.toISOString(),
  };
  list.unshift(p);
  savePayouts(partnerId, list);
  pushNotification({
    audience: "vendor",
    audienceId: partnerId,
    title: "Payout requested",
    body: `Manual payout of ₹${p.net.toLocaleString()} scheduled for tomorrow.`,
  });
  return p;
}
