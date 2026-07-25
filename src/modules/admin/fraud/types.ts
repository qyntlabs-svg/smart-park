// A-09 Fraud & Risk — domain types.

export type RiskLevel = "low" | "med" | "high" | "critical";

export interface FlaggedAccount {
  id: string;
  name: string;
  phone: string;
  reason: string;
  score: number; // 0-100
  level: RiskLevel;
  chargebacks: number;
  disputes: number;
  bookings: number;
  chargebackRatePct: number;
  city: string;
  lastActivity: string;
  status: "flagged" | "reviewed_ok" | "blocked";
}

export interface FraudTrendPoint {
  label: string;
  chargebackRate: number;
  disputeRate: number;
}

export const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Low",
  med: "Med",
  high: "High",
  critical: "Critical",
};
