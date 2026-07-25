// A-05 Consumer Directory — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";
import type { ConsumerBooking, ConsumerRow } from "./types";

const KEY = "adminConsumers";
const BKG_KEY = "adminConsumerBookings";
const dayMs = 86_400_000;

const SEED: ConsumerRow[] = [
  { id: "c_1", name: "Priya S.", phone: "+91 98765 12340", email: "priya.s@example.com", city: "Chennai", vehiclesCount: 2, bookingsCount: 27, gmvLifetime: 41200, lastBookingAt: new Date(Date.now() - dayMs).toISOString(), createdAt: new Date(Date.now() - dayMs * 200).toISOString() },
  { id: "c_2", name: "Rahul K.", phone: "+91 98765 12341", email: "rahul.k@example.com", city: "Chennai", vehiclesCount: 1, bookingsCount: 12, gmvLifetime: 18500, lastBookingAt: new Date(Date.now() - dayMs * 3).toISOString(), createdAt: new Date(Date.now() - dayMs * 90).toISOString() },
  { id: "c_3", name: "Meera N.", phone: "+91 98765 12342", city: "Chennai", vehiclesCount: 1, bookingsCount: 9, gmvLifetime: 12200, createdAt: new Date(Date.now() - dayMs * 40).toISOString() },
  { id: "c_4", name: "Arjun P.", phone: "+91 98765 12343", email: "arjun.p@example.com", city: "Bengaluru", vehiclesCount: 3, bookingsCount: 58, gmvLifetime: 128900, lastBookingAt: new Date(Date.now() - dayMs * 5).toISOString(), createdAt: new Date(Date.now() - dayMs * 400).toISOString() },
  { id: "c_5", name: "Divya M.", phone: "+91 98765 12344", city: "Chennai", vehiclesCount: 1, bookingsCount: 3, gmvLifetime: 2400, createdAt: new Date(Date.now() - dayMs * 12).toISOString() },
];

const SEED_BOOKINGS: Record<string, ConsumerBooking[]> = {
  c_1: [
    { id: "b_1", ref: "BK-8412", kind: "parking", amount: 240, status: "disputed", createdAt: new Date(Date.now() - dayMs * 1).toISOString(), provider: "Anand Motors" },
    { id: "b_2", ref: "BK-8355", kind: "ev", amount: 480, status: "completed", createdAt: new Date(Date.now() - dayMs * 4).toISOString(), provider: "GreenCharge Hub" },
  ],
  c_2: [
    { id: "b_3", ref: "BK-8390", kind: "ev", amount: 180, status: "disputed", createdAt: new Date(Date.now() - dayMs * 3).toISOString(), provider: "GreenCharge Hub" },
  ],
  c_4: [
    { id: "b_4", ref: "BK-8102", kind: "rental", amount: 12500, status: "active", createdAt: new Date(Date.now() - dayMs * 5).toISOString(), provider: "Adyar Bay Rental" },
  ],
};

function load(): ConsumerRow[] {
  const existing = readJson<ConsumerRow[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function loadBookings(): Record<string, ConsumerBooking[]> {
  const existing = readJson<Record<string, ConsumerBooking[]> | null>(
    BKG_KEY,
    null,
  );
  if (existing) return existing;
  writeJson(BKG_KEY, SEED_BOOKINGS);
  return SEED_BOOKINGS;
}

function save(list: ConsumerRow[]) {
  writeJson(KEY, list);
}

export async function searchConsumers(query: string): Promise<ConsumerRow[]> {
  const list = load();
  if (!query) return list.sort((a, b) => b.gmvLifetime - a.gmvLifetime);
  const q = query.toLowerCase();
  return list
    .filter((c) =>
      [c.name, c.phone, c.email ?? "", c.city, c.id]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
    .sort((a, b) => b.gmvLifetime - a.gmvLifetime);
}

export async function getConsumerBookings(id: string): Promise<ConsumerBooking[]> {
  return loadBookings()[id] ?? [];
}

export async function toggleConsumerSuspension(
  id: string,
): Promise<ConsumerRow | null> {
  const list = load();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], suspended: !list[idx].suspended };
  save(list);
  pushNotification({
    audience: "consumer",
    audienceId: list[idx].phone,
    title: list[idx].suspended ? "Account suspended" : "Account reactivated",
    body: list[idx].suspended
      ? "Contact support to resolve."
      : "You can start booking again.",
  });
  return list[idx];
}
