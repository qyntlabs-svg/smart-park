// Charging Operator SaaS — types local to the module.
// The Operator SaaS aggregates data from modules/ev/store.ts (EvStation,
// EvSession, EvReservation, EvConnector) and adds its own local domain for
// pricing rules, maintenance logs, firmware queue, and roaming ledgers.
// Mobility Kernel primitives: Provider, Availability, Reservation, Pricing,
// Payment, Notification.

// ---------- KPI aggregation shapes (produced by lib/aggregations.ts) ----------

export interface OperatorNetworkKpis {
  uptimePct: number;
  totalStations: number;
  activeStations: number;
  offlineStations: number;
  totalConnectors: number;
  connectorsAvailable: number;
  connectorsInUse: number;
  connectorsOffline: number;
  sessionsLast90d: number;
  sessionsToday: number;
  kwhLast90d: number;
  revenueLast90d: number;
  avgSessionMinutes: number;
  slaBreachCount: number;
  utilizationPct: number;
}

export interface StationSummary {
  stationId: string;
  name: string;
  address: string;
  status: "active" | "paused" | "draft";
  uptimePct: number;
  connectorsTotal: number;
  connectorsAvailable: number;
  connectorsOffline: number;
  activeSessions: number;
  todaySessions: number;
  todayKwh: number;
  todayRevenue: number;
  utilizationPct: number;
}

export interface UtilizationHeat {
  dayLabel: string; // Mon..Sun
  hour: number; // 0..23
  value: number; // sessions in that day×hour cell
}

export interface DailyMetric {
  date: string;
  sessions: number;
  kwh: number;
  revenue: number;
}

// ---------- Pricing rules ----------

export type PricingRuleKind = "time_of_day" | "surge" | "connector";

export interface PricingRule {
  id: string;
  stationId: "all" | string;
  kind: PricingRuleKind;
  label: string;
  active: boolean;
  // for time_of_day
  fromHour?: number;
  toHour?: number;
  // for surge
  utilizationThresholdPct?: number;
  multiplier?: number;
  // for connector
  connectorType?: string;
  perKwh?: number;
  createdAt: string;
}

// ---------- Maintenance log ----------

export type MaintenanceStatus = "open" | "dispatched" | "on_site" | "resolved";

export interface MaintenanceWorkOrder {
  id: string;
  stationId: string;
  connectorId?: string;
  issue: string;
  severity: "low" | "medium" | "high";
  status: MaintenanceStatus;
  fieldTech?: string;
  openedAt: string;
  resolvedAt?: string;
  partsUsed: string[];
  slaMinutes: number;
}

// ---------- Firmware / OTA ----------

export type FirmwareJobStatus =
  | "queued"
  | "in_progress"
  | "installed"
  | "failed"
  | "rolled_back";

export interface FirmwareBundle {
  id: string;
  version: string;
  releaseNotes: string;
  releasedAt: string;
  channel: "stable" | "beta";
}

export interface FirmwareJob {
  id: string;
  stationId: string;
  bundleId: string;
  status: FirmwareJobStatus;
  progressPct: number;
  startedAt?: string;
  finishedAt?: string;
}

// ---------- Revenue & payouts ----------

export interface OperatorPayout {
  id: string;
  periodStart: string;
  periodEnd: string;
  gross: number;
  platformFee: number;
  taxes: number;
  net: number;
  status: "scheduled" | "in_transit" | "paid" | "failed";
  bankMasked: string;
  processedAt?: string;
}

// ---------- Roaming ledger ----------

export interface RoamingPartner {
  id: string;
  name: string;
  country: string;
  networkSize: number;
  status: "active" | "pending" | "paused";
  contractStart: string;
}

export interface RoamingEntry {
  id: string;
  partnerId: string;
  sessionId: string;
  direction: "inbound" | "outbound";
  kwh: number;
  costCents: number; // in the smallest currency unit
  currency: "INR" | "USD" | "EUR";
  settledAt?: string;
  createdAt: string;
}

// ---------- SLA ----------

export interface SlaIncident {
  id: string;
  stationId: string;
  connectorId?: string;
  reason: "charger_offline" | "station_offline" | "power_dip";
  openedAt: string;
  closedAt?: string;
  durationMinutes: number;
  penalty: number;
}

// ---------- Operator notifications ----------

export type OperatorNoticeSeverity = "info" | "warning" | "critical";

export interface OperatorNotice {
  id: string;
  severity: OperatorNoticeSeverity;
  title: string;
  body: string;
  stationId?: string;
  createdAt: string;
  read: boolean;
}
