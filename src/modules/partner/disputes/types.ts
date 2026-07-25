// V-19 Disputes — domain types.

export type DisputeStatus =
  | "open"
  | "awaiting_vendor"
  | "under_review"
  | "resolved_refunded"
  | "resolved_denied";

export type DisputeReason =
  | "no_show"
  | "overcharge"
  | "damage"
  | "session_incomplete"
  | "wrong_slot"
  | "other";

export interface DisputeMessage {
  id: string;
  from: "consumer" | "vendor" | "admin";
  text: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  partnerId: string;
  consumerName: string;
  consumerPhone: string;
  bookingRef: string;
  amount: number;
  reason: DisputeReason;
  status: DisputeStatus;
  openedAt: string;
  slaHours: number;
  messages: DisputeMessage[];
}

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  open: "New",
  awaiting_vendor: "Needs response",
  under_review: "Under review",
  resolved_refunded: "Refunded",
  resolved_denied: "Denied",
};

export const DISPUTE_REASON_LABEL: Record<DisputeReason, string> = {
  no_show: "No-show",
  overcharge: "Overcharge",
  damage: "Vehicle damage",
  session_incomplete: "Session incomplete",
  wrong_slot: "Wrong slot",
  other: "Other",
};
