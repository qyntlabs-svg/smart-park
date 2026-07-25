// A-13 Data Exports & Audits — domain types.

export type ExportDataset =
  | "bookings"
  | "payouts"
  | "providers"
  | "consumers"
  | "disputes"
  | "sessions_ev";

export type ExportFormat = "csv" | "json";

export type ExportStatus = "queued" | "running" | "ready" | "failed";

export interface ExportJob {
  id: string;
  dataset: ExportDataset;
  format: ExportFormat;
  requestedBy: string;
  requestedAt: string;
  status: ExportStatus;
  rows?: number;
  downloadUrl?: string;
}

export interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string;
  revoked?: boolean;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  ip: string;
  at: string;
}
