// Mobility Intelligence — deterministic mock data generator.
//
// Generates a 90-day × 20-zone × 24-hour synthesized dataset so the analytics
// charts feel real. Persisted to localStorage on first generation (see
// store.ts) — this file is pure so the same seed always produces the same
// numbers across reloads.

import type {
  IntelCity,
  IntelCohortRow,
  IntelDayCell,
  IntelElasticityPoint,
  IntelHourCell,
  IntelProviderBench,
  IntelZone,
} from "../types";

// ── tiny seeded PRNG (mulberry32) ─────────────────────────────────────

export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Zones ──────────────────────────────────────────────────────────────
//
// 20 zones total. Chennai is dense (12 zones — the wedge city) plus 3
// zones each for Bengaluru, Hyderabad, Mumbai so the "city selector" feels
// real if the user clicks around.

const RAW_ZONES: Array<Omit<IntelZone, "supplyChargers" | "supplyParking">> = [
  { id: "z-che-tng", city: "chennai", name: "T Nagar", lat: 13.0426, lng: 80.2331 },
  { id: "z-che-vel", city: "chennai", name: "Velachery", lat: 12.9791, lng: 80.2216 },
  { id: "z-che-omr", city: "chennai", name: "OMR / Sholinganallur", lat: 12.9007, lng: 80.2278 },
  { id: "z-che-ann", city: "chennai", name: "Anna Nagar", lat: 13.087, lng: 80.207 },
  { id: "z-che-guy", city: "chennai", name: "Guindy Industrial", lat: 13.006, lng: 80.211 },
  { id: "z-che-mnt", city: "chennai", name: "Mount Road", lat: 13.063, lng: 80.264 },
  { id: "z-che-adr", city: "chennai", name: "Adyar", lat: 13.0067, lng: 80.257 },
  { id: "z-che-tam", city: "chennai", name: "Tambaram", lat: 12.9249, lng: 80.1000 },
  { id: "z-che-por", city: "chennai", name: "Porur", lat: 13.0387, lng: 80.1565 },
  { id: "z-che-kkm", city: "chennai", name: "Koyambedu", lat: 13.0722, lng: 80.1948 },
  { id: "z-che-mrn", city: "chennai", name: "Marina North", lat: 13.075, lng: 80.281 },
  { id: "z-che-elc", city: "chennai", name: "ECR / Injambakkam", lat: 12.913, lng: 80.244 },

  { id: "z-blr-koram", city: "bengaluru", name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { id: "z-blr-white", city: "bengaluru", name: "Whitefield", lat: 12.9698, lng: 77.7500 },
  { id: "z-blr-mgrd", city: "bengaluru", name: "MG Road", lat: 12.9755, lng: 77.6060 },

  { id: "z-hyd-hite", city: "hyderabad", name: "HITEC City", lat: 17.4463, lng: 78.3776 },
  { id: "z-hyd-bnjr", city: "hyderabad", name: "Banjara Hills", lat: 17.4126, lng: 78.4448 },
  { id: "z-hyd-gach", city: "hyderabad", name: "Gachibowli", lat: 17.4400, lng: 78.3489 },

  { id: "z-mum-bkc", city: "mumbai", name: "BKC", lat: 19.0674, lng: 72.8687 },
  { id: "z-mum-and", city: "mumbai", name: "Andheri West", lat: 19.1364, lng: 72.8296 },
  { id: "z-mum-cst", city: "mumbai", name: "CST / Fort", lat: 18.9398, lng: 72.8355 },
];

export function getZones(): IntelZone[] {
  const rng = makeRng(101);
  return RAW_ZONES.map((z) => ({
    ...z,
    supplyChargers: 6 + Math.floor(rng() * 30),
    supplyParking: 40 + Math.floor(rng() * 200),
  }));
}

// ── Day cells & hour cells ─────────────────────────────────────────────

function dateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Generate 90 days × zones × 24 hours of demand data.
 * - Long-run growth trend + weekly seasonality + hourly commute peaks.
 * - Chennai zones get denser demand (wedge city).
 */
export function generateCells(now = new Date()): {
  days: IntelDayCell[];
  hours: IntelHourCell[];
} {
  const zones = getZones();
  const days: IntelDayCell[] = [];
  const hours: IntelHourCell[] = [];

  for (const z of zones) {
    const rng = makeRng(hashString(z.id));
    const cityBoost =
      z.city === "chennai"
        ? 1.2
        : z.city === "bengaluru"
          ? 1.0
          : z.city === "hyderabad"
            ? 0.85
            : 0.9;
    const zoneBase = (0.5 + rng()) * 25 * cityBoost;

    for (let d = 89; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      const dow = day.getDay(); // 0 Sun … 6 Sat
      const weekend = dow === 0 || dow === 6 ? 0.75 : 1;
      const growth = 1 + (89 - d) * 0.004; // ~40% growth over 90 days
      const noise = 0.85 + rng() * 0.3;
      const dayDemand = Math.round(zoneBase * weekend * growth * noise);

      // Split demand across 24 hours with two commute peaks.
      let daySessions = 0;
      let dayUnmet = 0;
      let dayBusySum = 0;
      for (let h = 0; h < 24; h++) {
        const commute =
          Math.exp(-Math.pow(h - 9, 2) / 4) * 1.4 +
          Math.exp(-Math.pow(h - 18, 2) / 4) * 1.6 +
          Math.exp(-Math.pow(h - 13, 2) / 12) * 0.4;
        const hourNoise = 0.7 + rng() * 0.6;
        const demand = Math.max(
          0,
          Math.round((dayDemand / 6) * commute * hourNoise),
        );
        const capacityCap = z.supplyChargers * 2; // ~2 sessions/hr per charger
        const supplyBusy = Math.min(z.supplyChargers, Math.round(demand * 0.6));
        const met = Math.min(demand, capacityCap);
        const unmet = Math.max(0, demand - met);
        hours.push({
          zoneId: z.id,
          date: dateISO(day),
          hour: h,
          demand,
          supplyBusy,
        });
        daySessions += met;
        dayUnmet += unmet;
        dayBusySum += supplyBusy;
      }
      const avgPrice = 14 + rng() * 10 + (z.city === "mumbai" ? 2 : 0);
      const gmv = Math.round(daySessions * (18 + rng() * 8) * (avgPrice / 18));
      const uniqueUsers = Math.round(daySessions * (0.6 + rng() * 0.25));

      days.push({
        zoneId: z.id,
        date: dateISO(day),
        sessions: daySessions,
        gmv,
        unmet: dayUnmet,
        avgPrice: Math.round(avgPrice * 100) / 100,
        uniqueUsers,
      });
      // silence unused var warning
      void dayBusySum;
    }
  }

  return { days, hours };
}

// ── Provider benchmarks ────────────────────────────────────────────────

export function generateBenchmarks(): IntelProviderBench[] {
  const rng = makeRng(555);
  const names = [
    "Auto Doc Volt Hub",
    "GreenCell",
    "Statiq",
    "Tata Power EZ",
    "Ather Grid",
    "ChargeZone",
    "Fortum",
    "Zeon Charging",
    "Kazam",
    "GLIDA",
    "Auto Doc EcoCharge",
    "Auto Doc FastCharge",
  ];
  const cities: IntelCity[] = ["chennai", "bengaluru", "hyderabad", "mumbai"];
  return names.map((n, i) => ({
    providerId: `prov-${i}`,
    providerName: n,
    city: cities[i % cities.length],
    uptimePct: Math.round((94 + rng() * 5.5) * 10) / 10,
    utilizationPct: Math.round((30 + rng() * 55) * 10) / 10,
    avgRating: Math.round((3.5 + rng() * 1.4) * 10) / 10,
    gmv: Math.round(200000 + rng() * 6_000_000),
    isSelf: n.startsWith("Auto Doc"),
  }));
}

// ── Cohorts ────────────────────────────────────────────────────────────

export function generateCohorts(): IntelCohortRow[] {
  const rng = makeRng(777);
  const now = new Date();
  const rows: IntelCohortRow[] = [];
  for (let w = 11; w >= 0; w--) {
    const d = new Date(now);
    d.setDate(d.getDate() - w * 7);
    const size = 400 + Math.floor(rng() * 1400);
    const retentionPct: number[] = [];
    let cur = 100;
    for (let i = 0; i <= w; i++) {
      retentionPct.push(Math.round(cur * 10) / 10);
      // decay slower for older cohorts (survivor bias).
      const decay = 0.24 - Math.min(0.15, i * 0.015);
      cur = Math.max(6, cur * (1 - decay + rng() * 0.06));
    }
    rows.push({
      cohortStart: dateISO(d),
      size,
      retentionPct,
    });
  }
  return rows;
}

// ── Elasticity ─────────────────────────────────────────────────────────

export function generateElasticity(): IntelElasticityPoint[] {
  const rng = makeRng(999);
  const out: IntelElasticityPoint[] = [];
  const segs: IntelElasticityPoint["segment"][] = [
    "commuter",
    "fleet",
    "casual",
    "tourist",
  ];
  const baseSensitivity: Record<IntelElasticityPoint["segment"], number> = {
    commuter: 1.3,
    fleet: 2.2,
    casual: 0.9,
    tourist: 0.5,
  };
  const baseIntercept: Record<IntelElasticityPoint["segment"], number> = {
    commuter: 90,
    fleet: 180,
    casual: 55,
    tourist: 22,
  };
  for (const seg of segs) {
    for (let i = 0; i < 24; i++) {
      const price = 10 + i * 0.7;
      const noise = (rng() - 0.5) * 6;
      const sessionsPerDay = Math.max(
        3,
        Math.round(baseIntercept[seg] - baseSensitivity[seg] * price + noise),
      );
      out.push({ segment: seg, pricePerKwh: Math.round(price * 100) / 100, sessionsPerDay });
    }
  }
  return out;
}

// ── util ───────────────────────────────────────────────────────────────

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
