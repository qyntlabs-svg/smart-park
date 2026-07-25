// V-17 Payouts — domain types.

export type PayoutStatus = "pending" | "in_transit" | "paid" | "failed";
export type PayoutSchedule = "daily" | "weekly" | "monthly" | "manual";
export type PayoutMethod = "upi" | "bank";

export interface PayoutAccount {
  partnerId: string;
  method: PayoutMethod;
  upiVpa?: string;
  bankAccountLast4?: string;
  bankIfsc?: string;
  bankName?: string;
  holderName?: string;
  verified: boolean;
  schedule: PayoutSchedule;
  minBalance: number;
  updatedAt: string;
}

export interface Payout {
  id: string;
  partnerId: string;
  amount: number;
  fee: number;
  net: number;
  currency: "INR";
  status: PayoutStatus;
  method: PayoutMethod;
  reference: string;
  scheduledFor: string;
  paidAt?: string;
  failureReason?: string;
  periodStart: string;
  periodEnd: string;
}

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: "Scheduled",
  in_transit: "In transit",
  paid: "Paid",
  failed: "Failed",
};

export const SCHEDULE_LABEL: Record<PayoutSchedule, string> = {
  daily: "Daily (T+1)",
  weekly: "Weekly (Every Monday)",
  monthly: "Monthly (1st of month)",
  manual: "Manual — I'll request",
};
