// Hooks over the subscription mock store.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSubscription,
  getSubscription,
  resumeSubscription,
  subscribe,
  upgradeSubscription,
} from "./store";
import type { SubscriptionTierId } from "./types";

const KEY = ["ev-subscription"] as const;

export const useSubscription = () =>
  useQuery({ queryKey: KEY, queryFn: () => getSubscription() });

export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: SubscriptionTierId) => subscribe(tier),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useUpgradeSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: SubscriptionTierId) => upgradeSubscription(tier),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useResumeSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resumeSubscription(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
