// Mobility Intelligence — data access layer.
//
// The heavy synthesized dataset (20 zones × 90 days × 24 hours) is generated
// once via the deterministic seed in ./lib/mock-data, then cached in
// localStorage. Same shape as the ev/rental stores so it swaps 1:1 for a
// real analytics API later.

import { readJson, writeJson } from "@/shared/lib/storage";
import type {
  DateRange,
  IntelCity,
  IntelCohortRow,
  IntelDayCell,
  IntelElasticityPoint,
  IntelHourCell,
  IntelProviderBench,
  IntelZone,
} from "./types";
import {
  generateBenchmarks,
  generateCells,
  generateCohorts,
  generateElasticity,
  getZones,
} from "./lib/mock-data";

const DAYS_KEY = "intelDays_v1";
const HOURS_KEY = "intelHours_v1";
const BENCH_KEY = "intelBench_v1";
const COHORT_KEY = "intelCohorts_v1";
const ELAST_KEY = "intelElasticity_v1";

let zonesCache: IntelZone[] | null = null;

function loadZones(): IntelZone[] {
  if (zonesCache) return zonesCache;
  zonesCache = getZones();
  return zonesCache;
}

function loadDays(): IntelDayCell[] {
  const cached = readJson<IntelDayCell[] | null>(DAYS_KEY, null);
  if (cached && cached.length > 0) return cached;
  const { days, hours } = generateCells();
  writeJson(DAYS_KEY, days);
  writeJson(HOURS_KEY, hours);
  return days;
}

function loadHours(): IntelHourCell[] {
  const cached = readJson<IntelHourCell[] | null>(HOURS_KEY, null);
  if (cached && cached.length > 0) return cached;
  // If days was seeded but hours got cleared, regenerate both.
  const { days, hours } = generateCells();
  writeJson(DAYS_KEY, days);
  writeJson(HOURS_KEY, hours);
  return hours;
}

function loadBench(): IntelProviderBench[] {
  const cached = readJson<IntelProviderBench[] | null>(BENCH_KEY, null);
  if (cached && cached.length > 0) return cached;
  const data = generateBenchmarks();
  writeJson(BENCH_KEY, data);
  return data;
}

function loadCohorts(): IntelCohortRow[] {
  const cached = readJson<IntelCohortRow[] | null>(COHORT_KEY, null);
  if (cached && cached.length > 0) return cached;
  const data = generateCohorts();
  writeJson(COHORT_KEY, data);
  return data;
}

function loadElasticity(): IntelElasticityPoint[] {
  const cached = readJson<IntelElasticityPoint[] | null>(ELAST_KEY, null);
  if (cached && cached.length > 0) return cached;
  const data = generateElasticity();
  writeJson(ELAST_KEY, data);
  return data;
}

// ── date-range helpers ─────────────────────────────────────────────────

function rangeToDays(r: DateRange): number {
  return r === "7d" ? 7 : r === "30d" ? 30 : 90;
}

function withinRange(dateISO: string, range: DateRange): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeToDays(range));
  return new Date(dateISO) >= cutoff;
}

// ── Public API ────────────────────────────────────────────────────────

export async function listZones(city?: IntelCity): Promise<IntelZone[]> {
  const all = loadZones();
  return city ? all.filter((z) => z.city === city) : all;
}

export async function getMarketOverview(
  city: IntelCity | "all",
  range: DateRange,
): Promise<{
  totalSessions: number;
  totalGmv: number;
  totalUnmet: number;
  uniqueUsers: number;
  series: Array<{ date: string; sessions: number; gmv: number; unmet: number }>;
  growthPct: number;
}> {
  const zones = loadZones();
  const zoneIds = new Set(
    zones.filter((z) => city === "all" || z.city === city).map((z) => z.id),
  );
  const days = loadDays().filter(
    (d) => zoneIds.has(d.zoneId) && withinRange(d.date, range),
  );

  const byDate = new Map<string, { sessions: number; gmv: number; unmet: number; users: number }>();
  for (const d of days) {
    const cur = byDate.get(d.date) ?? { sessions: 0, gmv: 0, unmet: 0, users: 0 };
    cur.sessions += d.sessions;
    cur.gmv += d.gmv;
    cur.unmet += d.unmet;
    cur.users += d.uniqueUsers;
    byDate.set(d.date, cur);
  }
  const series = [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, v]) => ({
      date,
      sessions: v.sessions,
      gmv: v.gmv,
      unmet: v.unmet,
    }));
  const totalSessions = series.reduce((n, r) => n + r.sessions, 0);
  const totalGmv = series.reduce((n, r) => n + r.gmv, 0);
  const totalUnmet = series.reduce((n, r) => n + r.unmet, 0);
  const uniqueUsers = [...byDate.values()].reduce((n, r) => n + r.users, 0);

  // growth vs first-half of window
  const half = Math.floor(series.length / 2) || 1;
  const first = series.slice(0, half).reduce((n, r) => n + r.sessions, 0);
  const second = series.slice(half).reduce((n, r) => n + r.sessions, 0);
  const growthPct = first === 0 ? 0 : Math.round(((second - first) / first) * 1000) / 10;

  return { totalSessions, totalGmv, totalUnmet, uniqueUsers, series, growthPct };
}

export async function getDemandHeatmap(
  city: IntelCity | "all",
  range: DateRange,
): Promise<
  Array<{ zone: IntelZone; unmet: number; sessions: number; gapPct: number }>
> {
  const zones = loadZones();
  const days = loadDays().filter((d) => withinRange(d.date, range));
  const byZone = new Map<string, { unmet: number; sessions: number }>();
  for (const d of days) {
    const cur = byZone.get(d.zoneId) ?? { unmet: 0, sessions: 0 };
    cur.unmet += d.unmet;
    cur.sessions += d.sessions;
    byZone.set(d.zoneId, cur);
  }
  return zones
    .filter((z) => city === "all" || z.city === city)
    .map((z) => {
      const v = byZone.get(z.id) ?? { unmet: 0, sessions: 0 };
      const total = v.sessions + v.unmet;
      return {
        zone: z,
        unmet: v.unmet,
        sessions: v.sessions,
        gapPct: total === 0 ? 0 : Math.round((v.unmet / total) * 1000) / 10,
      };
    });
}

export async function getInfrastructureGap(
  range: DateRange,
): Promise<
  Array<{
    zone: IntelZone;
    unmet: number;
    supply: number;
    recommendedChargers: number;
    projectedRoiMonths: number;
  }>
> {
  const zones = loadZones();
  const days = loadDays().filter((d) => withinRange(d.date, range));
  const byZone = new Map<string, number>();
  for (const d of days) byZone.set(d.zoneId, (byZone.get(d.zoneId) ?? 0) + d.unmet);
  return zones
    .map((z) => {
      const unmet = byZone.get(z.id) ?? 0;
      const supply = z.supplyChargers;
      const recommended = Math.max(0, Math.round(unmet / (rangeToDays("90d") * 3)));
      const dailyIncremental = recommended * 3; // sessions/day/charger
      const gmvPerSession = 320;
      const monthlyGmv = dailyIncremental * gmvPerSession * 30;
      const chargerCapex = 900000;
      const monthlyMargin = monthlyGmv * 0.25;
      const projectedRoiMonths =
        monthlyMargin <= 0
          ? 999
          : Math.round((chargerCapex * (recommended || 1)) / (monthlyMargin || 1));
      return {
        zone: z,
        unmet,
        supply,
        recommendedChargers: recommended,
        projectedRoiMonths: Math.min(999, projectedRoiMonths),
      };
    })
    .sort((a, b) => b.unmet - a.unmet);
}

export async function getForecasts(
  zoneId: string,
): Promise<
  Array<{
    date: string;
    actual: number | null;
    forecast: number;
    lower: number;
    upper: number;
  }>
> {
  const days = loadDays()
    .filter((d) => d.zoneId === zoneId)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (days.length === 0) return [];

  const values = days.map((d) => d.sessions);
  // Simple 7-day moving average for forecast.
  const window = 7;
  const output: Array<{
    date: string;
    actual: number | null;
    forecast: number;
    lower: number;
    upper: number;
  }> = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance =
      slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
    const std = Math.sqrt(variance);
    output.push({
      date: days[i].date,
      actual: values[i],
      forecast: Math.round(mean),
      lower: Math.max(0, Math.round(mean - std)),
      upper: Math.round(mean + std),
    });
  }
  // Extend 14 days forward.
  const last = values.slice(-window);
  const lastMean = last.reduce((a, b) => a + b, 0) / last.length;
  const lastStd = Math.sqrt(
    last.reduce((a, b) => a + Math.pow(b - lastMean, 2), 0) / last.length,
  );
  let forwardBase = lastMean;
  const trendPerDay = lastMean * 0.004;
  const lastDate = new Date(days[days.length - 1].date);
  for (let f = 1; f <= 14; f++) {
    const nd = new Date(lastDate);
    nd.setDate(nd.getDate() + f);
    forwardBase += trendPerDay;
    const spread = lastStd * (1 + f * 0.05);
    output.push({
      date: nd.toISOString().slice(0, 10),
      actual: null,
      forecast: Math.round(forwardBase),
      lower: Math.max(0, Math.round(forwardBase - spread)),
      upper: Math.round(forwardBase + spread),
    });
  }
  return output;
}

export async function getElasticity(): Promise<IntelElasticityPoint[]> {
  return loadElasticity();
}

export async function getCohorts(): Promise<IntelCohortRow[]> {
  return loadCohorts();
}

export async function getBenchmarks(): Promise<IntelProviderBench[]> {
  return loadBench();
}

// ── Data export helpers ────────────────────────────────────────────────

export async function exportCsv(kind: "days" | "hours" | "bench"): Promise<string> {
  if (kind === "days") {
    const rows = loadDays();
    const head = "date,zoneId,sessions,gmv,unmet,avgPrice,uniqueUsers";
    return [
      head,
      ...rows.map(
        (d) =>
          `${d.date},${d.zoneId},${d.sessions},${d.gmv},${d.unmet},${d.avgPrice},${d.uniqueUsers}`,
      ),
    ].join("\n");
  }
  if (kind === "hours") {
    const rows = loadHours().slice(0, 5000); // cap so CSV isn't 43k rows
    const head = "date,hour,zoneId,demand,supplyBusy";
    return [
      head,
      ...rows.map(
        (h) =>
          `${h.date},${h.hour},${h.zoneId},${h.demand},${h.supplyBusy}`,
      ),
    ].join("\n");
  }
  const rows = loadBench();
  const head = "providerId,providerName,city,uptimePct,utilizationPct,avgRating,gmv";
  return [
    head,
    ...rows.map(
      (r) =>
        `${r.providerId},${r.providerName.replace(/,/g, " ")},${r.city},${r.uptimePct},${r.utilizationPct},${r.avgRating},${r.gmv}`,
    ),
  ].join("\n");
}
