// Consumer Vehicle Identity types (C-52).
// This is the CONSUMER face of VIP. Admin/OEM VIP surfaces are subagent D-2.

export type DocType = "rc" | "insurance" | "puc" | "warranty";

export const DOC_LABEL: Record<DocType, string> = {
  rc: "Registration (RC)",
  insurance: "Insurance",
  puc: "PUC certificate",
  warranty: "Warranty",
};

export interface VehicleDoc {
  id: string;
  vehicleId: string;
  type: DocType;
  title: string;
  fileName?: string;
  expiresAt?: string;
  uploadedAt: string;
}

export type ServiceEventKind =
  | "service"
  | "repair"
  | "wash"
  | "inspection"
  | "charge";

export interface ServiceEvent {
  id: string;
  vehicleId: string;
  kind: ServiceEventKind;
  title: string;
  providerName?: string;
  at: string;
  costRupees?: number;
  km?: number;
  notes?: string;
}

export interface OwnershipEntry {
  id: string;
  vehicleId: string;
  ownerName: string;
  from: string;
  to?: string;                 // undefined = current owner
}

export type SharePermissionScope =
  | "read_history"
  | "read_docs"
  | "write_service_log";

export interface SharePermission {
  id: string;
  vehicleId: string;
  granteeName: string;
  granteeType: "mechanic" | "family" | "insurer" | "other";
  scopes: SharePermissionScope[];
  createdAt: string;
}

export const SCOPE_LABEL: Record<SharePermissionScope, string> = {
  read_history:      "View service history",
  read_docs:         "View documents",
  write_service_log: "Add service records",
};
