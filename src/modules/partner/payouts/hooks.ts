import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPayoutAccount,
  listPayouts,
  requestManualPayout,
  updatePayoutAccount,
  updatePayoutSchedule,
} from "./store";
import type { PayoutAccount, PayoutSchedule } from "./types";

export const usePayoutAccount = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-payout-account", partnerId],
    queryFn: () => getPayoutAccount(partnerId!),
    enabled: !!partnerId,
  });

export const usePayouts = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-payouts", partnerId],
    queryFn: () => listPayouts(partnerId!),
    enabled: !!partnerId,
  });

export const useUpdatePayoutAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      partnerId,
      patch,
    }: {
      partnerId: string;
      patch: Partial<PayoutAccount>;
    }) => updatePayoutAccount(partnerId, patch),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-payout-account", v.partnerId] }),
  });
};

export const useUpdatePayoutSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      partnerId,
      schedule,
    }: {
      partnerId: string;
      schedule: PayoutSchedule;
    }) => updatePayoutSchedule(partnerId, schedule),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-payout-account", v.partnerId] }),
  });
};

export const useRequestManualPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partnerId: string) => requestManualPayout(partnerId),
    onSuccess: (_d, partnerId) =>
      qc.invalidateQueries({ queryKey: ["partner-payouts", partnerId] }),
  });
};
