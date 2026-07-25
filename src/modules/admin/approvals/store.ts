// A-03 Provider Approvals — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import { pushAdminNotification, pushNotification } from "@/shared/lib/notifications";
import type { KycStatus, ProviderApplication } from "./types";

const KEY = "adminProviderApplications";
const dayMs = 86_400_000;

const now = Date.now();

const SEED: ProviderApplication[] = [
  {
    id: "app_1",
    businessName: "Anand Motors — T Nagar",
    ownerName: "Suresh Anand",
    phone: "+91 98765 30001",
    email: "suresh@anandmotors.in",
    kind: "parking",
    city: "Chennai",
    address: "12, Panagal Park, T Nagar",
    gstin: "33AAACS1429P1ZW",
    submittedAt: new Date(now - dayMs * 2).toISOString(),
    status: "pending",
    documents: [
      { id: "d1", label: "PAN", fileUrl: "#", uploadedAt: new Date(now - dayMs * 2).toISOString() },
      { id: "d2", label: "GST Cert", fileUrl: "#", uploadedAt: new Date(now - dayMs * 2).toISOString() },
      { id: "d3", label: "Address proof", fileUrl: "#", uploadedAt: new Date(now - dayMs * 2).toISOString() },
    ],
    history: [
      { at: new Date(now - dayMs * 2).toISOString(), by: "system", action: "Application submitted" },
    ],
  },
  {
    id: "app_2",
    businessName: "GreenCharge Hub — OMR",
    ownerName: "Priya Iyer",
    phone: "+91 98765 30002",
    email: "priya@greencharge.in",
    kind: "ev",
    city: "Chennai",
    address: "OMR, Sholinganallur",
    gstin: "33GCHUB1234P1Z1",
    submittedAt: new Date(now - dayMs).toISOString(),
    status: "under_review",
    documents: [
      { id: "d1", label: "PAN", fileUrl: "#", uploadedAt: new Date(now - dayMs).toISOString() },
      { id: "d2", label: "Company registration", fileUrl: "#", uploadedAt: new Date(now - dayMs).toISOString() },
    ],
    reviewer: "ops-01",
    history: [
      { at: new Date(now - dayMs).toISOString(), by: "system", action: "Application submitted" },
      { at: new Date(now - 3600_000 * 6).toISOString(), by: "ops-01", action: "Started review" },
    ],
  },
  {
    id: "app_3",
    businessName: "Adyar Bay Rental",
    ownerName: "Ravi Menon",
    phone: "+91 98765 30003",
    email: "ravi@adyarbay.in",
    kind: "rental",
    city: "Chennai",
    address: "Adyar",
    submittedAt: new Date(now - dayMs * 5).toISOString(),
    status: "pending",
    documents: [
      { id: "d1", label: "PAN", fileUrl: "#", uploadedAt: new Date(now - dayMs * 5).toISOString() },
    ],
    history: [
      { at: new Date(now - dayMs * 5).toISOString(), by: "system", action: "Application submitted" },
    ],
  },
  {
    id: "app_4",
    businessName: "AutoMech Deepa",
    ownerName: "Deepa Rao",
    phone: "+91 98765 30004",
    email: "deepa@automechdeepa.in",
    kind: "mechanic",
    city: "Chennai",
    address: "Velachery",
    submittedAt: new Date(now - dayMs * 8).toISOString(),
    status: "approved",
    documents: [
      { id: "d1", label: "PAN", fileUrl: "#", uploadedAt: new Date(now - dayMs * 8).toISOString() },
      { id: "d2", label: "Trade license", fileUrl: "#", uploadedAt: new Date(now - dayMs * 8).toISOString() },
    ],
    reviewer: "ops-01",
    history: [
      { at: new Date(now - dayMs * 8).toISOString(), by: "system", action: "Application submitted" },
      { at: new Date(now - dayMs * 6).toISOString(), by: "ops-01", action: "Approved" },
    ],
  },
  {
    id: "app_5",
    businessName: "TowExpress Chennai",
    ownerName: "Karthik R.",
    phone: "+91 98765 30005",
    email: "karthik@towexpress.in",
    kind: "tow",
    city: "Chennai",
    address: "Nungambakkam",
    submittedAt: new Date(now - dayMs * 10).toISOString(),
    status: "rejected",
    documents: [
      { id: "d1", label: "PAN", fileUrl: "#", uploadedAt: new Date(now - dayMs * 10).toISOString() },
    ],
    reviewer: "ops-02",
    rejectionReason: "Insurance certificate missing.",
    history: [
      { at: new Date(now - dayMs * 10).toISOString(), by: "system", action: "Application submitted" },
      { at: new Date(now - dayMs * 9).toISOString(), by: "ops-02", action: "Rejected", note: "Insurance certificate missing." },
    ],
  },
];

function load(): ProviderApplication[] {
  const existing = readJson<ProviderApplication[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: ProviderApplication[]) {
  writeJson(KEY, list);
}

export async function listApplications(
  filter?: KycStatus,
): Promise<ProviderApplication[]> {
  return load()
    .filter((a) => (filter ? a.status === filter : true))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function approveApplication(
  id: string,
  reviewer: string,
): Promise<ProviderApplication | null> {
  const list = load();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status: "approved",
    reviewer,
    history: [
      ...list[idx].history,
      { at: now, by: reviewer, action: "Approved" },
    ],
  };
  save(list);
  pushNotification({
    audience: "vendor",
    audienceId: list[idx].id,
    title: "Your application is approved",
    body: `Welcome to SmartPark, ${list[idx].businessName}! You can now publish listings.`,
  });
  return list[idx];
}

export async function rejectApplication(
  id: string,
  reviewer: string,
  reason: string,
): Promise<ProviderApplication | null> {
  const list = load();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status: "rejected",
    reviewer,
    rejectionReason: reason,
    history: [
      ...list[idx].history,
      { at: now, by: reviewer, action: "Rejected", note: reason },
    ],
  };
  save(list);
  pushNotification({
    audience: "vendor",
    audienceId: list[idx].id,
    title: "Application rejected",
    body: reason,
  });
  return list[idx];
}

export async function claimApplication(
  id: string,
  reviewer: string,
): Promise<ProviderApplication | null> {
  const list = load();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status: "under_review",
    reviewer,
    history: [
      ...list[idx].history,
      { at: now, by: reviewer, action: "Started review" },
    ],
  };
  save(list);
  return list[idx];
}

/**
 * Simulate a new provider registration hitting the approvals queue. Fires an
 * admin notification so the A-03 approvals tab reflects the update in real
 * time. Also creates the pending application record.
 */
export async function submitProviderApplication(
  input: Omit<ProviderApplication, "id" | "status" | "history" | "submittedAt">,
): Promise<ProviderApplication> {
  const list = load();
  const now = new Date().toISOString();
  const app: ProviderApplication = {
    ...input,
    id: `app_${Date.now().toString(36)}`,
    status: "pending",
    submittedAt: now,
    history: [{ at: now, by: "system", action: "Application submitted" }],
  };
  list.unshift(app);
  save(list);
  pushAdminNotification({
    title: "New provider awaiting KYC review",
    body: `${app.businessName} (${app.kind}) — ${app.city}`,
  });
  return app;
}
