// Social module: referrals (C-51) + family sharing (C-55).

// ---- Referrals ----

export interface ReferralState {
  code: string;
  totalCredits: number;
  pendingCredits: number;
  invitedFriends: InvitedFriend[];
}

export interface InvitedFriend {
  id: string;
  name: string;
  phone?: string;
  status: "invited" | "joined" | "credited";
  invitedAt: string;
  joinedAt?: string;
  creditsEarned: number;
}

// ---- Family sharing ----

export interface FamilyMember {
  id: string;
  name: string;
  phone?: string;
  relationship?: string;         // "Spouse", "Parent", "Sibling"
  status: "invited" | "active" | "removed";
  invitedAt: string;
  joinedAt?: string;
  vehicleAccess: string[];       // vehicle IDs shared with them
  walletAccess: boolean;
}

export interface FamilyState {
  members: FamilyMember[];
  sharedWallet: boolean;
}
