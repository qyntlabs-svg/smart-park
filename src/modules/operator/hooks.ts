// React-query wrappers for the Operator SaaS.
// KPIs / heatmaps / revenue are computed from the EV store via ./lib/aggregations.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  computeDailyRevenue,
  computeNetworkKpis,
  computeRevenueSplit,
  computeStationDetail,
  computeStationSummaries,
  computeUtilizationHeatmap,
} from "./lib/aggregations";
import {
  advanceFirmwareJobs,
  advanceMaintenance,
  createMaintenanceOrder,
  deletePricingRule,
  listFirmwareBundles,
  listFirmwareJobs,
  listMaintenanceOrders,
  listOperatorNotices,
  listPayouts,
  listPricingRules,
  listRoamingEntries,
  listRoamingPartners,
  listSlaIncidents,
  markAllOperatorNoticesRead,
  markOperatorNoticeRead,
  queueFirmwareJob,
  togglePricingRule,
  upsertPricingRule,
} from "./store";
import type {
  MaintenanceWorkOrder,
  PricingRule,
} from "./types";

const K = {
  kpis: ["operator-kpis"] as const,
  stationSummaries: ["operator-station-summaries"] as const,
  stationDetail: (id: string) => ["operator-station-detail", id] as const,
  utilization: ["operator-utilization"] as const,
  daily: (days: number) => ["operator-daily", days] as const,
  revenueSplit: (days: number) => ["operator-revenue-split", days] as const,
  pricing: ["operator-pricing"] as const,
  maintenance: ["operator-maintenance"] as const,
  bundles: ["operator-firmware-bundles"] as const,
  jobs: ["operator-firmware-jobs"] as const,
  payouts: ["operator-payouts"] as const,
  roamingPartners: ["operator-roaming-partners"] as const,
  roamingEntries: ["operator-roaming-entries"] as const,
  sla: ["operator-sla"] as const,
  notices: ["operator-notices"] as const,
};

// aggregations
export const useOperatorKpis = () =>
  useQuery({ queryKey: K.kpis, queryFn: computeNetworkKpis });
export const useStationSummaries = () =>
  useQuery({ queryKey: K.stationSummaries, queryFn: computeStationSummaries });
export const useStationDetail = (id: string | undefined) =>
  useQuery({
    queryKey: K.stationDetail(id ?? ""),
    queryFn: () => computeStationDetail(id!),
    enabled: !!id,
  });
export const useUtilizationHeat = () =>
  useQuery({ queryKey: K.utilization, queryFn: computeUtilizationHeatmap });
export const useDailyRevenue = (days = 30) =>
  useQuery({ queryKey: K.daily(days), queryFn: () => computeDailyRevenue(days) });
export const useRevenueSplit = (days = 30) =>
  useQuery({ queryKey: K.revenueSplit(days), queryFn: () => computeRevenueSplit(days) });

// local
export const usePricingRules = () =>
  useQuery({ queryKey: K.pricing, queryFn: listPricingRules });
export const useMaintenanceOrders = () =>
  useQuery({ queryKey: K.maintenance, queryFn: listMaintenanceOrders });
export const useFirmwareBundles = () =>
  useQuery({ queryKey: K.bundles, queryFn: listFirmwareBundles });
export const useFirmwareJobs = () =>
  useQuery({ queryKey: K.jobs, queryFn: listFirmwareJobs });
export const usePayouts = () =>
  useQuery({ queryKey: K.payouts, queryFn: listPayouts });
export const useRoamingPartners = () =>
  useQuery({ queryKey: K.roamingPartners, queryFn: listRoamingPartners });
export const useRoamingEntries = () =>
  useQuery({ queryKey: K.roamingEntries, queryFn: listRoamingEntries });
export const useSlaIncidents = () =>
  useQuery({ queryKey: K.sla, queryFn: listSlaIncidents });
export const useOperatorNotices = () =>
  useQuery({ queryKey: K.notices, queryFn: listOperatorNotices });

// mutations
export const useUpsertPricingRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: PricingRule) => upsertPricingRule(rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.pricing }),
  });
};
export const useTogglePricingRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: togglePricingRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.pricing }),
  });
};
export const useDeletePricingRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePricingRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.pricing }),
  });
};

export const useCreateMaintenanceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      stationId: string;
      connectorId?: string;
      issue: string;
      severity: MaintenanceWorkOrder["severity"];
    }) => createMaintenanceOrder(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.maintenance }),
  });
};
export const useAdvanceMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaintenanceWorkOrder["status"] }) =>
      advanceMaintenance(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.maintenance }),
  });
};

export const useQueueFirmwareJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { stationId: string; bundleId: string }) =>
      queueFirmwareJob(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.jobs }),
  });
};

export const useAdvanceFirmwareJobs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => advanceFirmwareJobs(),
    onSuccess: (changed) => {
      if (changed) qc.invalidateQueries({ queryKey: K.jobs });
    },
  });
};

export const useMarkOperatorNoticeRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markOperatorNoticeRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.notices }),
  });
};

export const useMarkAllOperatorNoticesRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllOperatorNoticesRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.notices }),
  });
};
