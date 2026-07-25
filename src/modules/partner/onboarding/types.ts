// V-25 Vendor Onboarding Checklist — domain types.

export type OnboardingStepId =
  | "profile"
  | "kyc"
  | "setup"
  | "listing_live"
  | "first_booking"
  | "first_payout";

export interface OnboardingStep {
  id: OnboardingStepId;
  label: string;
  helper: string;
  cta: string;
  route: string;
  status: "done" | "in_progress" | "pending" | "blocked";
  completedAt?: string;
}

export interface OnboardingProgress {
  partnerId: string;
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  progressPct: number;
}
