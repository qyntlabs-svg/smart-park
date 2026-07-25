// Types for the Consumer Wallet (C-24) + Refunds & Disputes (C-25).
//
// Only the *saved-methods* surface; actual money movement still routes through
// the existing UPI screens. This lets us swap Razorpay/Stripe later without
// changing any UI.

export type PaymentMethodType = "upi" | "card";

export interface UpiMethod {
  id: string;
  type: "upi";
  vpa: string;                 // e.g. "arjun@okhdfc"
  label?: string;              // consumer-chosen nickname
  isDefault: boolean;
  addedAt: string;
}

export interface CardMethod {
  id: string;
  type: "card";
  brand: "visa" | "mastercard" | "rupay" | "amex" | "other";
  last4: string;               // "4242"
  expMonth: number;
  expYear: number;
  holderName: string;
  label?: string;
  isDefault: boolean;
  addedAt: string;
}

export type PaymentMethod = UpiMethod | CardMethod;

// ---- Refunds / disputes ----

export type RefundStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "refunded";

export type RefundReason =
  | "double_charge"
  | "service_not_delivered"
  | "amount_incorrect"
  | "vendor_closed"
  | "charger_offline"
  | "other";

export const REFUND_REASON_LABEL: Record<RefundReason, string> = {
  double_charge: "I was charged twice",
  service_not_delivered: "Service was not delivered",
  amount_incorrect: "Amount is incorrect",
  vendor_closed: "Vendor was closed / unreachable",
  charger_offline: "Charger was offline",
  other: "Something else",
};

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded",
};

export interface RefundRequest {
  id: string;
  userId: string;
  /** Loose ref — parking booking id, ev session id, etc. */
  bookingRef: string;
  bookingTitle: string;      // human-readable ("T Nagar · 25 Oct")
  amount: number;            // rupees
  reason: RefundReason;
  detail?: string;
  status: RefundStatus;
  createdAt: string;
  updatedAt: string;
  timeline: RefundEvent[];
}

export interface RefundEvent {
  at: string;
  status: RefundStatus;
  note?: string;
}
