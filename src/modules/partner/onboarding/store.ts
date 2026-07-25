// V-25 Vendor Onboarding Checklist — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import type { OnboardingProgress, OnboardingStep } from "./types";

const KEY = "partnerOnboarding";

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "profile",
    label: "Business profile",
    helper: "Business name, address, GSTIN",
    cta: "Complete profile",
    route: "/partner/setup",
    status: "done",
    completedAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
  },
  {
    id: "kyc",
    label: "KYC documents",
    helper: "PAN, GST cert, address proof",
    cta: "Upload KYC",
    route: "/partner/kyc",
    status: "done",
    completedAt: new Date(Date.now() - 11 * 86_400_000).toISOString(),
  },
  {
    id: "setup",
    label: "Pricing & slots",
    helper: "Configure your listing and pricing",
    cta: "Finish setup",
    route: "/partner/setup",
    status: "done",
    completedAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
  },
  {
    id: "listing_live",
    label: "Listing live",
    helper: "First listing visible to consumers",
    cta: "Publish listing",
    route: "/partner/ev",
    status: "in_progress",
  },
  {
    id: "first_booking",
    label: "First booking",
    helper: "A consumer books your listing",
    cta: "Share your listing",
    route: "/partner/referral",
    status: "pending",
  },
  {
    id: "first_payout",
    label: "First payout",
    helper: "Money settled to your account",
    cta: "See payouts",
    route: "/partner/payouts",
    status: "pending",
  },
];

function load(partnerId: string): OnboardingStep[] {
  const key = `${KEY}:${partnerId}`;
  const existing = readJson<OnboardingStep[] | null>(key, null);
  if (existing) return existing;
  writeJson(key, DEFAULT_STEPS);
  return DEFAULT_STEPS;
}

function save(partnerId: string, list: OnboardingStep[]) {
  writeJson(`${KEY}:${partnerId}`, list);
}

export async function getOnboardingProgress(
  partnerId: string,
): Promise<OnboardingProgress> {
  const steps = load(partnerId);
  const completed = steps.filter((s) => s.status === "done").length;
  return {
    partnerId,
    steps,
    completedCount: completed,
    totalCount: steps.length,
    progressPct: Math.round((completed / steps.length) * 100),
  };
}

export async function markStepDone(
  partnerId: string,
  id: OnboardingStep["id"],
): Promise<OnboardingProgress> {
  const list = load(partnerId).map((s) =>
    s.id === id
      ? {
          ...s,
          status: "done" as const,
          completedAt: new Date().toISOString(),
        }
      : s,
  );
  // Promote next in_progress if any pending exists.
  const firstPending = list.find((s) => s.status === "pending");
  if (firstPending) firstPending.status = "in_progress";
  save(partnerId, list);
  return getOnboardingProgress(partnerId);
}
