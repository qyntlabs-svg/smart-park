// V-26 Vendor Referral — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type { ReferralInvite, ReferralStats } from "./types";

const KEY = "partnerReferrals";
const STATS_KEY = "partnerReferralStats";

const seedCode = (partnerId: string) =>
  `SP-${partnerId.slice(0, 4).toUpperCase()}-${Math.abs(
    partnerId
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0),
  ).toString(36).slice(0, 3).toUpperCase()}`;

const SEED_STATS = (partnerId: string): ReferralStats => {
  const code = seedCode(partnerId);
  return {
    partnerId,
    code,
    inviteLink: `https://smartpark.app/refer/${code}`,
    credits: 2500,
    totalInvited: 3,
    totalActivated: 1,
    perActivationReward: 2500,
  };
};

const SEED_INVITES = (partnerId: string): ReferralInvite[] => [
  {
    id: "ref_seed_1",
    partnerId,
    refereeName: "Anand Motors",
    refereePhone: "+91 98765 10001",
    status: "activated",
    invitedAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    activatedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    creditAwarded: 2500,
  },
  {
    id: "ref_seed_2",
    partnerId,
    refereeName: "GreenCharge Hub",
    refereePhone: "+91 98765 10002",
    status: "signed_up",
    invitedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    creditAwarded: 0,
  },
  {
    id: "ref_seed_3",
    partnerId,
    refereeName: "Adyar Bay Parking",
    refereePhone: "+91 98765 10003",
    status: "invited",
    invitedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    creditAwarded: 0,
  },
];

function loadStats(partnerId: string): ReferralStats {
  const all = readJson<Record<string, ReferralStats>>(STATS_KEY, {});
  if (all[partnerId]) return all[partnerId];
  all[partnerId] = SEED_STATS(partnerId);
  writeJson(STATS_KEY, all);
  return all[partnerId];
}

function saveStats(stats: ReferralStats) {
  const all = readJson<Record<string, ReferralStats>>(STATS_KEY, {});
  all[stats.partnerId] = stats;
  writeJson(STATS_KEY, all);
}

function loadInvites(partnerId: string): ReferralInvite[] {
  const key = `${KEY}:${partnerId}`;
  const existing = readJson<ReferralInvite[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED_INVITES(partnerId);
  writeJson(key, seed);
  return seed;
}

function saveInvites(partnerId: string, list: ReferralInvite[]) {
  writeJson(`${KEY}:${partnerId}`, list);
}

export async function getReferralStats(partnerId: string): Promise<ReferralStats> {
  return loadStats(partnerId);
}

export async function listReferralInvites(
  partnerId: string,
): Promise<ReferralInvite[]> {
  return loadInvites(partnerId).sort((a, b) =>
    b.invitedAt.localeCompare(a.invitedAt),
  );
}

export async function inviteVendor(input: {
  partnerId: string;
  refereeName: string;
  refereePhone: string;
}): Promise<ReferralInvite> {
  const list = loadInvites(input.partnerId);
  const invite: ReferralInvite = {
    id: makeId("ref"),
    partnerId: input.partnerId,
    refereeName: input.refereeName,
    refereePhone: input.refereePhone,
    status: "invited",
    invitedAt: new Date().toISOString(),
    creditAwarded: 0,
  };
  list.unshift(invite);
  saveInvites(input.partnerId, list);
  const stats = loadStats(input.partnerId);
  saveStats({ ...stats, totalInvited: stats.totalInvited + 1 });
  return invite;
}
