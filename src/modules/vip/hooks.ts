// React-query wrappers over the VIP mock store.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getVehicleIdentity,
  listVehicleIdentities,
  searchVehicles,
  updatePermissions,
} from "./store";
import type { VehicleIdentity } from "./types";

const KEYS = {
  all: ["vip", "vehicles"] as const,
  list: () => ["vip", "vehicles", "list"] as const,
  search: (q: string) => ["vip", "vehicles", "search", q] as const,
  detail: (id: string) => ["vip", "vehicles", "detail", id] as const,
};

export const useVipVehicles = () =>
  useQuery({
    queryKey: KEYS.list(),
    queryFn: () => listVehicleIdentities(),
    staleTime: 30_000,
  });

export const useVipVehicleSearch = (query: string) =>
  useQuery({
    queryKey: KEYS.search(query),
    queryFn: () => searchVehicles(query),
    staleTime: 15_000,
  });

export const useVipVehicle = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => getVehicleIdentity(id!),
    enabled: !!id,
  });

export const useUpdateVipPermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      vehicleId: string;
      permissions: VehicleIdentity["permissions"];
    }) => updatePermissions(input.vehicleId, input.permissions),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.vehicleId) });
    },
  });
};
