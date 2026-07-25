// A-08 Incident Board — domain types.

export type IncidentKind =
  | "charger_offline"
  | "facility_closed"
  | "worker_stuck"
  | "payment_gateway"
  | "app_crash";

export type IncidentSeverity = "critical" | "high" | "med" | "low";
export type IncidentStatus = "open" | "acknowledged" | "mitigating" | "resolved";

export interface IncidentEvent {
  at: string;
  by: string;
  message: string;
}

export interface Incident {
  id: string;
  title: string;
  kind: IncidentKind;
  severity: IncidentSeverity;
  status: IncidentStatus;
  provider?: string;
  city: string;
  openedAt: string;
  ackAt?: string;
  resolvedAt?: string;
  impactUsers?: number;
  ownerName?: string;
  timeline: IncidentEvent[];
}

export const KIND_LABEL: Record<IncidentKind, string> = {
  charger_offline: "Charger offline",
  facility_closed: "Facility closed",
  worker_stuck: "Worker stuck",
  payment_gateway: "Payment gateway",
  app_crash: "App crash spike",
};

export const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  critical: "CRIT",
  high: "HIGH",
  med: "MED",
  low: "LOW",
};
