// React-query hooks for the Intel module.

import { useQuery } from "@tanstack/react-query";
import type { DateRange, IntelCity } from "./types";
import {
  exportCsv,
  getBenchmarks,
  getCohorts,
  getDemandHeatmap,
  getElasticity,
  getForecasts,
  getInfrastructureGap,
  getMarketOverview,
  listZones,
} from "./store";

const K = {
  zones: (c?: IntelCity) => ["intel", "zones", c] as const,
  overview: (c: IntelCity | "all", r: DateRange) =>
    ["intel", "overview", c, r] as const,
  heatmap: (c: IntelCity | "all", r: DateRange) =>
    ["intel", "heatmap", c, r] as const,
  gaps: (r: DateRange) => ["intel", "gaps", r] as const,
  forecast: (zoneId: string) => ["intel", "forecast", zoneId] as const,
  elasticity: () => ["intel", "elasticity"] as const,
  cohorts: () => ["intel", "cohorts"] as const,
  bench: () => ["intel", "bench"] as const,
  export: (k: "days" | "hours" | "bench") =>
    ["intel", "export", k] as const,
};

export const useIntelZones = (city?: IntelCity) =>
  useQuery({ queryKey: K.zones(city), queryFn: () => listZones(city) });

export const useIntelOverview = (
  city: IntelCity | "all",
  range: DateRange,
) =>
  useQuery({
    queryKey: K.overview(city, range),
    queryFn: () => getMarketOverview(city, range),
    staleTime: 60_000,
  });

export const useIntelHeatmap = (
  city: IntelCity | "all",
  range: DateRange,
) =>
  useQuery({
    queryKey: K.heatmap(city, range),
    queryFn: () => getDemandHeatmap(city, range),
    staleTime: 60_000,
  });

export const useIntelGaps = (range: DateRange) =>
  useQuery({
    queryKey: K.gaps(range),
    queryFn: () => getInfrastructureGap(range),
    staleTime: 60_000,
  });

export const useIntelForecast = (zoneId: string | undefined) =>
  useQuery({
    queryKey: K.forecast(zoneId ?? ""),
    queryFn: () => getForecasts(zoneId!),
    enabled: !!zoneId,
  });

export const useIntelElasticity = () =>
  useQuery({ queryKey: K.elasticity(), queryFn: () => getElasticity() });

export const useIntelCohorts = () =>
  useQuery({ queryKey: K.cohorts(), queryFn: () => getCohorts() });

export const useIntelBench = () =>
  useQuery({ queryKey: K.bench(), queryFn: () => getBenchmarks() });

export const useIntelExport = (kind: "days" | "hours" | "bench") =>
  useQuery({
    queryKey: K.export(kind),
    queryFn: () => exportCsv(kind),
  });
