// Hooks for referrals + family sharing.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addInvitedFriend,
  getFamilyState,
  getReferralState,
  inviteFamilyMember,
  removeFamilyMember,
  setSharedWallet,
  toggleMemberWalletAccess,
} from "./store";

const KEYS = {
  referral: ["referral-state"] as const,
  family: ["family-state"] as const,
};

// Referrals
export const useReferralState = () =>
  useQuery({ queryKey: KEYS.referral, queryFn: () => getReferralState() });

export const useAddInvitedFriend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; phone?: string }) =>
      addInvitedFriend(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.referral }),
  });
};

// Family
export const useFamilyState = () =>
  useQuery({ queryKey: KEYS.family, queryFn: () => getFamilyState() });

export const useInviteFamilyMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      phone?: string;
      relationship?: string;
      walletAccess?: boolean;
    }) => inviteFamilyMember(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.family }),
  });
};

export const useRemoveFamilyMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeFamilyMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.family }),
  });
};

export const useSetSharedWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => setSharedWallet(enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.family }),
  });
};

export const useToggleMemberWalletAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleMemberWalletAccess(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.family }),
  });
};
