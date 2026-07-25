// A-11 Platform Pricing Rules — domain types.

export interface TakeRate {
  kind: "parking" | "ev" | "mechanic" | "tow" | "rental";
  percentage: number;
  minFee: number;
  updatedAt: string;
}

export interface Subsidy {
  id: string;
  name: string;
  description: string;
  target: "consumer" | "vendor";
  amountPct: number;
  budget: number;
  spent: number;
  active: boolean;
  validUntil: string;
}

export interface PromoCampaign {
  id: string;
  code: string;
  name: string;
  discountPct: number;
  maxOffAmount: number;
  redemptions: number;
  budget: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
}
