// A-06 Admin Disputes & Refunds — domain types.

export type AdminDisputeStatus =
  | "open"
  | "under_review"
  | "resolved_refunded"
  | "resolved_denied";

export interface AdminDispute {
  id: string;
  ref: string;
  consumerName: string;
  consumerPhone: string;
  providerName: string;
  providerKind: "parking" | "ev" | "mechanic" | "tow" | "rental";
  amount: number;
  reason: string;
  status: AdminDisputeStatus;
  openedAt: string;
  slaBreached?: boolean;
  transcript: Array<{
    from: "consumer" | "vendor" | "admin";
    text: string;
    at: string;
  }>;
}
