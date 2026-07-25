// EV Subscription mock store (C-34) — localStorage-backed, promise-returning.

import { readJson, writeJson } from "@/shared/lib/storage";
import type { SubscriptionStatus, SubscriptionTierId } from "./types";

const KEY = "consumerEvSubscription";

const DEFAULT: SubscriptionStatus = {
  active: false,
};

export async function getSubscription(): Promise<SubscriptionStatus> {
  return readJson<SubscriptionStatus>(KEY, DEFAULT);
}

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

export async function subscribe(
  tierId: SubscriptionTierId,
): Promise<SubscriptionStatus> {
  const next: SubscriptionStatus = {
    active: true,
    tierId,
    renewsAt: daysFromNow(30),
    cancelAtPeriodEnd: false,
    kwhUsedThisMonth: 0,
  };
  writeJson(KEY, next);
  return next;
}

export async function upgradeSubscription(
  tierId: SubscriptionTierId,
): Promise<SubscriptionStatus> {
  const current = await getSubscription();
  const next: SubscriptionStatus = {
    ...current,
    active: true,
    tierId,
    cancelAtPeriodEnd: false,
    renewsAt: current.renewsAt ?? daysFromNow(30),
  };
  writeJson(KEY, next);
  return next;
}

export async function cancelSubscription(): Promise<SubscriptionStatus> {
  const current = await getSubscription();
  const next: SubscriptionStatus = {
    ...current,
    cancelAtPeriodEnd: true,
  };
  writeJson(KEY, next);
  return next;
}

export async function resumeSubscription(): Promise<SubscriptionStatus> {
  const current = await getSubscription();
  const next: SubscriptionStatus = {
    ...current,
    cancelAtPeriodEnd: false,
  };
  writeJson(KEY, next);
  return next;
}
