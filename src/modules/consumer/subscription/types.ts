// EV Subscription / Membership types (C-34).

export type SubscriptionTierId = "basic" | "plus" | "pro";

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  monthlyPrice: number;   // ₹
  includedKwh: number;    // kWh included per month
  perksLines: string[];   // 2-3 bullet perks
  accentClass: string;    // tailwind for card border/gradient
  recommended?: boolean;
}

export const TIERS: SubscriptionTier[] = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 499,
    includedKwh: 30,
    perksLines: [
      "30 kWh across any partner charger",
      "₹15/kWh top-ups",
      "Standard reservation window (2h)",
    ],
    accentClass: "border-border",
  },
  {
    id: "plus",
    name: "Plus",
    monthlyPrice: 999,
    includedKwh: 80,
    perksLines: [
      "80 kWh + priority queue at busy stations",
      "₹12/kWh top-ups",
      "Free 30-min extension per session",
      "Roaming to partner networks included",
    ],
    accentClass: "border-primary/60",
    recommended: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 1799,
    includedKwh: 180,
    perksLines: [
      "180 kWh + guaranteed reservation at any partner",
      "₹9/kWh top-ups",
      "Free tow-assist up to 2× / month",
      "AI Concierge premium features",
    ],
    accentClass: "border-emerald-500/60",
  },
];

export interface SubscriptionStatus {
  active: boolean;
  tierId?: SubscriptionTierId;
  renewsAt?: string;      // ISO
  cancelAtPeriodEnd?: boolean;
  kwhUsedThisMonth?: number;
}
