// V-21 Staff — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";
import type { StaffMember, StaffRole, StaffStatus } from "./types";

const KEY = "partnerStaff";

const SEED = (partnerId: string): StaffMember[] => [
  {
    id: "st_seed_1",
    partnerId,
    facilityId: "fac_main",
    facilityName: "T Nagar — Main lot",
    name: "Suresh K.",
    phone: "+91 98765 00011",
    role: "attendant",
    status: "active",
    invitedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    activatedAt: new Date(Date.now() - 29 * 86400000).toISOString(),
    lastActiveAt: new Date(Date.now() - 30 * 60000).toISOString(),
    scansToday: 42,
  },
  {
    id: "st_seed_2",
    partnerId,
    facilityId: "fac_main",
    facilityName: "T Nagar — Main lot",
    name: "Ravi M.",
    phone: "+91 98765 00012",
    role: "supervisor",
    status: "active",
    invitedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    activatedAt: new Date(Date.now() - 44 * 86400000).toISOString(),
    lastActiveAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    scansToday: 18,
  },
  {
    id: "st_seed_3",
    partnerId,
    facilityId: "fac_omr",
    facilityName: "EV FastCharge — OMR",
    name: "Deepa S.",
    phone: "+91 98765 00013",
    role: "attendant",
    status: "invited",
    invitedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    scansToday: 0,
  },
];

function load(partnerId: string): StaffMember[] {
  const key = `${KEY}:${partnerId}`;
  const existing = readJson<StaffMember[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED(partnerId);
  writeJson(key, seed);
  return seed;
}

function save(partnerId: string, list: StaffMember[]) {
  writeJson(`${KEY}:${partnerId}`, list);
}

export async function listStaff(partnerId: string): Promise<StaffMember[]> {
  return load(partnerId).sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
}

export async function inviteStaff(input: {
  partnerId: string;
  name: string;
  phone: string;
  role: StaffRole;
  facilityId: string;
  facilityName: string;
}): Promise<StaffMember> {
  const list = load(input.partnerId);
  const staff: StaffMember = {
    id: makeId("st"),
    partnerId: input.partnerId,
    facilityId: input.facilityId,
    facilityName: input.facilityName,
    name: input.name,
    phone: input.phone,
    role: input.role,
    status: "invited",
    invitedAt: new Date().toISOString(),
    scansToday: 0,
  };
  list.unshift(staff);
  save(input.partnerId, list);
  pushNotification({
    audience: "vendor",
    audienceId: input.partnerId,
    title: "Staff invited",
    body: `${staff.name} was invited to ${staff.facilityName}.`,
  });
  return staff;
}

export async function updateStaffStatus(
  partnerId: string,
  staffId: string,
  status: StaffStatus,
): Promise<StaffMember | null> {
  const list = load(partnerId);
  const idx = list.findIndex((s) => s.id === staffId);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    status,
    activatedAt:
      status === "active" && !list[idx].activatedAt
        ? new Date().toISOString()
        : list[idx].activatedAt,
  };
  save(partnerId, list);
  return list[idx];
}

export async function revokeStaff(
  partnerId: string,
  staffId: string,
): Promise<boolean> {
  const list = load(partnerId);
  const next = list.filter((s) => s.id !== staffId);
  if (next.length === list.length) return false;
  save(partnerId, next);
  return true;
}
