// Mock store for the insights module (C-47..C-50).
// Pure derived data — kept side-effect-free so screens can render without any
// prior setup. Streaks are persisted to localStorage so the UI feels real.

import { readJson, writeJson } from "@/shared/lib/storage";
import type {
  Badge,
  CityAverage,
  EnergyMonth,
  HealthScore,
  SavingsMonth,
  StreakState,
} from "./types";

// ---------- Health score (C-47) ----------

export async function getHealthScore(vehicleId: string): Promise<HealthScore> {
  // Deterministic pseudo-score off the vehicle id so it doesn't jitter between
  // renders. Real backend would compute this from service history + telematics.
  const hash = simpleHash(vehicleId || "default");
  const score = 62 + (hash % 33); // 62..94
  const band =
    score >= 90
      ? "excellent"
      : score >= 75
        ? "good"
        : score >= 60
          ? "fair"
          : "poor";

  return {
    vehicleId,
    score,
    band,
    updatedAt: new Date().toISOString(),
    categories: [
      { key: "battery",  label: "Battery",     score: 85, note: "Healthy — ~92% state of health" },
      { key: "brakes",   label: "Brakes",      score: 72, note: "Pads at 45% — replace within 2,500 km" },
      { key: "tyres",    label: "Tyres",       score: 78, note: "Even wear — rotate at next service" },
      { key: "service",  label: "Service log", score: 66, note: "Last service 4 months ago" },
      { key: "software", label: "Software",    score: 92, note: "Up-to-date" },
    ],
    recommendations: [
      {
        id: "r1",
        title: "Schedule brake pad replacement",
        body: "Front pads at 45% life. Book a slot this month to avoid a follow-up visit.",
        cta: { label: "Book mechanic", route: "/mechanics" },
      },
      {
        id: "r2",
        title: "Book your 40k-km service",
        body: "Nearby SmartFix has weekend slots. Free health-check included.",
        cta: { label: "See shops", route: "/mechanics" },
      },
    ],
  };
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// ---------- Energy insights (C-48) ----------

export async function getEnergyMonths(): Promise<EnergyMonth[]> {
  return [
    { month: "Apr", kwh: 42, cost: 720,  costPerKm: 2.4 },
    { month: "May", kwh: 51, cost: 880,  costPerKm: 2.3 },
    { month: "Jun", kwh: 47, cost: 810,  costPerKm: 2.5 },
    { month: "Jul", kwh: 61, cost: 1120, costPerKm: 2.6 },
    { month: "Aug", kwh: 58, cost: 1060, costPerKm: 2.4 },
    { month: "Sep", kwh: 66, cost: 1180, costPerKm: 2.2 },
  ];
}

export async function getCityAverage(): Promise<CityAverage> {
  return { kwh: 72, cost: 1450, costPerKm: 3.1 };
}

// ---------- Savings summary (C-49) ----------

export async function getSavingsMonths(): Promise<SavingsMonth[]> {
  return [
    { month: "Apr", saved: 780 },
    { month: "May", saved: 910 },
    { month: "Jun", saved: 860 },
    { month: "Jul", saved: 1050 },
    { month: "Aug", saved: 1180 },
    { month: "Sep", saved: 1240 },
  ];
}

// ---------- Streaks & milestones (C-50) ----------

const STREAK_KEY = "consumerStreaksState";

const SEED_BADGES: Badge[] = [
  { id: "first_charge",   label: "First charge",       description: "Completed your first EV top-up",       emoji: "⚡", unlockedAt: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: "week_streak_4",  label: "4-week streak",      description: "Used SmartPark 4 weeks in a row",       emoji: "🔥", unlockedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "night_owl",      label: "Night owl",          description: "Charged after midnight — cheaper rates", emoji: "🌙" },
  { id: "route_master",   label: "Route master",       description: "Planned a 3+ stop journey",             emoji: "🗺️" },
  { id: "green_800",      label: "Green 800",          description: "Saved ₹800 in one month",                emoji: "🌱", unlockedAt: new Date(Date.now() - 86400000 * 12).toISOString() },
  { id: "sos_helper",     label: "Community helper",   description: "Referred a friend who joined",           emoji: "🤝" },
];

export async function getStreakState(): Promise<StreakState> {
  const persisted = readJson<StreakState | null>(STREAK_KEY, null);
  if (persisted) return persisted;
  const initial: StreakState = {
    weeksActive: 6,
    currentWeekActive: true,
    lastActiveWeek: new Date().toISOString(),
    badges: SEED_BADGES,
  };
  writeJson(STREAK_KEY, initial);
  return initial;
}

/** Nudge streak — flips currentWeekActive true if not already. */
export async function markStreakActive(): Promise<StreakState> {
  const current = await getStreakState();
  if (current.currentWeekActive) return current;
  const next: StreakState = {
    ...current,
    currentWeekActive: true,
    weeksActive: current.weeksActive + 1,
    lastActiveWeek: new Date().toISOString(),
  };
  writeJson(STREAK_KEY, next);
  return next;
}
