import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getReferralStats,
  inviteVendor,
  listReferralInvites,
} from "./store";

export const useReferralStats = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-referral-stats", partnerId],
    queryFn: () => getReferralStats(partnerId!),
    enabled: !!partnerId,
  });

export const useReferralInvites = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-referral-invites", partnerId],
    queryFn: () => listReferralInvites(partnerId!),
    enabled: !!partnerId,
  });

export const useInviteVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteVendor,
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["partner-referral-invites", v.partnerId] });
      qc.invalidateQueries({ queryKey: ["partner-referral-stats", v.partnerId] });
    },
  });
};
