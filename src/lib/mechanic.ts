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
  status: "confirmed" | "completed";
  contactRevealed: boolean;
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

export function maskContact(value: string) {
  if (!value) return "";
  const trimmed = value.replace(/\s+/g, "");
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  return trimmed.slice(0, 2) + "•".repeat(Math.max(4, trimmed.length - 4)) + trimmed.slice(-2);
}