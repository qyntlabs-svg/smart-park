// Parking Rental — localStorage-backed mock store.
// See src/modules/ev/store.ts for the design rationale — identical shape so
// both mocks can be swapped to real API calls the same way.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import { haversineKm } from "@/shared/lib/geo";
import { pushNotification } from "@/shared/lib/notifications";
import {
  dailyEquivalent,
  type RentalBooking,
  type RentalListing,
  type RentalPeriod,
  type RentalSearchFilters,
} from "./types";

const LISTINGS_KEY = "parkingRentalListings";
const BOOKINGS_KEY = "parkingRentalBookings";

// ---------- Seed data ----------

const SEED_LISTINGS: RentalListing[] = [
  {
    id: "rent-seed-1",
    partnerId: "partner-demo",
    title: "Covered Reserved Spot — Anna Nagar Tower",
    description:
      "Dedicated covered parking bay inside a gated residential tower, ideal for long-term car rental with 24×7 security.",
    address: "Anna Nagar West, Chennai 600040",
    lat: 13.087,
    lng: 80.207,
    slotType: "covered",
    vehicleTypes: ["car"],
    totalSpots: 4,
    availableSpots: 2,
    pricing: {
      dailyRate: 250,
      weeklyRate: 1500,
      monthlyRate: 5000,
      securityDeposit: 2000,
      taxPct: 18,
    },
    amenities: ["24x7_access", "cctv", "security_guard", "gated", "covered"],
    photos: [],
    minPeriod: "weekly",
    status: "active",
    contactPhone: "+91 98765 30001",
    rating: 4.7,
    reviewCount: 8,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rent-seed-2",
    partnerId: "partner-demo",
    title: "Open-Air Bike Rental Rack — T Nagar",
    description:
      "Row of open-air two-wheeler spots opposite Pondy Bazaar. Weekly & monthly plans available.",
    address: "Pondy Bazaar, T Nagar, Chennai 600017",
    lat: 13.041,
    lng: 80.232,
    slotType: "open",
    vehicleTypes: ["bike"],
    totalSpots: 12,
    availableSpots: 9,
    pricing: {
      dailyRate: 60,
      weeklyRate: 350,
      monthlyRate: 1200,
      securityDeposit: 500,
      taxPct: 18,
    },
    amenities: ["cctv", "24x7_access"],
    photos: [],
    minPeriod: "daily",
    status: "active",
    contactPhone: "+91 98765 30002",
    rating: 4.3,
    reviewCount: 15,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rent-seed-3",
    partnerId: "partner-demo",
    title: "Basement Commercial Vehicle Bay — Guindy Industrial",
    description:
      "Large basement bays sized for tempo / mini-truck. Monthly rental only.",
    address: "Guindy Industrial Estate, Chennai 600032",
    lat: 13.006,
    lng: 80.211,
    slotType: "basement",
    vehicleTypes: ["commercial"],
    totalSpots: 3,
    availableSpots: 1,
    pricing: { monthlyRate: 9500, securityDeposit: 5000, taxPct: 18 },
    amenities: ["cctv", "security_guard", "gated", "covered", "restroom"],
    photos: [],
    minPeriod: "monthly",
    status: "active",
    contactPhone: "+91 98765 30003",
    rating: 4.5,
    reviewCount: 4,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function loadAllListings(): RentalListing[] {
  const existing = readJson<RentalListing[] | null>(LISTINGS_KEY, null);
  if (existing) return existing;
  writeJson(LISTINGS_KEY, SEED_LISTINGS);
  return SEED_LISTINGS;
}
function saveListings(list: RentalListing[]) {
  writeJson(LISTINGS_KEY, list);
}

function loadAllBookings(): RentalBooking[] {
  return readJson<RentalBooking[]>(BOOKINGS_KEY, []);
}
function saveBookings(list: RentalBooking[]) {
  writeJson(BOOKINGS_KEY, list);
}

// ---------- Filtering ----------

function passesFilters(l: RentalListing, f: RentalSearchFilters): boolean {
  if (f.onlyActive && l.status !== "active") return false;
  if (f.vehicleType && !l.vehicleTypes.includes(f.vehicleType)) return false;
  if (f.slotType && l.slotType !== f.slotType) return false;
  if (
    typeof f.maxRatePerDay === "number" &&
    dailyEquivalent(l.pricing) > f.maxRatePerDay
  )
    return false;
  if (f.amenities?.length) {
    if (!f.amenities.every((a) => l.amenities.includes(a))) return false;
  }
  return true;
}

// ---------- Listings API ----------

export async function listListings(
  filters: RentalSearchFilters = {},
  origin?: { lat: number; lng: number },
): Promise<Array<RentalListing & { distanceKm?: number }>> {
  const all = loadAllListings().filter((l) => passesFilters(l, filters));
  const withDistance: Array<RentalListing & { distanceKm?: number }> = origin
    ? all.map((l) => ({
        ...l,
        distanceKm: haversineKm(origin, { lat: l.lat, lng: l.lng }),
      }))
    : all;
  return withDistance.sort(
    (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
  );
}

export async function listListingsByPartner(
  partnerId: string,
): Promise<RentalListing[]> {
  return loadAllListings().filter((l) => l.partnerId === partnerId);
}

export async function getListing(id: string): Promise<RentalListing | null> {
  return loadAllListings().find((l) => l.id === id) ?? null;
}

export async function createListing(
  input: Omit<
    RentalListing,
    "id" | "createdAt" | "updatedAt" | "rating" | "reviewCount"
  >,
): Promise<RentalListing> {
  const now = new Date().toISOString();
  const listing: RentalListing = {
    ...input,
    id: makeId("rent"),
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const list = loadAllListings();
  list.unshift(listing);
  saveListings(list);
  pushNotification({
    audience: "owner",
    audienceId: input.partnerId,
    title: "Rental listing published",
    body: `${listing.title} is now visible to consumers.`,
  });
  return listing;
}

export async function updateListing(
  id: string,
  patch: Partial<RentalListing>,
): Promise<RentalListing | null> {
  const list = loadAllListings();
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const next: RentalListing = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  saveListings(list);
  return next;
}

export async function deleteListing(id: string): Promise<boolean> {
  const list = loadAllListings();
  const next = list.filter((l) => l.id !== id);
  if (next.length === list.length) return false;
  saveListings(next);
  return true;
}

export async function toggleListingStatus(
  id: string,
): Promise<RentalListing | null> {
  const l = await getListing(id);
  if (!l) return null;
  return updateListing(id, {
    status: l.status === "active" ? "paused" : "active",
  });
}

// ---------- Booking API ----------

/** Deterministic quote so vendor + consumer see the same total. */
export function quoteRental(
  listing: RentalListing,
  period: RentalPeriod,
  duration: number,
): Pick<
  RentalBooking,
  "amount" | "deposit" | "taxes" | "totalAmount"
> {
  const rate =
    period === "daily"
      ? listing.pricing.dailyRate
      : period === "weekly"
        ? listing.pricing.weeklyRate
        : listing.pricing.monthlyRate;
  const base = Math.max(0, rate ?? 0) * Math.max(1, duration);
  const taxes = Math.round(base * ((listing.pricing.taxPct ?? 18) / 100));
  const deposit = listing.pricing.securityDeposit ?? 0;
  return {
    amount: base,
    deposit,
    taxes,
    totalAmount: base + taxes + deposit,
  };
}

function addPeriod(startISO: string, period: RentalPeriod, n: number): string {
  const d = new Date(startISO);
  if (period === "daily") d.setDate(d.getDate() + n);
  else if (period === "weekly") d.setDate(d.getDate() + n * 7);
  else d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

export async function requestBooking(input: {
  listingId: string;
  customerName: string;
  customerPhone: string;
  vehicleRegistration?: string;
  period: RentalPeriod;
  duration: number;
  startDate: string;
}): Promise<RentalBooking> {
  const listing = await getListing(input.listingId);
  if (!listing) throw new Error("Listing not found");
  const quote = quoteRental(listing, input.period, input.duration);
  const booking: RentalBooking = {
    id: makeId("rb"),
    listingId: input.listingId,
    partnerId: listing.partnerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    vehicleRegistration: input.vehicleRegistration,
    period: input.period,
    duration: input.duration,
    startDate: input.startDate,
    endDate: addPeriod(input.startDate, input.period, input.duration),
    ...quote,
    paymentStatus: "pending",
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  const all = loadAllBookings();
  all.unshift(booking);
  saveBookings(all);
  pushNotification({
    audience: "owner",
    audienceId: listing.partnerId,
    title: "New rental request",
    body: `${input.customerName} requested ${input.duration} ${input.period === "daily" ? "day(s)" : input.period === "weekly" ? "week(s)" : "month(s)"} at ${listing.title}.`,
  });
  pushNotification({
    audience: "consumer",
    audienceId: input.customerPhone,
    title: "Rental request submitted",
    body: `Awaiting confirmation from ${listing.title}.`,
  });
  return booking;
}

export async function listBookingsByPartner(
  partnerId: string,
): Promise<RentalBooking[]> {
  return loadAllBookings().filter((b) => b.partnerId === partnerId);
}

export async function listBookingsByConsumer(
  phone: string,
): Promise<RentalBooking[]> {
  return loadAllBookings().filter((b) => b.customerPhone === phone);
}
