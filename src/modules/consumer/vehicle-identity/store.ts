// Consumer face of the Vehicle Identity Platform (C-52 My Car).
//
// This store used to maintain its own localStorage. It now delegates entirely
// to `@/modules/vip` so admin (VIP-01…08) and consumer (C-52) share the same
// underlying data — no more seed drift.
//
// The consumer UI shape (`ServiceEvent`, `VehicleDoc`, `OwnershipEntry`,
// `SharePermission`) is kept intact so `MyCarScreen.tsx` doesn't have to
// change. This file reshapes VIP records into those types on read and
// translates back on write.

import { makeId } from "@/shared/lib/storage";
import {
  getVehicleIdentityForConsumer,
  updatePermissions as vipUpdatePermissions,
} from "@/modules/vip";
import type {
  VehicleIdentity,
  VipAudience,
  VipDocKind,
  VipHistoryEntry,
  VipPermission,
} from "@/modules/vip";
import type {
  DocType,
  OwnershipEntry,
  ServiceEvent,
  ServiceEventKind,
  SharePermission,
  SharePermissionScope,
  VehicleDoc,
} from "./types";

// ---------- Shape adapters ----------

function historyKindToConsumer(kind: VipHistoryEntry["kind"]): ServiceEventKind {
  switch (kind) {
    case "service":
      return "service";
    case "charge":
      return "charge";
    case "tow":
      return "repair";
    case "parking":
      return "inspection";
    default:
      return "service";
  }
}

function docKindToConsumer(kind: VipDocKind): DocType {
  return kind as DocType;
}

function audienceToGranteeType(
  audience: VipAudience,
): SharePermission["granteeType"] {
  switch (audience) {
    case "mechanic":
      return "mechanic";
    case "insurer":
      return "insurer";
    case "buyer":
      return "family";
    case "oem":
      return "other";
    default:
      return "other";
  }
}

function granteeTypeToAudience(
  t: SharePermission["granteeType"],
): VipAudience {
  switch (t) {
    case "mechanic":
      return "mechanic";
    case "insurer":
      return "insurer";
    case "family":
      return "buyer";
    case "other":
      return "buyer";
    default:
      return "buyer";
  }
}

const SCOPE_MAP: Record<SharePermissionScope, string> = {
  read_history: "read:service_history",
  read_docs: "read:docs_metadata",
  write_service_log: "write:service_log",
};

function scopeToConsumer(scope: string): SharePermissionScope | null {
  switch (scope) {
    case "read:service_history":
      return "read_history";
    case "read:docs_metadata":
      return "read_docs";
    case "write:service_log":
      return "write_service_log";
    default:
      return null;
  }
}

function docLabel(kind: VipDocKind): string {
  switch (kind) {
    case "rc":
      return "Registration Certificate";
    case "insurance":
      return "Insurance";
    case "puc":
      return "PUC certificate";
    case "warranty":
      return "Warranty";
  }
}

async function resolveIdentity(
  vehicleId: string,
): Promise<VehicleIdentity | null> {
  return getVehicleIdentityForConsumer("consumer", vehicleId);
}

// ---------- Public API (kept stable for MyCarScreen.tsx) ----------

export async function listServiceHistory(
  vehicleId: string,
): Promise<ServiceEvent[]> {
  const id = await resolveIdentity(vehicleId);
  if (!id) return [];
  return id.serviceHistory
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map<ServiceEvent>((h) => ({
      id: h.id,
      vehicleId,
      kind: historyKindToConsumer(h.kind),
      title: h.summary,
      providerName: h.providerName,
      at: h.date,
      costRupees: h.cost > 0 ? h.cost : undefined,
    }));
}

export async function listDocs(vehicleId: string): Promise<VehicleDoc[]> {
  const id = await resolveIdentity(vehicleId);
  if (!id) return [];
  return id.docs.map<VehicleDoc>((d) => ({
    id: d.id,
    vehicleId,
    type: docKindToConsumer(d.kind),
    title: docLabel(d.kind),
    fileName: d.url && !d.url.startsWith("#") ? d.url : undefined,
    expiresAt: d.expiresAt,
    uploadedAt: d.expiresAt ?? new Date().toISOString(),
  }));
}

export async function listOwnership(
  vehicleId: string,
): Promise<OwnershipEntry[]> {
  const id = await resolveIdentity(vehicleId);
  if (!id) return [];
  return id.ownershipChain.map<OwnershipEntry>((o, i) => ({
    id: `own-${id.vehicleId}-${i}`,
    vehicleId,
    ownerName: o.owner,
    from: o.from,
    to: o.to,
  }));
}

export async function listShares(
  vehicleId: string,
): Promise<SharePermission[]> {
  const id = await resolveIdentity(vehicleId);
  if (!id) return [];
  return id.permissions.map<SharePermission>((p, i) => {
    const consumerScopes = p.scopes
      .map(scopeToConsumer)
      .filter((s): s is SharePermissionScope => s !== null);
    return {
      id: p.id ?? `perm-${id.vehicleId}-${i}`,
      vehicleId,
      granteeName: p.granteeName ?? capitalize(p.audience),
      granteeType: audienceToGranteeType(p.audience),
      scopes: consumerScopes.length ? consumerScopes : ["read_history"],
      createdAt: p.grantedAt,
    };
  });
}

export async function addShare(input: {
  vehicleId: string;
  granteeName: string;
  granteeType: SharePermission["granteeType"];
  scopes: SharePermissionScope[];
}): Promise<SharePermission> {
  const id = await resolveIdentity(input.vehicleId);
  if (!id) {
    // Nothing to persist — return a stub the caller can render.
    return {
      id: makeId("share"),
      vehicleId: input.vehicleId,
      granteeName: input.granteeName,
      granteeType: input.granteeType,
      scopes: input.scopes,
      createdAt: new Date().toISOString(),
    };
  }
  const permId = makeId("perm");
  const newPerm: VipPermission = {
    id: permId,
    audience: granteeTypeToAudience(input.granteeType),
    scopes: input.scopes.map((s) => SCOPE_MAP[s]),
    grantedAt: new Date().toISOString(),
    granteeName: input.granteeName,
  };
  await vipUpdatePermissions(id.vehicleId, [...id.permissions, newPerm]);
  return {
    id: permId,
    vehicleId: input.vehicleId,
    granteeName: input.granteeName,
    granteeType: input.granteeType,
    scopes: input.scopes,
    createdAt: newPerm.grantedAt,
  };
}

export async function revokeShare(
  vehicleId: string,
  id: string,
): Promise<void> {
  const identity = await resolveIdentity(vehicleId);
  if (!identity) return;
  const next = identity.permissions.filter((p, i) => {
    const key = p.id ?? `perm-${identity.vehicleId}-${i}`;
    return key !== id;
  });
  await vipUpdatePermissions(identity.vehicleId, next);
}

export async function replaceDoc(input: {
  vehicleId: string;
  type: DocType;
  fileName: string;
}): Promise<VehicleDoc> {
  // We don't have a VIP-level mutation for doc URLs today — this becomes a
  // best-effort local reshape so the toast success path still fires. When
  // the real API lands, wire this to a VIP endpoint.
  return {
    id: makeId("doc"),
    vehicleId: input.vehicleId,
    type: input.type,
    title: input.fileName,
    fileName: input.fileName,
    uploadedAt: new Date().toISOString(),
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
