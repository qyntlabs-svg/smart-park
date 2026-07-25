// A-14 Admin RBAC — domain types.

export type AdminRole = "super_admin" | "ops" | "finance" | "support";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  createdAt: string;
  lastLoginAt?: string;
  status: "active" | "invited" | "suspended";
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  ops: "Ops",
  finance: "Finance",
  support: "Support",
};

export const ROLE_PERMISSIONS: Record<
  AdminRole,
  { label: string; capabilities: string[] }
> = {
  super_admin: {
    label: "Full platform access, including RBAC changes",
    capabilities: ["*"],
  },
  ops: {
    label: "Approvals, incidents, feature flags, directory",
    capabilities: [
      "approvals:*",
      "incidents:*",
      "flags:*",
      "providers:*",
      "consumers:read",
    ],
  },
  finance: {
    label: "Payout batches, GST reports, exports, dispute refunds",
    capabilities: [
      "payouts:*",
      "exports:*",
      "disputes:refund",
      "pricing:*",
      "providers:read",
    ],
  },
  support: {
    label: "Consumer/provider lookup, dispute triage",
    capabilities: [
      "consumers:*",
      "providers:read",
      "disputes:read",
      "disputes:reply",
    ],
  },
};
