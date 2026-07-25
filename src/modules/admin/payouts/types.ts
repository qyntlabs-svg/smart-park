// A-07 Payouts Ops — domain types.

export type PayoutBatchStatus =
  | "queued"
  | "processing"
  | "completed"
  | "partial_failure"
  | "failed";

export interface PayoutBatch {
  id: string;
  runAt: string;
  status: PayoutBatchStatus;
  total: number;
  count: number;
  succeeded: number;
  failed: number;
  method: "upi" | "bank";
  operatorNote?: string;
}

export interface PayoutException {
  id: string;
  batchId: string;
  providerId: string;
  providerName: string;
  amount: number;
  reason: string;
  createdAt: string;
  resolved: boolean;
}
