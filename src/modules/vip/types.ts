// Vehicle Identity Platform — canonical types.
//
// This is the cross-subagent contract. Consumer surface C-52 `/my-car`
// (Subagent A) consumes `getVehicleIdentity(vehicleId)` and renders whatever
// this file describes. Keep the field surface stable — additive changes only.

export type VipDocKind = "rc" | "insurance" | "puc" | "warranty";
export type VipHistoryKind = "service" | "charge" | "tow" | "parking";
export type VipRecallStatus = "open" | "closed";
export type VipAudience = "insurer" | "oem" | "buyer" | "mechanic";

export interface VipOwnershipEntry {
  owner: string;
  from: string; // ISO date
  to?: string; // ISO date (absent = current owner)
}

export interface VipDoc {
  id: string;
  kind: VipDocKind;
  url?: string;
  expiresAt?: string; // ISO date
  issuer?: string;
}

export interface VipHistoryEntry {
  id: string;
  date: string; // ISO
  providerId: string;
  providerName: string;
  kind: VipHistoryKind;
  summary: string;
  cost: number; // INR
}

export interface VipRecall {
  id: string;
  issuedAt: string; // ISO
  oem: string;
  summary: string;
  status: VipRecallStatus;
}

export interface VipPermission {
  audience: VipAudience;
  scopes: string[];
  grantedAt: string; // ISO
  expiresAt?: string; // ISO
  /** Optional stable id (used by consumer share-management UIs to revoke). */
  id?: string;
  /** Optional grantee name (consumer surface uses it; VIP admin ignores). */
  granteeName?: string;
}

/**
 * The canonical identity record for a single vehicle.
 * Subagent A (C-52) and Subagent D-2 (VIP-01…08) both consume this shape.
 */
export interface VehicleIdentity {
  vehicleId: string;
  vin?: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  ownershipChain: VipOwnershipEntry[];
  docs: VipDoc[];
  serviceHistory: VipHistoryEntry[];
  recalls: VipRecall[];
  permissions: VipPermission[];
}

// UI labels ------------------------------------------------------------

export const DOC_LABEL: Record<VipDocKind, string> = {
  rc: "Registration Certificate",
  insurance: "Insurance",
  puc: "PUC",
  warranty: "Warranty",
};

export const HISTORY_LABEL: Record<VipHistoryKind, string> = {
  service: "Service",
  charge: "Charging",
  tow: "Tow / SOS",
  parking: "Parking",
};

export const AUDIENCE_LABEL: Record<VipAudience, string> = {
  insurer: "Insurer",
  oem: "OEM",
  buyer: "Prospective Buyer",
  mechanic: "Mechanic Shop",
};
