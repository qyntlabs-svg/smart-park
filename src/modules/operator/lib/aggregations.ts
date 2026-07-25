// Operator SaaS aggregations — read-only helpers that call
// modules/ev/store.ts and compute network KPIs, utilization curves,
// revenue splits, and per-station summaries.
//
// This is the ONLY place the Operator module reaches into the EV store.
// Any UI that needs derived numbers should call these helpers (through the
// hooks in ../hooks.ts) rather than talking to the EV store directly.

import { listStations, getStation, getStationSessions } from "@/modules/ev/store";
import type { EvSession, EvStation } from "@/modules/ev/types";
import type {
  DailyMetric,
  OperatorNetworkKpis,
  StationSummary,
  UtilizationHeat,
} from "../types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------- session synthesis ----------
//
// The EV store only creates sessions when a user actually reserves & starts
// one. Real operator dashboards want 90 days of history to look useful, so we
// synthesise a realistic session history the first time an aggregation runs
// and cache it in-memory. It is derived from the station roster, so
// aggregate KPIs are always internally consistent.

let SYNTH_CACHE: { key: string; sessions: EvSession[] } | null = null;

function synthesiseHistory(stations: EvStation[]): EvSession[] {
  const key = stations.map((s) => s.id).sort().join("|");
  if (SYNTH_CACHE?.key === key) return SYNTH_CACHE.sessions;

  const sessions: EvSession[] = [];
  const now = new Date();
  stations.forEach((s, sIdx) => {
    const totalGuns = s.connectors.reduce((n, c) => n + c.count, 0);
    // 2 to 8 sessions per day per station depending on connector count
    const perDay = Math.max(2, Math.min(8, Math.round(totalGuns * 0.9)));
    for (let d = 0; d < 90; d++) {
      const dayFactor =
        1 + 0.15 * Math.sin(d / 5) + (d < 21 ? 0.15 : 0) - (d > 60 ? 0.05 : 0);
      const cnt = Math.max(0, Math.round(perDay * dayFactor));
      for (let i = 0; i < cnt; i++) {
        const connector = s.connectors[i % s.connectors.length];
        const start = new Date(now);
        start.setDate(now.getDate() - d);
        // Hour distribution — peaks 8-10, 17-22
        const rnd = ((sIdx * 7 + i * 11 + d * 13) % 24) / 24;
        const hour = rnd < 0.35 ? 8 + Math.floor(rnd * 8) : 17 + Math.floor(rnd * 6);
        start.setHours(hour, (i * 13) % 60, 0, 0);
        const durationMin = 25 + ((i + d) % 45);
        const kwh = Math.min(
          connector.powerKw * (durationMin / 60),
          connector.powerKw * 0.9,
        );
        const cost = Math.round(kwh * s.pricing.amount);
        const end = new Date(start.getTime() + durationMin * 60_000);
        sessions.push({
          id: `synth-${s.id}-${d}-${i}`,
          reservationId: `synth-res-${s.id}-${d}-${i}`,
          stationId: s.id,
          chargerId: connector.id,
          connectorType: connector.type,
          ratedKw: connector.powerKw,
          vehicleId: `veh-${(sIdx + i) % 40}`,
          userId: `usr-${(sIdx + d) % 250}`,
          status: "completed",
          scheduledFor: start.toISOString(),
          startedAt: start.toISOString(),
          endedAt: end.toISOString(),
          kwhDelivered: Math.round(kwh * 10) / 10,
          currentKw: 0,
          peakKw: connector.powerKw,
          cost,
          targetKwh: kwh,
          pricePerKwh: s.pricing.amount,
          taxPct: s.pricing.taxPct ?? 18,
          idleFeePerMinute: s.pricing.idleFeePerMinute ?? 0,
          lastTickAt: end.toISOString(),
          powerDip: false,
          dipCooldown: 0,
        });
      }
    }
  });

  SYNTH_CACHE = { key, sessions };
  return sessions;
}

async function getAllSessions(): Promise<EvSession[]> {
  const stations = await listStations();
  const real = (await Promise.all(stations.map((s) => getStationSessions(s.id)))).flat();
  const synth = synthesiseHistory(stations);
  return [...real, ...synth];
}

// ---------- network KPIs ----------

export async function computeNetworkKpis(): Promise<OperatorNetworkKpis> {
  const stations = await listStations();
  const sessions = await getAllSessions();

  const activeStations = stations.filter((s) => s.status === "active").length;
  const offlineStations = stations.filter((s) => s.status === "paused").length;

  let connectorsTotal = 0;
  let connectorsAvailable = 0;
  let connectorsInUse = 0;
  let connectorsOffline = 0;
  stations.forEach((s) => {
    s.connectors.forEach((c) => {
      connectorsTotal += c.count;
      const statuses =
        c.status ??
        Array.from({ length: c.count }, (_, i) =>
          i < c.available ? "available" : "in_use",
        );
      statuses.forEach((st) => {
        if (st === "available") connectorsAvailable++;
        else if (st === "in_use") connectorsInUse++;
        else connectorsOffline++;
      });
    });
  });

  const uptimePct =
    connectorsTotal === 0
      ? 0
      : Math.round(((connectorsTotal - connectorsOffline) / connectorsTotal) * 100);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionsToday = sessions.filter(
    (s) => new Date(s.startedAt ?? s.scheduledFor).getTime() >= today.getTime(),
  );

  const kwhLast90d = sessions.reduce((n, s) => n + s.kwhDelivered, 0);
  const revenueLast90d = sessions.reduce((n, s) => n + s.cost, 0);
  const durations = sessions
    .filter((s) => s.startedAt && s.endedAt)
    .map((s) => (new Date(s.endedAt!).getTime() - new Date(s.startedAt!).getTime()) / 60_000);
  const avgSessionMinutes =
    durations.length === 0
      ? 0
      : Math.round(durations.reduce((n, m) => n + m, 0) / durations.length);

  // Utilization = fraction of connector-hours actually in-use across the last 24h
  const in24h = sessions.filter(
    (s) => new Date(s.startedAt ?? s.scheduledFor).getTime() > Date.now() - 86400000,
  );
  const usedMinutes = in24h.reduce((n, s) => {
    const start = new Date(s.startedAt ?? s.scheduledFor).getTime();
    const end = new Date(s.endedAt ?? Date.now()).getTime();
    return n + Math.max(0, (end - start) / 60_000);
  }, 0);
  const capacityMinutes = connectorsTotal * 24 * 60;
  const utilizationPct =
    capacityMinutes === 0 ? 0 : Math.min(100, Math.round((usedMinutes / capacityMinutes) * 100));

  const slaBreachCount = Math.max(1, Math.round(offlineStations * 1.7 + connectorsOffline * 0.35));

  return {
    uptimePct,
    totalStations: stations.length,
    activeStations,
    offlineStations,
    totalConnectors: connectorsTotal,
    connectorsAvailable,
    connectorsInUse,
    connectorsOffline,
    sessionsLast90d: sessions.length,
    sessionsToday: sessionsToday.length,
    kwhLast90d: Math.round(kwhLast90d),
    revenueLast90d: Math.round(revenueLast90d),
    avgSessionMinutes,
    slaBreachCount,
    utilizationPct,
  };
}

// ---------- per-station summaries ----------

export async function computeStationSummaries(): Promise<StationSummary[]> {
  const stations = await listStations();
  const sessions = await getAllSessions();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return stations.map((s) => {
    const stationSessions = sessions.filter((x) => x.stationId === s.id);
    const todaySessions = stationSessions.filter(
      (x) => new Date(x.startedAt ?? x.scheduledFor).getTime() >= today.getTime(),
    );
    const connectorsTotal = s.connectors.reduce((n, c) => n + c.count, 0);
    let connectorsAvailable = 0;
    let connectorsOffline = 0;
    s.connectors.forEach((c) => {
      const statuses =
        c.status ??
        Array.from({ length: c.count }, (_, i) =>
          i < c.available ? "available" : "in_use",
        );
      statuses.forEach((st) => {
        if (st === "available") connectorsAvailable++;
        if (st === "offline" || st === "maintenance") connectorsOffline++;
      });
    });
    const activeSessions = stationSessions.filter((x) => x.status === "active").length;
    const todayKwh = Math.round(
      todaySessions.reduce((n, x) => n + x.kwhDelivered, 0),
    );
    const todayRevenue = Math.round(todaySessions.reduce((n, x) => n + x.cost, 0));
    const uptimePct =
      connectorsTotal === 0
        ? 100
        : Math.round(((connectorsTotal - connectorsOffline) / connectorsTotal) * 100);
    // simplistic utilization: today's sessions * 45min / (connectors*24h*60)
    const utilizationPct = Math.min(
      100,
      Math.round(((todaySessions.length * 45) / (connectorsTotal * 24 * 60)) * 100),
    );
    return {
      stationId: s.id,
      name: s.name,
      address: s.address,
      status: s.status,
      uptimePct,
      connectorsTotal,
      connectorsAvailable,
      connectorsOffline,
      activeSessions,
      todaySessions: todaySessions.length,
      todayKwh,
      todayRevenue,
      utilizationPct,
    };
  });
}

// ---------- station detail context ----------

export async function computeStationDetail(stationId: string): Promise<
  | {
      station: EvStation;
      sessions: EvSession[];
      todayKwh: number;
      todayRevenue: number;
      last7dSessions: DailyMetric[];
    }
  | null
> {
  const station = await getStation(stationId);
  if (!station) return null;
  const all = await getAllSessions();
  const sessions = all
    .filter((s) => s.stationId === stationId)
    .sort(
      (a, b) =>
        new Date(b.startedAt ?? b.scheduledFor).getTime() -
        new Date(a.startedAt ?? a.scheduledFor).getTime(),
    );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter(
    (s) => new Date(s.startedAt ?? s.scheduledFor).getTime() >= today.getTime(),
  );
  const todayKwh = Math.round(todaySessions.reduce((n, s) => n + s.kwhDelivered, 0));
  const todayRevenue = Math.round(todaySessions.reduce((n, s) => n + s.cost, 0));

  // Last 7 days daily metric
  const dailyMap = new Map<string, DailyMetric>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key.slice(5), sessions: 0, kwh: 0, revenue: 0 });
  }
  sessions.forEach((s) => {
    const key = new Date(s.startedAt ?? s.scheduledFor).toISOString().slice(0, 10);
    const rec = dailyMap.get(key);
    if (!rec) return;
    rec.sessions += 1;
    rec.kwh += s.kwhDelivered;
    rec.revenue += s.cost;
  });
  const last7dSessions = Array.from(dailyMap.values()).map((d) => ({
    ...d,
    kwh: Math.round(d.kwh),
    revenue: Math.round(d.revenue),
  }));

  return {
    station,
    sessions: sessions.slice(0, 40),
    todayKwh,
    todayRevenue,
    last7dSessions,
  };
}

// ---------- utilization heatmap (day × hour) ----------

export async function computeUtilizationHeatmap(): Promise<UtilizationHeat[]> {
  const sessions = await getAllSessions();
  const grid: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.startedAt ?? s.scheduledFor);
    const dow = d.getDay();
    const hour = d.getHours();
    const key = `${dow}-${hour}`;
    grid[key] = (grid[key] ?? 0) + 1;
  });
  const out: UtilizationHeat[] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      out.push({
        dayLabel: DAY_LABELS[dow],
        hour,
        value: grid[`${dow}-${hour}`] ?? 0,
      });
    }
  }
  return out;
}

// ---------- daily revenue trend ----------

export async function computeDailyRevenue(days = 30): Promise<DailyMetric[]> {
  const sessions = await getAllSessions();
  const now = new Date();
  const rows: DailyMetric[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    rows.push({ date: d.toISOString().slice(5, 10), sessions: 0, kwh: 0, revenue: 0 });
  }
  const keyIndex = new Map(rows.map((r, i) => [r.date, i]));
  sessions.forEach((s) => {
    const d = new Date(s.startedAt ?? s.scheduledFor);
    const key = d.toISOString().slice(5, 10);
    const idx = keyIndex.get(key);
    if (idx == null) return;
    rows[idx].sessions += 1;
    rows[idx].kwh += s.kwhDelivered;
    rows[idx].revenue += s.cost;
  });
  return rows.map((r) => ({
    ...r,
    kwh: Math.round(r.kwh),
    revenue: Math.round(r.revenue),
  }));
}

// ---------- revenue split ----------

export interface RevenueSplit {
  gross: number;
  platformFee: number;
  taxes: number;
  net: number;
}

export async function computeRevenueSplit(days = 30): Promise<RevenueSplit> {
  const rows = await computeDailyRevenue(days);
  const gross = rows.reduce((n, r) => n + r.revenue, 0);
  const platformFee = Math.round(gross * 0.08);
  const taxes = Math.round(gross * 0.18 * 0.6); // half GST paid by platform pass-through
  const net = gross - platformFee - taxes;
  return { gross, platformFee, taxes, net };
}
