// V-21 Staff / Attendants — domain types.

export type StaffRole = "attendant" | "supervisor" | "manager";
export type StaffStatus = "invited" | "active" | "suspended";

export interface StaffMember {
  id: string;
  partnerId: string;
  facilityId: string;
  facilityName: string;
  name: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  invitedAt: string;
  activatedAt?: string;
  lastActiveAt?: string;
  scansToday?: number;
}

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  attendant: "Attendant",
  supervisor: "Supervisor",
  manager: "Manager",
};

export const STAFF_STATUS_LABEL: Record<StaffStatus, string> = {
  invited: "Invited",
  active: "Active",
  suspended: "Suspended",
};
