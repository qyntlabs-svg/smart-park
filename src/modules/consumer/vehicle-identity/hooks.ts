// Hooks for the consumer vehicle-identity module.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addShare,
  listDocs,
  listOwnership,
  listServiceHistory,
  listShares,
  replaceDoc,
  revokeShare,
} from "./store";
import type { DocType, SharePermissionScope } from "./types";

const KEYS = {
  history: (vid: string) => ["vip-history", vid] as const,
  docs: (vid: string) => ["vip-docs", vid] as const,
  ownership: (vid: string) => ["vip-ownership", vid] as const,
  shares: (vid: string) => ["vip-shares", vid] as const,
};

export const useServiceHistory = (vehicleId: string | undefined) =>
  useQuery({
    queryKey: KEYS.history(vehicleId ?? ""),
    queryFn: () => listServiceHistory(vehicleId!),
    enabled: !!vehicleId,
  });

export const useVehicleDocs = (vehicleId: string | undefined) =>
  useQuery({
    queryKey: KEYS.docs(vehicleId ?? ""),
    queryFn: () => listDocs(vehicleId!),
    enabled: !!vehicleId,
  });

export const useVehicleOwnership = (vehicleId: string | undefined) =>
  useQuery({
    queryKey: KEYS.ownership(vehicleId ?? ""),
    queryFn: () => listOwnership(vehicleId!),
    enabled: !!vehicleId,
  });

export const useVehicleShares = (vehicleId: string | undefined) =>
  useQuery({
    queryKey: KEYS.shares(vehicleId ?? ""),
    queryFn: () => listShares(vehicleId!),
    enabled: !!vehicleId,
  });

export const useAddVehicleShare = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      vehicleId: string;
      granteeName: string;
      granteeType: "mechanic" | "family" | "insurer" | "other";
      scopes: SharePermissionScope[];
    }) => addShare(input),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: KEYS.shares(vars.vehicleId) }),
  });
};

export const useRevokeVehicleShare = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { vehicleId: string; id: string }) =>
      revokeShare(input.vehicleId, input.id),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: KEYS.shares(vars.vehicleId) }),
  });
};

export const useReplaceVehicleDoc = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      vehicleId: string;
      type: DocType;
      fileName: string;
    }) => replaceDoc(input),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: KEYS.docs(vars.vehicleId) }),
  });
};
