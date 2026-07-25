import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOnboardingProgress, markStepDone } from "./store";
import type { OnboardingStepId } from "./types";

export const useOnboardingProgress = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-onboarding", partnerId],
    queryFn: () => getOnboardingProgress(partnerId!),
    enabled: !!partnerId,
  });

export const useMarkOnboardingStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      partnerId,
      id,
    }: {
      partnerId: string;
      id: OnboardingStepId;
    }) => markStepDone(partnerId, id),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-onboarding", v.partnerId] }),
  });
};
