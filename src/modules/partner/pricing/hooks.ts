import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTimeRule,
  listPricingConfigs,
  updatePricingConfig,
  upsertTimeRule,
} from "./store";
import type { PricingConfig } from "./types";

export const usePricingConfigs = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-pricing-configs", partnerId],
    queryFn: () => listPricingConfigs(partnerId!),
    enabled: !!partnerId,
  });

export const useUpdatePricingConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      partnerId,
      listingId,
      patch,
    }: {
      partnerId: string;
      listingId: string;
      patch: Partial<PricingConfig>;
    }) => updatePricingConfig(partnerId, listingId, patch),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-pricing-configs", v.partnerId] }),
  });
};

export const useUpsertTimeRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertTimeRule,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-pricing-configs", v.partnerId] }),
  });
};

export const useDeleteTimeRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTimeRule,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-pricing-configs", v.partnerId] }),
  });
};
