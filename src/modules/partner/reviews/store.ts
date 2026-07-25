// V-23 Vendor Reviews — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import { pushNotification } from "@/shared/lib/notifications";
import type { VendorReview } from "./types";

const KEY = "partnerReviews";
const dayMs = 86_400_000;

const SEED = (partnerId: string): VendorReview[] => {
  const now = Date.now();
  return [
    {
      id: "rv_seed_1",
      partnerId,
      listingId: "parking-main",
      listingName: "T Nagar — Main lot",
      consumerName: "Priya S.",
      bookingRef: "BK-8412",
      rating: 5,
      text: "Very clean and well-lit. Attendant was helpful.",
      createdAt: new Date(now - dayMs * 2).toISOString(),
    },
    {
      id: "rv_seed_2",
      partnerId,
      listingId: "ev-omr",
      listingName: "EV FastCharge — OMR",
      consumerName: "Rahul K.",
      bookingRef: "BK-8390",
      rating: 3,
      text: "Charger worked but only half the speed advertised.",
      createdAt: new Date(now - dayMs * 3).toISOString(),
    },
    {
      id: "rv_seed_3",
      partnerId,
      listingId: "parking-main",
      listingName: "T Nagar — Main lot",
      consumerName: "Meera N.",
      bookingRef: "BK-8221",
      rating: 4,
      text: "Great location. Slightly narrow entry.",
      createdAt: new Date(now - dayMs * 7).toISOString(),
      vendorReply: "Thanks Meera — we're widening the gate next quarter!",
      vendorReplyAt: new Date(now - dayMs * 6).toISOString(),
    },
    {
      id: "rv_seed_4",
      partnerId,
      listingId: "rental-velachery",
      listingName: "Rental — Velachery",
      consumerName: "Arjun P.",
      bookingRef: "BK-8102",
      rating: 2,
      text: "Water leaks in monsoon. Please fix drainage.",
      createdAt: new Date(now - dayMs * 10).toISOString(),
    },
  ];
};

function load(partnerId: string): VendorReview[] {
  const key = `${KEY}:${partnerId}`;
  const existing = readJson<VendorReview[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED(partnerId);
  writeJson(key, seed);
  return seed;
}

function save(partnerId: string, list: VendorReview[]) {
  writeJson(`${KEY}:${partnerId}`, list);
}

export async function listReviews(partnerId: string): Promise<VendorReview[]> {
  return load(partnerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function replyReview(input: {
  partnerId: string;
  reviewId: string;
  reply: string;
}): Promise<VendorReview | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((r) => r.id === input.reviewId);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    vendorReply: input.reply,
    vendorReplyAt: new Date().toISOString(),
  };
  save(input.partnerId, list);
  pushNotification({
    audience: "consumer",
    audienceId: list[idx].consumerName,
    title: "Vendor replied to your review",
    body: input.reply.slice(0, 90),
  });
  return list[idx];
}

export interface ReviewAggregate {
  avg: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export async function getReviewAggregate(
  partnerId: string,
): Promise<ReviewAggregate> {
  const list = load(partnerId);
  const total = list.length;
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  list.forEach((r) => {
    distribution[Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5]++;
  });
  const avg = total ? list.reduce((n, r) => n + r.rating, 0) / total : 0;
  return { avg: Math.round(avg * 10) / 10, total, distribution };
}
