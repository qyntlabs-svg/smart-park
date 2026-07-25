// React-query wrappers over the Fleet OS mock store.
// Components should call these hooks, never the store directly.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FleetApiScope,
  FleetMaintenanceOrder,
  FleetPolicy,
  FleetSsoConfig,
  FleetVehicle,
} from "./types";
import {
  createApiKey,
  createBatchReservation,
  getFleetDriver,
  getFleetVehicle,
  getSso,
  listAlerts,
  listApiKeys,
  listBatchReservations,
  listCostCenters,
  listDepots,
  listFleetDrivers,
  listFleetShifts,
  listFleetVehicles,
  listInvoices,
  listMaintenance,
  listPolicies,
  listRoutes,
  markAlertRead,
  markAllAlertsRead,
  reoptimizeRoute,
  revokeApiKey,
  rotateApiKey,
  scheduleMaintenance,
  togglePolicy,
  updateFleetDriver,
  updateFleetVehicle,
  updateMaintenanceStatus,
  updateSso,
  upsertPolicy,
} from "./store";

const K = {
  vehicles: ["fleet-vehicles"] as const,
  vehicle: (id: string) => ["fleet-vehicle", id] as const,
  drivers: ["fleet-drivers"] as const,
  driver: (id: string) => ["fleet-driver", id] as const,
  shifts: ["fleet-shifts"] as const,
  costCenters: ["fleet-cost-centers"] as const,
  depots: ["fleet-depots"] as const,
  routes: ["fleet-routes"] as const,
  maintenance: ["fleet-maintenance"] as const,
  policies: ["fleet-policies"] as const,
  batch: ["fleet-batch"] as const,
  invoices: ["fleet-invoices"] as const,
  apiKeys: ["fleet-api-keys"] as const,
  sso: ["fleet-sso"] as const,
  alerts: ["fleet-alerts"] as const,
};

export const useFleetVehicles = () =>
  useQuery({ queryKey: K.vehicles, queryFn: listFleetVehicles });
export const useFleetVehicle = (id: string | undefined) =>
  useQuery({
    queryKey: K.vehicle(id ?? ""),
    queryFn: () => getFleetVehicle(id!),
    enabled: !!id,
  });
export const useFleetDrivers = () =>
  useQuery({ queryKey: K.drivers, queryFn: listFleetDrivers });
export const useFleetDriver = (id: string | undefined) =>
  useQuery({
    queryKey: K.driver(id ?? ""),
    queryFn: () => getFleetDriver(id!),
    enabled: !!id,
  });
export const useFleetShifts = () =>
  useQuery({ queryKey: K.shifts, queryFn: listFleetShifts });
export const useFleetCostCenters = () =>
  useQuery({ queryKey: K.costCenters, queryFn: listCostCenters });
export const useFleetDepots = () =>
  useQuery({ queryKey: K.depots, queryFn: listDepots });
export const useFleetRoutes = () =>
  useQuery({ queryKey: K.routes, queryFn: listRoutes });
export const useFleetMaintenance = () =>
  useQuery({ queryKey: K.maintenance, queryFn: listMaintenance });
export const useFleetPolicies = () =>
  useQuery({ queryKey: K.policies, queryFn: listPolicies });
export const useFleetBatch = () =>
  useQuery({ queryKey: K.batch, queryFn: listBatchReservations });
export const useFleetInvoices = () =>
  useQuery({ queryKey: K.invoices, queryFn: listInvoices });
export const useFleetApiKeys = () =>
  useQuery({ queryKey: K.apiKeys, queryFn: listApiKeys });
export const useFleetSso = () =>
  useQuery({ queryKey: K.sso, queryFn: getSso });
export const useFleetAlerts = () =>
  useQuery({ queryKey: K.alerts, queryFn: listAlerts });

// ---- mutations ----

export const useUpdateFleetVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FleetVehicle> }) =>
      updateFleetVehicle(id, patch),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: K.vehicles });
      qc.invalidateQueries({ queryKey: K.vehicle(v.id) });
    },
  });
};

export const useUpdateFleetDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Parameters<typeof updateFleetDriver>[1]>;
    }) => updateFleetDriver(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.drivers }),
  });
};

export const useScheduleMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: scheduleMaintenance,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.maintenance }),
  });
};

export const useUpdateMaintenanceStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: FleetMaintenanceOrder["status"];
    }) => updateMaintenanceStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.maintenance }),
  });
};

export const useUpsertPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policy: FleetPolicy) => upsertPolicy(policy),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.policies }),
  });
};

export const useTogglePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: togglePolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.policies }),
  });
};

export const useCreateBatchReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBatchReservation,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.batch }),
  });
};

export const useReoptimizeRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reoptimizeRoute,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.routes }),
  });
};

export const useCreateFleetApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { label: string; scopes: FleetApiScope[] }) =>
      createApiKey(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.apiKeys }),
  });
};

export const useRotateFleetApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rotateApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.apiKeys }),
  });
};

export const useRevokeFleetApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.apiKeys }),
  });
};

export const useUpdateFleetSso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<FleetSsoConfig>) => updateSso(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.sso }),
  });
};

export const useMarkFleetAlertRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.alerts }),
  });
};

export const useMarkAllFleetAlertsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllAlertsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.alerts }),
  });
};
