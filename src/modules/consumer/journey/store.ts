// Mock store for the Journey planner (C-45) + One-Tap (C-46).
// The plan(from,to) function fabricates a plausible multi-leg itinerary so the
// UI has content without any real routing engine.

import { makeId, readJson, writeJson } from "@/shared/lib/storage";
import type { Journey, JourneyLeg } from "./types";

const KEY = "consumerJourneys";

const SEED: Journey[] = [
  {
    id: "jrn-seed-1",
    userId: "guest",
    from: "Home · T Nagar",
    to: "Office · OMR",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    totalMinutes: 78,
    totalCost: 245,
    legs: [
      { id: "l1", kind: "drive", title: "Drive to charger", subtitle: "Velachery", minutes: 22, cost: 0, km: 14 },
      { id: "l2", kind: "charge", title: "Top up at EcoCharge", subtitle: "20 kWh · Type 2", minutes: 25, cost: 300, kwh: 20 },
      { id: "l3", kind: "drive", title: "Drive to office", subtitle: "OMR Sholinganallur", minutes: 26, cost: 0, km: 18 },
      { id: "l4", kind: "park", title: "Park at Office Complex", subtitle: "3h covered · pre-book", minutes: 5, cost: 90 },
    ],
    reserved: true,
  },
  {
    id: "jrn-seed-2",
    userId: "guest",
    from: "Home · T Nagar",
    to: "Marina Beach",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    totalMinutes: 42,
    totalCost: 120,
    legs: [
      { id: "l1", kind: "drive", title: "Drive to beach", subtitle: "Direct route", minutes: 32, cost: 0, km: 12 },
      { id: "l2", kind: "park", title: "Marina Public Lot", subtitle: "2h", minutes: 10, cost: 60 },
    ],
    reserved: true,
  },
];

function loadAll(): Journey[] {
  const existing = readJson<Journey[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function saveAll(list: Journey[]) {
  writeJson(KEY, list);
}

export async function listJourneys(userId: string): Promise<Journey[]> {
  return loadAll()
    .filter((j) => j.userId === userId || j.userId === "guest")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getJourney(id: string): Promise<Journey | null> {
  return loadAll().find((j) => j.id === id) ?? null;
}

/** Build a plausible plan for a from → to string. Pure function — no side effects. */
export function buildJourneyPreview(from: string, to: string): Journey {
  const looksLong =
    to.toLowerCase().includes("bangalore") ||
    to.toLowerCase().includes("mysore") ||
    to.toLowerCase().includes("pondi") ||
    to.length > 22;

  const legs: JourneyLeg[] = looksLong
    ? [
        { id: makeId("leg"), kind: "drive",  title: "Drive to first charger", subtitle: "Highway on-ramp", minutes: 55, cost: 0, km: 62 },
        { id: makeId("leg"), kind: "charge", title: "Fast charge · CCS 60kW", subtitle: "30 kWh", minutes: 32, cost: 540, kwh: 30 },
        { id: makeId("leg"), kind: "drive",  title: "Drive to mid-way stop",   subtitle: "State highway", minutes: 105, cost: 0, km: 118 },
        { id: makeId("leg"), kind: "charge", title: "Top up · CCS 50kW",       subtitle: "25 kWh", minutes: 28, cost: 450, kwh: 25 },
        { id: makeId("leg"), kind: "drive",  title: "Drive to destination",    subtitle: `Arrive ${to}`, minutes: 80, cost: 0, km: 96 },
        { id: makeId("leg"), kind: "park",   title: "Reserved parking",        subtitle: "4h covered", minutes: 5, cost: 160 },
      ]
    : [
        { id: makeId("leg"), kind: "drive",  title: "Drive to charger",        subtitle: "Nearest partner", minutes: 18, cost: 0, km: 12 },
        { id: makeId("leg"), kind: "charge", title: "Top up · Type 2 22kW",    subtitle: "18 kWh", minutes: 24, cost: 270, kwh: 18 },
        { id: makeId("leg"), kind: "drive",  title: "Drive to destination",    subtitle: `Arrive ${to}`, minutes: 24, cost: 0, km: 15 },
        { id: makeId("leg"), kind: "park",   title: "Reserved parking",        subtitle: "2h covered", minutes: 5, cost: 60 },
      ];

  const totalMinutes = legs.reduce((n, l) => n + l.minutes, 0);
  const totalCost = legs.reduce((n, l) => n + l.cost, 0);
  return {
    id: makeId("jrn"),
    userId: "guest",
    from,
    to,
    createdAt: new Date().toISOString(),
    totalMinutes,
    totalCost,
    legs,
  };
}

export async function saveJourney(journey: Journey): Promise<Journey> {
  const list = loadAll();
  const idx = list.findIndex((j) => j.id === journey.id);
  if (idx === -1) list.unshift(journey);
  else list[idx] = journey;
  saveAll(list);
  return journey;
}

export async function confirmJourney(id: string): Promise<Journey | null> {
  const list = loadAll();
  const idx = list.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  const updated: Journey = { ...list[idx], reserved: true };
  list[idx] = updated;
  saveAll(list);
  return updated;
}

/** For C-46 One-Tap — re-book an existing journey with new datetime. */
export async function rebookJourney(id: string): Promise<Journey | null> {
  const src = await getJourney(id);
  if (!src) return null;
  const clone: Journey = {
    ...src,
    id: makeId("jrn"),
    createdAt: new Date().toISOString(),
    reserved: true,
  };
  const list = loadAll();
  list.unshift(clone);
  saveAll(list);
  return clone;
}
