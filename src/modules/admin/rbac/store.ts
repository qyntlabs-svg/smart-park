// A-14 Admin RBAC — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type { AdminRole, AdminUser } from "./types";

const KEY = "adminUsers";
const dayMs = 86_400_000;

const SEED: AdminUser[] = [
  { id: "super-admin", name: "Divya Ramesh", email: "divya@smartpark.io", phone: "+91 98765 90000", role: "super_admin", createdAt: new Date(Date.now() - 400 * dayMs).toISOString(), lastLoginAt: new Date().toISOString(), status: "active" },
  { id: "ops-01", name: "Karthik Iyer", email: "karthik@smartpark.io", phone: "+91 98765 90001", role: "ops", createdAt: new Date(Date.now() - 200 * dayMs).toISOString(), lastLoginAt: new Date(Date.now() - 3600_000).toISOString(), status: "active" },
  { id: "ops-02", name: "Anita R.", email: "anita@smartpark.io", phone: "+91 98765 90002", role: "ops", createdAt: new Date(Date.now() - 90 * dayMs).toISOString(), lastLoginAt: new Date(Date.now() - 3600_000 * 12).toISOString(), status: "active" },
  { id: "finance-01", name: "Mahesh V.", email: "mahesh@smartpark.io", phone: "+91 98765 90003", role: "finance", createdAt: new Date(Date.now() - 180 * dayMs).toISOString(), lastLoginAt: new Date(Date.now() - dayMs).toISOString(), status: "active" },
  { id: "sup-01", name: "Priya B.", email: "priya@smartpark.io", phone: "+91 98765 90004", role: "support", createdAt: new Date(Date.now() - 5 * dayMs).toISOString(), status: "invited" },
];

function load(): AdminUser[] {
  const e = readJson<AdminUser[] | null>(KEY, null);
  if (e) return e;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: AdminUser[]) {
  writeJson(KEY, list);
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  return load().sort((a, b) => a.name.localeCompare(b.name));
}

export async function inviteAdmin(input: {
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
}): Promise<AdminUser> {
  const list = load();
  const user: AdminUser = {
    id: makeId("adm"),
    ...input,
    createdAt: new Date().toISOString(),
    status: "invited",
  };
  list.unshift(user);
  save(list);
  return user;
}

export async function updateAdminRole(
  id: string,
  role: AdminRole,
): Promise<AdminUser | null> {
  const list = load();
  const idx = list.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  if (list[idx].role === "super_admin" && role !== "super_admin") {
    const remaining = list.filter(
      (u) => u.role === "super_admin" && u.id !== id,
    ).length;
    if (remaining === 0) {
      throw new Error("Cannot demote last super admin");
    }
  }
  list[idx] = { ...list[idx], role };
  save(list);
  return list[idx];
}

export async function setAdminStatus(
  id: string,
  status: AdminUser["status"],
): Promise<AdminUser | null> {
  const list = load();
  const idx = list.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status };
  save(list);
  return list[idx];
}

export async function removeAdmin(id: string): Promise<boolean> {
  const list = load();
  const user = list.find((u) => u.id === id);
  if (user?.role === "super_admin") {
    const remaining = list.filter((u) => u.role === "super_admin").length;
    if (remaining <= 1) throw new Error("Cannot remove last super admin");
  }
  const next = list.filter((u) => u.id !== id);
  if (next.length === list.length) return false;
  save(next);
  return true;
}
