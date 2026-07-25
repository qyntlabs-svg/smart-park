// Social mock store (C-51 referrals, C-55 family sharing).

import { makeId, readJson, writeJson } from "@/shared/lib/storage";
import type {
  FamilyMember,
  FamilyState,
  InvitedFriend,
  ReferralState,
} from "./types";

const REFERRAL_KEY = "consumerReferralState";
const FAMILY_KEY = "consumerFamilyState";

// ---- Referrals ----

function seedReferralCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `SP-${s}`;
}

const SEED_REFERRAL: ReferralState = {
  code: seedReferralCode(),
  totalCredits: 350,
  pendingCredits: 100,
  invitedFriends: [
    {
      id: "inv-seed-1",
      name: "Nikhil R.",
      status: "credited",
      invitedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      joinedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      creditsEarned: 150,
    },
    {
      id: "inv-seed-2",
      name: "Divya S.",
      status: "credited",
      invitedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      joinedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      creditsEarned: 100,
    },
    {
      id: "inv-seed-3",
      name: "Ravi K.",
      status: "joined",
      invitedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      joinedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      creditsEarned: 100,
    },
  ],
};

export async function getReferralState(): Promise<ReferralState> {
  const existing = readJson<ReferralState | null>(REFERRAL_KEY, null);
  if (existing) return existing;
  writeJson(REFERRAL_KEY, SEED_REFERRAL);
  return SEED_REFERRAL;
}

export async function addInvitedFriend(input: {
  name: string;
  phone?: string;
}): Promise<ReferralState> {
  const state = await getReferralState();
  const friend: InvitedFriend = {
    id: makeId("inv"),
    name: input.name,
    phone: input.phone,
    status: "invited",
    invitedAt: new Date().toISOString(),
    creditsEarned: 0,
  };
  const next: ReferralState = {
    ...state,
    invitedFriends: [friend, ...state.invitedFriends],
  };
  writeJson(REFERRAL_KEY, next);
  return next;
}

// ---- Family ----

const SEED_FAMILY: FamilyState = {
  sharedWallet: true,
  members: [
    {
      id: "fam-seed-1",
      name: "Priya",
      relationship: "Spouse",
      phone: "+91 98765 40001",
      status: "active",
      invitedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      joinedAt: new Date(Date.now() - 86400000 * 29).toISOString(),
      vehicleAccess: [],
      walletAccess: true,
    },
    {
      id: "fam-seed-2",
      name: "Dad",
      relationship: "Parent",
      phone: "+91 98765 40002",
      status: "invited",
      invitedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      vehicleAccess: [],
      walletAccess: false,
    },
  ],
};

export async function getFamilyState(): Promise<FamilyState> {
  const existing = readJson<FamilyState | null>(FAMILY_KEY, null);
  if (existing) return existing;
  writeJson(FAMILY_KEY, SEED_FAMILY);
  return SEED_FAMILY;
}

export async function inviteFamilyMember(input: {
  name: string;
  phone?: string;
  relationship?: string;
  walletAccess?: boolean;
}): Promise<FamilyState> {
  const state = await getFamilyState();
  const member: FamilyMember = {
    id: makeId("fam"),
    name: input.name,
    phone: input.phone,
    relationship: input.relationship,
    status: "invited",
    invitedAt: new Date().toISOString(),
    vehicleAccess: [],
    walletAccess: !!input.walletAccess,
  };
  const next: FamilyState = {
    ...state,
    members: [member, ...state.members],
  };
  writeJson(FAMILY_KEY, next);
  return next;
}

export async function removeFamilyMember(id: string): Promise<FamilyState> {
  const state = await getFamilyState();
  const next: FamilyState = {
    ...state,
    members: state.members.map((m) =>
      m.id === id ? { ...m, status: "removed" } : m,
    ),
  };
  writeJson(FAMILY_KEY, next);
  return next;
}

export async function setSharedWallet(enabled: boolean): Promise<FamilyState> {
  const state = await getFamilyState();
  const next: FamilyState = { ...state, sharedWallet: enabled };
  writeJson(FAMILY_KEY, next);
  return next;
}

export async function toggleMemberWalletAccess(
  id: string,
): Promise<FamilyState> {
  const state = await getFamilyState();
  const next: FamilyState = {
    ...state,
    members: state.members.map((m) =>
      m.id === id ? { ...m, walletAccess: !m.walletAccess } : m,
    ),
  };
  writeJson(FAMILY_KEY, next);
  return next;
}
