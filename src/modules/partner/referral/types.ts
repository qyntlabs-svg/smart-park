// V-26 Vendor Referral — domain types.

export type ReferralStatus = "invited" | "signed_up" | "activated" | "expired";

export interface ReferralInvite {
  id: string;
  partnerId: string;
  refereeName: string;
  refereePhone: string;
  status: ReferralStatus;
  invitedAt: string;
  activatedAt?: string;
  creditAwarded: number;
}

export interface ReferralStats {
  partnerId: string;
  code: string;
  inviteLink: string;
  credits: number;
  totalInvited: number;
  totalActivated: number;
  perActivationReward: number;
}

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  invited: "Invited",
  signed_up: "Signed up",
  activated: "Activated ✓",
  expired: "Expired",
};
