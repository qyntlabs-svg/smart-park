// A-03 Provider Approvals Queue — domain types.

export type ProviderKind = "parking" | "ev" | "mechanic" | "tow" | "rental";
export type KycStatus = "pending" | "under_review" | "approved" | "rejected";

export interface KycDocument {
  id: string;
  label: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface ProviderApplication {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  kind: ProviderKind;
  city: string;
  address: string;
  gstin?: string;
  submittedAt: string;
  status: KycStatus;
  documents: KycDocument[];
  reviewer?: string;
  rejectionReason?: string;
  history: Array<{
    at: string;
    by: string;
    action: string;
    note?: string;
  }>;
}

export const PROVIDER_KIND_LABEL: Record<ProviderKind, string> = {
  parking: "Parking",
  ev: "EV",
  mechanic: "Mechanic",
  tow: "Tow / SOS",
  rental: "Rental",
};

export const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  pending: "Pending",
  under_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
};
