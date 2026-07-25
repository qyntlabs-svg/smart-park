// Fleet OS — deterministic seed data (drivers, vehicles, cost centers, etc.).
// Enough volume so dashboards feel populated: 40 vehicles, 25 drivers,
// 4 cost centers, 3 depots, 12 policies, ~60 maintenance orders,
// 90 days of shift history, invoices for last 6 months.

import type {
  FleetAlert,
  FleetApiKey,
  FleetBatchReservation,
  FleetCostCenter,
  FleetDepot,
  FleetDriver,
  FleetInvoice,
  FleetMaintenanceOrder,
  FleetPolicy,
  FleetRoute,
  FleetShift,
  FleetSsoConfig,
  FleetVehicle,
} from "../types";

// Simple deterministic PRNG so the same seed produces the same numbers.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260723);
const pick = <T,>(list: T[]): T => list[Math.floor(rng() * list.length)];
const range = (lo: number, hi: number) => Math.floor(rng() * (hi - lo + 1)) + lo;
const iso = (daysAgo: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, Math.floor(rng() * 60), 0, 0);
  return d.toISOString();
};

// ---------- Depots + cost centers ----------

export const SEED_DEPOTS: FleetDepot[] = [
  {
    id: "depot-a",
    name: "Depot A — Sholinganallur",
    address: "OMR, Sholinganallur, Chennai 600119",
    lat: 12.9007,
    lng: 80.2278,
  },
  {
    id: "depot-b",
    name: "Depot B — Velachery",
    address: "Vijaya Nagar, Velachery, Chennai 600042",
    lat: 12.9791,
    lng: 80.2216,
  },
  {
    id: "depot-c",
    name: "Depot C — T Nagar",
    address: "Panagal Park, T Nagar, Chennai 600017",
    lat: 13.0426,
    lng: 80.2331,
  },
];

export const SEED_COST_CENTERS: FleetCostCenter[] = [
  {
    id: "cc-ops",
    name: "Operations",
    code: "OPS-01",
    monthlyBudget: 480000,
    monthlySpend: 361200,
  },
  {
    id: "cc-sales",
    name: "Sales & Field",
    code: "SLS-01",
    monthlyBudget: 320000,
    monthlySpend: 288400,
  },
  {
    id: "cc-exec",
    name: "Executive Pool",
    code: "EXE-01",
    monthlyBudget: 140000,
    monthlySpend: 91100,
  },
  {
    id: "cc-logistics",
    name: "Logistics",
    code: "LOG-01",
    monthlyBudget: 620000,
    monthlySpend: 543900,
  },
];

// ---------- Drivers ----------

const FIRST_NAMES = [
  "Arjun",
  "Priya",
  "Karthik",
  "Aisha",
  "Ravi",
  "Divya",
  "Suresh",
  "Meera",
  "Vikram",
  "Ananya",
  "Rahul",
  "Deepika",
  "Vishnu",
  "Shreya",
  "Manoj",
  "Kavya",
  "Aditya",
  "Neha",
  "Rohan",
  "Sanjana",
  "Prakash",
  "Lakshmi",
  "Nikhil",
  "Radha",
  "Vinay",
];
const LAST_NAMES = [
  "Iyer",
  "Menon",
  "Reddy",
  "Nair",
  "Kumar",
  "Rao",
  "Singh",
  "Sharma",
  "Verma",
  "Patel",
  "Krishnan",
  "Bose",
  "Das",
  "Pillai",
];

export const SEED_DRIVERS: FleetDriver[] = Array.from({ length: 25 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = pick(LAST_NAMES);
  const cc = pick(SEED_COST_CENTERS);
  const rating = Math.round((3.5 + rng() * 1.4) * 10) / 10;
  const licYear = 2027 + Math.floor(rng() * 4);
  return {
    id: `drv-${String(i + 1).padStart(3, "0")}`,
    name: `${first} ${last}`,
    employeeCode: `EMP${String(1000 + i)}`,
    phone: `+91 9${range(100000000, 999999999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@fleetdemo.co`,
    licenseNumber: `TN${range(10, 99)} ${licYear} ${String(range(10000, 99999))}`,
    licenseExpiry: `${licYear}-${String(range(1, 12)).padStart(2, "0")}-${String(range(1, 28)).padStart(2, "0")}`,
    costCenterId: cc.id,
    rating,
    totalTrips: range(120, 1800),
    totalKm: range(4200, 62000),
    status: rng() < 0.86 ? "active" : rng() < 0.7 ? "on_leave" : "suspended",
    shifts: [],
    createdAt: iso(range(30, 900)),
  };
});

// ---------- Vehicles ----------

const VEHICLE_TEMPLATES: Array<Pick<FleetVehicle, "make" | "model" | "fuel" | "batteryKwh">> = [
  { make: "Tata", model: "Nexon EV", fuel: "ev", batteryKwh: 40 },
  { make: "Tata", model: "Xpres-T", fuel: "ev", batteryKwh: 26 },
  { make: "MG", model: "ZS EV", fuel: "ev", batteryKwh: 50 },
  { make: "Mahindra", model: "eVerito", fuel: "ev", batteryKwh: 21 },
  { make: "Hyundai", model: "Kona EV", fuel: "ev", batteryKwh: 39 },
  { make: "BYD", model: "e6", fuel: "ev", batteryKwh: 71 },
  { make: "Maruti", model: "Dzire Tour", fuel: "ice" },
  { make: "Toyota", model: "Etios", fuel: "ice" },
  { make: "Toyota", model: "Camry Hybrid", fuel: "hybrid", batteryKwh: 1.6 },
  { make: "Honda", model: "City Hybrid", fuel: "hybrid", batteryKwh: 1.3 },
];

const STATUS_POOL: FleetVehicle["status"][] = [
  "in_service",
  "in_service",
  "in_service",
  "idle",
  "idle",
  "charging",
  "maintenance",
  "offline",
];

export const SEED_VEHICLES: FleetVehicle[] = Array.from({ length: 40 }, (_, i) => {
  const tpl = VEHICLE_TEMPLATES[i % VEHICLE_TEMPLATES.length];
  const cc = pick(SEED_COST_CENTERS);
  const depot = pick(SEED_DEPOTS);
  const status = pick(STATUS_POOL);
  const drv = SEED_DRIVERS[i % SEED_DRIVERS.length];
  return {
    id: `veh-${String(i + 1).padStart(3, "0")}`,
    plate: `TN${range(1, 22)} ${String.fromCharCode(65 + range(0, 25))}${String.fromCharCode(65 + range(0, 25))} ${range(1000, 9999)}`,
    make: tpl.make,
    model: tpl.model,
    year: 2020 + range(0, 5),
    fuel: tpl.fuel,
    batteryKwh: tpl.batteryKwh,
    currentSocPct: tpl.fuel === "ev" ? range(15, 92) : undefined,
    odometerKm: range(1200, 92000),
    status,
    healthScore: range(58, 99),
    costCenterId: cc.id,
    depotId: depot.id,
    assignedDriverId: status === "offline" ? undefined : drv.id,
    nextServiceKm: range(500, 8000),
    telematics: {
      online: status !== "offline",
      lastPingAt: iso(0, 8 + range(0, 12)),
      signalStrength: (range(1, 4) as 1 | 2 | 3 | 4),
    },
    createdAt: iso(range(60, 720)),
  };
});

// ---------- Shifts (last 14 days) ----------

export const SEED_SHIFTS: FleetShift[] = [];
for (let day = 0; day < 14; day++) {
  for (let i = 0; i < 18; i++) {
    const drv = pick(SEED_DRIVERS);
    const veh = pick(SEED_VEHICLES);
    const startHour = 6 + Math.floor(rng() * 12);
    const start = new Date();
    start.setDate(start.getDate() - day);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(startHour + 6 + Math.floor(rng() * 3));
    SEED_SHIFTS.push({
      id: `shift-${day}-${i}`,
      driverId: drv.id,
      vehicleId: veh.id,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status:
        day > 0
          ? "completed"
          : rng() < 0.4
            ? "in_progress"
            : "scheduled",
    });
  }
}

// ---------- Routes ----------

export const SEED_ROUTES: FleetRoute[] = [
  {
    id: "route-omr-morning",
    name: "Depot A → OMR Circuit",
    originDepotId: "depot-a",
    waypoints: [
      { lat: 12.9007, lng: 80.2278, label: "Depot A" },
      { lat: 12.9165, lng: 80.2298, label: "Perungudi drop" },
      { lat: 12.9491, lng: 80.2412, label: "Thoraipakkam client" },
      { lat: 12.99, lng: 80.2495, label: "Adyar return" },
    ],
    distanceKm: 42,
    chargingStops: ["ev-seed-omr"],
    optimizedAt: iso(2),
  },
  {
    id: "route-velachery-loop",
    name: "Depot B → Velachery Loop",
    originDepotId: "depot-b",
    waypoints: [
      { lat: 12.9791, lng: 80.2216, label: "Depot B" },
      { lat: 12.994, lng: 80.2181, label: "Guindy client" },
      { lat: 13.0067, lng: 80.2206, label: "Saidapet pickup" },
      { lat: 12.9791, lng: 80.2216, label: "Return" },
    ],
    distanceKm: 28,
    chargingStops: ["ev-seed-velachery"],
    optimizedAt: iso(4),
  },
  {
    id: "route-tnagar-airport",
    name: "Depot C → Airport shuttle",
    originDepotId: "depot-c",
    waypoints: [
      { lat: 13.0426, lng: 80.2331, label: "Depot C" },
      { lat: 12.994, lng: 80.181, label: "MAA Airport" },
      { lat: 13.0426, lng: 80.2331, label: "Return" },
    ],
    distanceKm: 52,
    chargingStops: ["ev-seed-tnagar", "ev-seed-velachery"],
    optimizedAt: iso(1),
  },
];

// ---------- Maintenance ----------

const MAINT_REASONS = [
  "Brake pad wear — predictive alert",
  "10,000 km service due",
  "Coolant refill",
  "Tire rotation",
  "12V auxiliary battery low",
  "Charging port fault",
  "OTA firmware advisory",
  "Windscreen chip repair",
  "Wheel alignment",
  "AC gas top-up",
];

export const SEED_MAINTENANCE: FleetMaintenanceOrder[] = SEED_VEHICLES.slice(0, 25).map(
  (v, i) => {
    const type = pick(["predictive", "scheduled", "breakdown"] as const);
    const status = pick(["requested", "booked", "in_progress", "completed"] as const);
    return {
      id: `maint-${String(i + 1).padStart(3, "0")}`,
      vehicleId: v.id,
      type,
      reason: pick(MAINT_REASONS),
      status,
      mechanicShopId: status !== "requested" ? `mech-${range(1, 6)}` : undefined,
      scheduledAt: iso(-range(0, 21), 10 + range(0, 6)),
      completedAt: status === "completed" ? iso(range(1, 14)) : undefined,
      estCost: range(650, 8400),
    };
  },
);

// ---------- Policies ----------

export const SEED_POLICIES: FleetPolicy[] = [
  {
    id: "pol-global",
    name: "Global default",
    scope: "global",
    maxSessionSpend: 1200,
    dailySpendCap: 3500,
    monthlySpendCap: 65000,
    requireApprovalOver: 2000,
    mandatoryStops: ["ev-seed-omr"],
    allowedFuelTypes: ["ev", "hybrid", "ice"],
    enabled: true,
  },
  {
    id: "pol-logistics-night",
    name: "Logistics night shift",
    scope: "cost_center",
    scopeId: "cc-logistics",
    maxSessionSpend: 2000,
    dailySpendCap: 5000,
    monthlySpendCap: 110000,
    requireApprovalOver: 3500,
    mandatoryStops: ["ev-seed-omr", "ev-seed-velachery"],
    allowedFuelTypes: ["ev"],
    enabled: true,
  },
  {
    id: "pol-exec-airport",
    name: "Executive pool",
    scope: "cost_center",
    scopeId: "cc-exec",
    maxSessionSpend: 3200,
    dailySpendCap: 6500,
    monthlySpendCap: 42000,
    requireApprovalOver: 5000,
    mandatoryStops: [],
    allowedFuelTypes: ["ev", "hybrid"],
    enabled: true,
  },
  {
    id: "pol-sales-flex",
    name: "Sales flex — no cap",
    scope: "cost_center",
    scopeId: "cc-sales",
    maxSessionSpend: 1800,
    dailySpendCap: 4500,
    monthlySpendCap: 88000,
    requireApprovalOver: 4000,
    mandatoryStops: [],
    allowedFuelTypes: ["ev", "ice", "hybrid"],
    enabled: false,
  },
];

// ---------- Batch reservations ----------

export const SEED_BATCH: FleetBatchReservation[] = [
  {
    id: "batch-001",
    label: "Night shift — Wed 22:00–05:00",
    depotId: "depot-a",
    windowStart: iso(-1, 22),
    windowEnd: iso(-2, 5),
    chargersNeeded: 20,
    status: "confirmed",
    confirmedIds: Array.from({ length: 20 }, (_, i) => `evres-batch-${i}`),
    createdAt: iso(3),
  },
  {
    id: "batch-002",
    label: "Weekend maintenance charge — Sat 06:00–14:00",
    depotId: "depot-b",
    windowStart: iso(-4, 6),
    windowEnd: iso(-4, 14),
    chargersNeeded: 12,
    status: "partially_confirmed",
    confirmedIds: Array.from({ length: 8 }, (_, i) => `evres-batch2-${i}`),
    createdAt: iso(6),
  },
  {
    id: "batch-003",
    label: "Airport reserve — Fri 18:00–24:00",
    depotId: "depot-c",
    windowStart: iso(-7, 18),
    windowEnd: iso(-8, 0),
    chargersNeeded: 8,
    status: "draft",
    confirmedIds: [],
    createdAt: iso(1),
  },
];

// ---------- Invoices ----------

export const SEED_INVOICES: FleetInvoice[] = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const breakdown = SEED_COST_CENTERS.map((cc) => ({
    costCenterId: cc.id,
    total: Math.round(cc.monthlySpend * (0.7 + rng() * 0.6)),
  }));
  const total = breakdown.reduce((n, r) => n + r.total, 0);
  return {
    id: `inv-${month}`,
    month,
    total,
    status: i === 0 ? "draft" : i === 1 ? "issued" : i > 2 ? "paid" : "issued",
    costCenterBreakdown: breakdown,
    issuedAt: iso(i * 30, 9),
  };
});

// ---------- API keys ----------

export const SEED_API_KEYS: FleetApiKey[] = [
  {
    id: "fk-1",
    label: "Production Ops Dashboard",
    keyMasked: "sk_live_****4f2a",
    scopes: ["vehicles.read", "reservations.read", "reports.read"],
    createdAt: iso(120),
    lastUsedAt: iso(0, 14),
    revoked: false,
  },
  {
    id: "fk-2",
    label: "Payroll ETL",
    keyMasked: "sk_live_****8c1e",
    scopes: ["drivers.read", "reports.read"],
    createdAt: iso(48),
    lastUsedAt: iso(1, 3),
    revoked: false,
  },
  {
    id: "fk-3",
    label: "Legacy dispatch app (rotate)",
    keyMasked: "sk_live_****9911",
    scopes: ["vehicles.read", "vehicles.write", "reservations.read", "reservations.write"],
    createdAt: iso(365),
    lastUsedAt: iso(3),
    rotatedAt: iso(30),
    revoked: false,
  },
];

// ---------- SSO ----------

export const SEED_SSO: FleetSsoConfig = {
  id: "sso-1",
  protocol: "saml",
  issuer: "https://okta.fleetdemo.co",
  entityId: "smartpark-fleet-demo",
  ssoUrl: "https://okta.fleetdemo.co/app/smartpark/sso/saml",
  audience: "urn:smartpark:fleet:demo",
  certificateFingerprint: "9F:47:2A:5B:32:C1:D8:E6:04:71:BC:88:0A:5F:63:1A",
  status: "verified",
  updatedAt: iso(9),
};

// ---------- Alerts ----------

const ALERT_TEMPLATES: Array<Omit<FleetAlert, "id" | "createdAt" | "read">> = [
  {
    severity: "critical",
    title: "Vehicle TN22 GH 4211 offline > 45 min",
    body: "Last ping from Perungudi at 08:14. Driver Vikram Iyer reported no fault.",
    vehicleId: "veh-005",
  },
  {
    severity: "warning",
    title: "Battery SOC below 15% on 3 vehicles at Depot A",
    body: "Suggest triggering a batch reservation for the 22:00 window.",
  },
  {
    severity: "warning",
    title: "License expiring in 21 days — Priya Menon",
    body: "Renew DL before Nov 12 or she will be blocked from shift assignment.",
  },
  {
    severity: "info",
    title: "October invoice generated",
    body: "₹12,84,300 across 4 cost centers. Review before it auto-issues on the 1st.",
  },
  {
    severity: "critical",
    title: "Predictive alert: brake pads on 4 vehicles",
    body: "Auto-book Maintenance Scheduler? Estimated cost ₹9,600 total.",
  },
  {
    severity: "warning",
    title: "Charger offline at mandatory stop (T-Nagar)",
    body: "Batch #002 partially at risk. Fallback to Velachery selected automatically.",
  },
];

export const SEED_ALERTS: FleetAlert[] = ALERT_TEMPLATES.map((t, i) => ({
  ...t,
  id: `alert-${i + 1}`,
  createdAt: iso(0, 8 + i),
  read: i > 3,
}));
