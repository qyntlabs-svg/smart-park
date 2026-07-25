// A-13 Data Exports & Audits — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type {
  ApiKey,
  AuditEntry,
  ExportDataset,
  ExportFormat,
  ExportJob,
} from "./types";

const K_JOBS = "adminExportJobs";
const K_KEYS = "adminApiKeys";
const K_LOG = "adminAuditLog";

const hourMs = 3_600_000;
const now = Date.now();

const SEED_JOBS: ExportJob[] = [
  {
    id: "exp-1",
    dataset: "bookings",
    format: "csv",
    requestedBy: "Karthik Iyer",
    requestedAt: new Date(now - 2 * hourMs).toISOString(),
    status: "ready",
    rows: 24_182,
    downloadUrl: "https://exports.smartpark.io/bookings-2026-07-22.csv",
  },
  {
    id: "exp-2",
    dataset: "payouts",
    format: "csv",
    requestedBy: "Mahesh V.",
    requestedAt: new Date(now - 6 * hourMs).toISOString(),
    status: "ready",
    rows: 4_112,
    downloadUrl: "https://exports.smartpark.io/payouts-2026-07-22.csv",
  },
  {
    id: "exp-3",
    dataset: "consumers",
    format: "json",
    requestedBy: "Anita R.",
    requestedAt: new Date(now - 22 * hourMs).toISOString(),
    status: "ready",
    rows: 88_204,
    downloadUrl: "https://exports.smartpark.io/consumers-2026-07-21.json",
  },
];

const SEED_KEYS: ApiKey[] = [
  {
    id: "key-1",
    label: "Analytics pipeline",
    prefix: "sk_live_9f2c…8a",
    scopes: ["bookings:read", "payouts:read"],
    createdBy: "Divya Ramesh",
    createdAt: new Date(now - 45 * 86_400_000).toISOString(),
    lastUsedAt: new Date(now - 45 * 60_000).toISOString(),
  },
  {
    id: "key-2",
    label: "GST filing agent",
    prefix: "sk_live_a71e…44",
    scopes: ["invoices:read"],
    createdBy: "Mahesh V.",
    createdAt: new Date(now - 12 * 86_400_000).toISOString(),
    lastUsedAt: new Date(now - 4 * hourMs).toISOString(),
  },
];

const SEED_LOG: AuditEntry[] = [
  { id: "aud-1", actor: "Karthik Iyer", action: "APPROVED provider application", entity: "prov_app_442", ip: "103.21.44.10", at: new Date(now - 20 * 60_000).toISOString() },
  { id: "aud-2", actor: "Mahesh V.", action: "RAN payout batch", entity: "payout_batch_2026-07-22", ip: "103.21.44.11", at: new Date(now - 90 * 60_000).toISOString() },
  { id: "aud-3", actor: "Divya Ramesh", action: "CHANGED admin role", entity: "user_admin_02", ip: "103.21.44.12", at: new Date(now - 3 * hourMs).toISOString() },
  { id: "aud-4", actor: "Anita R.", action: "SUSPENDED consumer", entity: "user_c_5813", ip: "103.21.44.13", at: new Date(now - 12 * hourMs).toISOString() },
  { id: "aud-5", actor: "system", action: "AUTO_REFUND on dispute", entity: "disp_2201", ip: "-", at: new Date(now - 20 * hourMs).toISOString() },
];

function loadJobs() {
  const e = readJson<ExportJob[] | null>(K_JOBS, null);
  if (e) return e;
  writeJson(K_JOBS, SEED_JOBS);
  return SEED_JOBS;
}
function saveJobs(list: ExportJob[]) {
  writeJson(K_JOBS, list);
}
function loadKeys() {
  const e = readJson<ApiKey[] | null>(K_KEYS, null);
  if (e) return e;
  writeJson(K_KEYS, SEED_KEYS);
  return SEED_KEYS;
}
function saveKeys(list: ApiKey[]) {
  writeJson(K_KEYS, list);
}
function loadLog() {
  const e = readJson<AuditEntry[] | null>(K_LOG, null);
  if (e) return e;
  writeJson(K_LOG, SEED_LOG);
  return SEED_LOG;
}
function saveLog(list: AuditEntry[]) {
  writeJson(K_LOG, list);
}

function pushAudit(entry: Omit<AuditEntry, "id" | "at">) {
  const list = loadLog();
  list.unshift({ ...entry, id: makeId("aud"), at: new Date().toISOString() });
  saveLog(list.slice(0, 200));
}

export async function listExportJobs(): Promise<ExportJob[]> {
  return loadJobs().sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  );
}

export async function createExportJob(input: {
  dataset: ExportDataset;
  format: ExportFormat;
  requestedBy: string;
}): Promise<ExportJob> {
  const list = loadJobs();
  const job: ExportJob = {
    id: makeId("exp"),
    dataset: input.dataset,
    format: input.format,
    requestedBy: input.requestedBy,
    requestedAt: new Date().toISOString(),
    status: "queued",
  };
  list.unshift(job);
  saveJobs(list);
  pushAudit({
    actor: input.requestedBy,
    action: "REQUESTED export",
    entity: `${input.dataset}.${input.format}`,
    ip: "internal",
  });
  // Simulate async completion.
  setTimeout(() => {
    const cur = loadJobs();
    const idx = cur.findIndex((j) => j.id === job.id);
    if (idx === -1) return;
    cur[idx] = {
      ...cur[idx],
      status: "ready",
      rows: Math.round(1000 + Math.random() * 50_000),
      downloadUrl: `https://exports.smartpark.io/${input.dataset}-${Date.now()}.${input.format}`,
    };
    saveJobs(cur);
  }, 1500);
  return job;
}

export async function listApiKeys(): Promise<ApiKey[]> {
  return loadKeys().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createApiKey(input: {
  label: string;
  scopes: string[];
  createdBy: string;
}): Promise<ApiKey> {
  const list = loadKeys();
  const key: ApiKey = {
    id: makeId("key"),
    label: input.label,
    scopes: input.scopes,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    prefix: `sk_live_${Math.random().toString(16).slice(2, 6)}…${Math.random()
      .toString(16)
      .slice(2, 4)}`,
  };
  list.unshift(key);
  saveKeys(list);
  pushAudit({
    actor: input.createdBy,
    action: "CREATED api key",
    entity: key.id,
    ip: "internal",
  });
  return key;
}

export async function revokeApiKey(id: string): Promise<ApiKey | null> {
  const list = loadKeys();
  const idx = list.findIndex((k) => k.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], revoked: true };
  saveKeys(list);
  pushAudit({
    actor: "admin",
    action: "REVOKED api key",
    entity: id,
    ip: "internal",
  });
  return list[idx];
}

export async function listAuditLog(): Promise<AuditEntry[]> {
  return loadLog().sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}
