// Frontend-only mock store for Mechanic role (Phase 2 — no backend yet).
// Persists to localStorage so the user can navigate across sessions.

export type MechanicStatus = "registered" | "pending_approval" | "approved" | "rejected";

export interface MechanicAuth {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: MechanicStatus;
  hasSetup: boolean;
}

export interface MechanicService {
  id: string;
  category: VehicleCategory;
  name: string;
  price: number; // INR
  custom?: boolean;
}

export interface MechanicReview {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
  replyDate?: string;
  workerId?: string;
  workerName?: string;
}

export interface MechanicShop {
  id: string;
  ownerName: string;
  ownerPhone: string;
  shopName: string;
  address: string;
  lat: number;
  lng: number;
  categories: VehicleCategory[];
  services: MechanicService[];
  photos: string[]; // data URLs / placeholders
  rating: number;
  reviewCount: number;
  reviews: MechanicReview[];
  open: boolean;
  upiId?: string;
}

// ---------------- Workers ----------------

export type WorkerStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "removed"
  | "self_suspended";

export interface MechanicWorker {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  phone: string;
  aadhaarUrl?: string; // data URL (mock)
  panUrl?: string; // data URL (mock)
  extraDocs?: string[]; // additional data URLs
  status: WorkerStatus;
  createdAt: string;
  lat?: number;
  lng?: number;
}

export interface WorkerInvite {
  token: string;
  shopId: string;
  shopName: string;
  createdAt: string;
  expiresAt?: string;
}

export interface MobilePricing {
  labourPerService: number; // base labour per selected service
  travelPerKm: number;
  serviceCharge: number; // platform service charge
  nightSurchargePct: number; // % applied if 9pm–6am
}

export interface AppNotification {
  id: string;
  audience: "owner" | "worker" | "consumer";
  audienceId: string; // shopId | workerId | consumerPhone
  title: string;
  body: string;
  createdAt: string;
  read?: boolean;
}

const WORKERS_KEY = "mechanicWorkers";
const INVITES_KEY = "mechanicWorkerInvites";
const WORKER_AUTH_KEY = "workerAuth";
const PRICING_KEY = "mechanicMobilePricing";
const NOTIFS_KEY = "mechanicAppNotifications";

const DEFAULT_PRICING: MobilePricing = {
  labourPerService: 250,
  travelPerKm: 12,
  serviceCharge: 49,
  nightSurchargePct: 25,
};

export function getMobilePricing(): MobilePricing {
  try {
    const raw = localStorage.getItem(PRICING_KEY);
    if (raw) return { ...DEFAULT_PRICING, ...JSON.parse(raw) };
  } catch {/* */}
  return DEFAULT_PRICING;
}
export function setMobilePricing(p: MobilePricing) {
  localStorage.setItem(PRICING_KEY, JSON.stringify(p));
}

export function isNightTime(d = new Date()): boolean {
  const h = d.getHours();
  return h >= 21 || h < 6;
}

export interface MobileQuote {
  labour: number;
  travel: number;
  service: number;
  nightSurcharge: number;
  total: number;
  isNight: boolean;
  distanceKm: number;
  services: string[];
}

export function calcMobileQuote(
  serviceNames: string[],
  distanceKm: number,
  at: Date = new Date(),
): MobileQuote {
  const p = getMobilePricing();
  const labour = Math.round(p.labourPerService * Math.max(1, serviceNames.length));
  const travel = Math.round(p.travelPerKm * Math.max(0, distanceKm));
  const service = p.serviceCharge;
  const subtotal = labour + travel + service;
  const isNight = isNightTime(at);
  const nightSurcharge = isNight ? Math.round((subtotal * p.nightSurchargePct) / 100) : 0;
  return {
    labour,
    travel,
    service,
    nightSurcharge,
    total: subtotal + nightSurcharge,
    isNight,
    distanceKm: Math.round(distanceKm * 10) / 10,
    services: serviceNames,
  };
}

// Predefined catalogue of mobile amenity services (admin-controlled, mocked here)
export const MOBILE_SERVICE_CATALOGUE: { id: string; name: string; emoji: string }[] = [
  { id: "oil_change", name: "Oil Change", emoji: "🛢️" },
  { id: "tyre_check", name: "Tyre Check & Air", emoji: "🛞" },
  { id: "battery_replace", name: "Battery Replacement", emoji: "🔋" },
  { id: "battery_jumpstart", name: "Battery Jumpstart", emoji: "⚡" },
  { id: "brake_inspect", name: "Brake Inspection", emoji: "🛑" },
  { id: "ac_recharge", name: "AC Gas Recharge", emoji: "❄️" },
  { id: "wash", name: "Doorstep Wash", emoji: "🧼" },
  { id: "diagnostic", name: "Diagnostic Scan", emoji: "🩺" },
];

// ---------- Workers store ----------
export function getAllWorkers(): MechanicWorker[] {
  try {
    const raw = localStorage.getItem(WORKERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeWorkers(list: MechanicWorker[]) {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(list));
}
export function getWorkersForShop(shopId: string): MechanicWorker[] {
  return getAllWorkers().filter((w) => w.shopId === shopId && w.status !== "removed");
}
export function getWorkerById(id: string): MechanicWorker | null {
  return getAllWorkers().find((w) => w.id === id) || null;
}
export function addWorker(w: MechanicWorker) {
  const list = getAllWorkers();
  list.unshift(w);
  writeWorkers(list);
}
export function updateWorker(id: string, patch: Partial<MechanicWorker>) {
  const list = getAllWorkers().map((w) => (w.id === id ? { ...w, ...patch } : w));
  writeWorkers(list);
  return list.find((w) => w.id === id) || null;
}

// ---------- Invites ----------
export function getInvites(): WorkerInvite[] {
  try {
    const raw = localStorage.getItem(INVITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function createWorkerInvite(shopId: string, shopName: string, expiresInHours = 72): WorkerInvite {
  const token = `inv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const invite: WorkerInvite = {
    token,
    shopId,
    shopName,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresInHours * 3600_000).toISOString(),
  };
  const list = getInvites();
  list.unshift(invite);
  localStorage.setItem(INVITES_KEY, JSON.stringify(list));
  return invite;
}
export function getInvite(token: string): WorkerInvite | null {
  return getInvites().find((i) => i.token === token) || null;
}

// ---------- Worker auth (mock) ----------
export interface WorkerAuth {
  workerId: string;
}
export function getWorkerAuth(): WorkerAuth | null {
  try {
    const raw = localStorage.getItem(WORKER_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setWorkerAuth(a: WorkerAuth | null) {
  if (!a) localStorage.removeItem(WORKER_AUTH_KEY);
  else localStorage.setItem(WORKER_AUTH_KEY, JSON.stringify(a));
}

// ---------- Notifications ----------
export function getNotifications(audience: AppNotification["audience"], audienceId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    return all.filter((n) => n.audience === audience && n.audienceId === audienceId);
  } catch {
    return [];
  }
}
export function pushNotification(n: Omit<AppNotification, "id" | "createdAt">) {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    all.unshift({ ...n, id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() });
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(all.slice(0, 200)));
  } catch {/* */}
}
export function markAllNotificationsRead(audience: AppNotification["audience"], audienceId: string) {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    const next = all.map((n) =>
      n.audience === audience && n.audienceId === audienceId ? { ...n, read: true } : n,
    );
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(next));
  } catch {/* */}
}

// ---------- Geo ----------
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const DISPATCH_RADIUS_KM = 12;

/** Workers eligible for a given consumer location */
export function getEligibleWorkers(loc: { lat: number; lng: number }): MechanicWorker[] {
  return getAllWorkers().filter(
    (w) =>
      w.status === "approved" &&
      typeof w.lat === "number" &&
      typeof w.lng === "number" &&
      haversineKm(loc, { lat: w.lat!, lng: w.lng! }) <= DISPATCH_RADIUS_KM,
  );
}

export type VehicleCategory = "bike" | "car" | "auto" | "commercial" | "ev" | "bicycle";

export const VEHICLE_CATEGORIES: {
  key: VehicleCategory;
  label: string;
  emoji: string;
  services: string[];
}[] = [
  {
    key: "bike",
    label: "Bike / Two Wheeler",
    emoji: "🏍️",
    services: [
      "Engine & Performance",
      "Tyres & Brakes",
      "Electricals & Battery",
      "Washing & Detailing",
      "Periodic Service",
      "Emergency Breakdown",
      "Accessories Installation",
    ],
  },
  {
    key: "car",
    label: "Car",
    emoji: "🚗",
    services: [
      "General Service & Oil Change",
      "Tyres & Brakes",
      "AC & Electricals",
      "Washing & Detailing",
      "Dent & Paint",
      "Battery & Jumpstart",
      "Emergency Breakdown",
      "Accessories / Customization",
    ],
  },
  {
    key: "auto",
    label: "Auto / Three Wheeler",
    emoji: "🛺",
    services: [
      "Engine & Transmission",
      "Tyres & Suspension",
      "Electrical Repairs",
      "Routine Service",
      "Washing",
    ],
  },
  {
    key: "commercial",
    label: "Commercial Vehicles",
    emoji: "🚚",
    services: [
      "Engine Repair",
      "Brake Systems",
      "Fleet Maintenance",
      "Tyres & Alignment",
      "Battery / Electrical",
      "Breakdown Assistance",
    ],
  },
  {
    key: "ev",
    label: "EV Vehicles",
    emoji: "⚡",
    services: [
      "Battery Diagnostics",
      "Charging Issues",
      "Motor Repair",
      "Electrical Systems",
      "Software Diagnostics",
      "Routine Inspection",
    ],
  },
  {
    key: "bicycle",
    label: "Bicycle",
    emoji: "🚲",
    services: ["Tyres & Tubes", "Brake Adjustment", "Gear Tuning", "Accessories"],
  },
];

const AUTH_KEY = "mechanicAuth";
const SHOP_KEY = "mechanicShop";
const PUBLIC_SHOPS_KEY = "mechanicPublicShops";
const BOOKINGS_KEY = "mechanicBookings";

export function getMechanicAuth(): MechanicAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setMechanicAuth(auth: MechanicAuth | null) {
  if (!auth) localStorage.removeItem(AUTH_KEY);
  else localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function getMechanicShop(): MechanicShop | null {
  try {
    const raw = localStorage.getItem(SHOP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setMechanicShop(shop: MechanicShop) {
  localStorage.setItem(SHOP_KEY, JSON.stringify(shop));
  // Also write to the public list so consumers can see it
  const list = getPublicShops().filter((s) => s.id !== shop.id);
  list.unshift(shop);
  localStorage.setItem(PUBLIC_SHOPS_KEY, JSON.stringify(list));
}

const SEED_SHOPS: MechanicShop[] = [
  {
    id: "seed-1",
    ownerName: "Kumar Ramesh",
    ownerPhone: "+91 98765 00001",
    shopName: "Kumar Auto Works",
    address: "12, Anna Salai, Chennai",
    lat: 13.06,
    lng: 80.24,
    categories: ["car", "bike"],
    services: [
      { id: "s1", category: "car", name: "General Service & Oil Change", price: 1200 },
      { id: "s2", category: "car", name: "AC & Electricals", price: 1500 },
      { id: "s3", category: "bike", name: "Periodic Service", price: 600 },
    ],
    photos: [],
    rating: 4.7,
    reviewCount: 128,
    reviews: [
      { id: "r1", user: "Anand S.", rating: 5, comment: "Quick service, fair price.", date: "2 days ago" },
      { id: "r2", user: "Priya K.", rating: 4, comment: "Good work but slight delay.", date: "1 week ago" },
    ],
    open: true,
  },
  {
    id: "seed-2",
    ownerName: "Raj Kumar",
    ownerPhone: "+91 98765 00002",
    shopName: "Raj Bike Service Center",
    address: "45, T Nagar, Chennai",
    lat: 13.04,
    lng: 80.23,
    categories: ["bike", "bicycle"],
    services: [
      { id: "s1", category: "bike", name: "Tyres & Brakes", price: 400 },
      { id: "s2", category: "bike", name: "Electricals & Battery", price: 800 },
      { id: "s3", category: "bicycle", name: "Gear Tuning", price: 200 },
    ],
    photos: [],
    rating: 4.5,
    reviewCount: 89,
    reviews: [
      { id: "r1", user: "Mohan", rating: 5, comment: "Honest mechanic.", date: "3 days ago" },
    ],
    open: true,
  },
  {
    id: "seed-3",
    ownerName: "Suresh Iyer",
    ownerPhone: "+91 98765 00003",
    shopName: "EV Charge & Care",
    address: "Velachery, Chennai",
    lat: 12.98,
    lng: 80.22,
    categories: ["ev", "car"],
    services: [
      { id: "s1", category: "ev", name: "Battery Diagnostics", price: 1000 },
      { id: "s2", category: "ev", name: "Software Diagnostics", price: 1500 },
    ],
    photos: [],
    rating: 4.8,
    reviewCount: 56,
    reviews: [],
    open: false,
  },
];

export function getPublicShops(): MechanicShop[] {
  try {
    const raw = localStorage.getItem(PUBLIC_SHOPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  localStorage.setItem(PUBLIC_SHOPS_KEY, JSON.stringify(SEED_SHOPS));
  return SEED_SHOPS;
}

export interface MechanicBooking {
  id: string;
  shopId: string;
  shopName: string;
  service: string;
  price: number;
  date: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "completed"
    | "cancelled"
    | "searching"
    | "assigned"
    | "on_the_way"
    | "in_progress";
  contactRevealed: boolean;
  serviceType: "shop" | "doorstep";
  jobType?: "in_shop" | "mobile";
  customerName: string;
  customerPhone: string;
  customerLocation?: { lat: number; lng: number; address: string };
  paid?: boolean;
  workerId?: string;
  workerName?: string;
  priceBreakdown?: {
    labour: number;
    travel: number;
    service: number;
    nightSurcharge: number;
  };
  services?: string[];
}

export function getMechanicBookings(): MechanicBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addMechanicBooking(b: MechanicBooking) {
  const all = getMechanicBookings();
  all.unshift(b);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
}

export function updateMechanicBooking(id: string, patch: Partial<MechanicBooking>) {
  const all = getMechanicBookings().map((b) => (b.id === id ? { ...b, ...patch } : b));
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
  return all.find((b) => b.id === id) || null;
}

export function getConsumerBookings(phone: string): MechanicBooking[] {
  if (!phone) return [];
  return getMechanicBookings().filter((b) => b.customerPhone === phone);
}

export function addReviewToShop(
  shopId: string,
  review: Omit<MechanicReview, "id" | "date">,
) {
  const list = getPublicShops();
  const idx = list.findIndex((s) => s.id === shopId);
  if (idx === -1) return;
  const shop = list[idx];
  const newReview: MechanicReview = {
    ...review,
    id: `rv_${Date.now()}`,
    date: "Just now",
  };
  const reviews = [newReview, ...(shop.reviews || [])];
  const reviewCount = reviews.length;
  const rating = reviews.reduce((a, r) => a + r.rating, 0) / reviewCount;
  const updated: MechanicShop = {
    ...shop,
    reviews,
    reviewCount,
    rating: Math.round(rating * 10) / 10,
  };
  list[idx] = updated;
  localStorage.setItem(PUBLIC_SHOPS_KEY, JSON.stringify(list));
  // Mirror to mechanic's own shop record if it matches
  const own = getMechanicShop();
  if (own && own.id === shopId) {
    localStorage.setItem(SHOP_KEY, JSON.stringify(updated));
  }
}

export function getShopBookings(shopId: string): MechanicBooking[] {
  const existing = getMechanicBookings().filter((b) => b.shopId === shopId);
  if (existing.length > 0) return existing;
  // Seed mock bookings on first access for this shop
  const shop = getMechanicShop();
  const shopName = shop?.shopName || "My Shop";
  const now = Date.now();
  const mocks: MechanicBooking[] = [
    {
      id: `mock-${shopId}-1`,
      shopId,
      shopName,
      service: "General Service & Oil Change",
      price: 1200,
      date: new Date(now - 1000 * 60 * 30).toISOString(),
      status: "pending",
      contactRevealed: false,
      serviceType: "doorstep",
      customerName: "Arjun Mehta",
      customerPhone: "+91 98401 23456",
      customerLocation: {
        lat: 12.9249,
        lng: 80.1,
        address: "23, 1st Main Rd, Tambaram West, Chennai",
      },
    },
    {
      id: `mock-${shopId}-2`,
      shopId,
      shopName,
      service: "Tyres & Brakes",
      price: 850,
      date: new Date(now - 1000 * 60 * 90).toISOString(),
      status: "pending",
      contactRevealed: false,
      serviceType: "shop",
      customerName: "Divya Raghavan",
      customerPhone: "+91 99620 11223",
    },
    {
      id: `mock-${shopId}-3`,
      shopId,
      shopName,
      service: "AC & Electricals",
      price: 1500,
      date: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      status: "accepted",
      contactRevealed: true,
      serviceType: "doorstep",
      customerName: "Karthik Subramanian",
      customerPhone: "+91 90030 44556",
      customerLocation: {
        lat: 12.9165,
        lng: 80.1226,
        address: "Selaiyur Main Rd, Chennai",
      },
    },
    {
      id: `mock-${shopId}-4`,
      shopId,
      shopName,
      service: "Periodic Service",
      price: 600,
      date: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      status: "accepted",
      contactRevealed: true,
      serviceType: "shop",
      customerName: "Meera Pillai",
      customerPhone: "+91 89399 77881",
    },
    {
      id: `mock-${shopId}-5`,
      shopId,
      shopName,
      service: "Battery & Jumpstart",
      price: 750,
      date: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      status: "completed",
      contactRevealed: true,
      serviceType: "doorstep",
      customerName: "Vignesh Kumar",
      customerPhone: "+91 90876 55432",
      customerLocation: {
        lat: 12.9341,
        lng: 80.1131,
        address: "Rajakilpakkam, Tambaram, Chennai",
      },
      paid: true,
    },
    {
      id: `mock-${shopId}-6`,
      shopId,
      shopName,
      service: "Washing & Detailing",
      price: 450,
      date: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      status: "completed",
      contactRevealed: true,
      serviceType: "shop",
      customerName: "Sneha Iyer",
      customerPhone: "+91 87543 21098",
      paid: true,
    },
    {
      id: `mock-${shopId}-7`,
      shopId,
      shopName,
      service: "Engine & Performance",
      price: 2200,
      date: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      status: "rejected",
      contactRevealed: false,
      serviceType: "doorstep",
      customerName: "Rohan Das",
      customerPhone: "+91 98765 12340",
      customerLocation: {
        lat: 12.9501,
        lng: 80.1402,
        address: "Chromepet, Chennai",
      },
    },
  ];
  const all = [...mocks, ...getMechanicBookings()];
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
  return mocks;
}

export function maskContact(value: string) {
  if (!value) return "";
  const trimmed = value.replace(/\s+/g, "");
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  return trimmed.slice(0, 2) + "•".repeat(Math.max(4, trimmed.length - 4)) + trimmed.slice(-2);
}