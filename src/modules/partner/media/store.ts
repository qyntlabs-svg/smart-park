// V-24 Facility Photos & Amenities — localStorage-backed mock store.

import { readJson, writeJson, makeId } from "@/shared/lib/storage";
import type { FacilityMedia, FacilityPhoto } from "./types";

const KEY = "partnerFacilityMedia";

const SEED_URLS = [
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800",
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800",
  "https://images.unsplash.com/photo-1611192471414-8c02f2c4bf68?w=800",
  "https://images.unsplash.com/photo-1568008032037-72f2fd5db69a?w=800",
];

const SEED = (partnerId: string): FacilityMedia[] => {
  const now = new Date().toISOString();
  return [
    {
      partnerId,
      facilityId: "fac_main",
      facilityName: "T Nagar — Main lot",
      photos: [
        {
          id: "ph1",
          facilityId: "fac_main",
          url: SEED_URLS[0],
          caption: "Main entrance",
          isCover: true,
          createdAt: now,
        },
        {
          id: "ph2",
          facilityId: "fac_main",
          url: SEED_URLS[1],
          caption: "Slot view",
          createdAt: now,
        },
      ],
      amenities: ["cctv", "shade", "attendant", "restroom", "atm"],
      updatedAt: now,
    },
    {
      partnerId,
      facilityId: "fac_omr",
      facilityName: "EV FastCharge — OMR",
      photos: [
        {
          id: "ph3",
          facilityId: "fac_omr",
          url: SEED_URLS[2],
          isCover: true,
          createdAt: now,
        },
      ],
      amenities: ["cctv", "24x7", "wifi", "cafe", "ev_only"],
      updatedAt: now,
    },
    {
      partnerId,
      facilityId: "fac_vel",
      facilityName: "Rental — Velachery",
      photos: [],
      amenities: ["cctv", "security"],
      updatedAt: now,
    },
  ];
};

function load(partnerId: string): FacilityMedia[] {
  const key = `${KEY}:${partnerId}`;
  const existing = readJson<FacilityMedia[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED(partnerId);
  writeJson(key, seed);
  return seed;
}

function save(partnerId: string, list: FacilityMedia[]) {
  writeJson(`${KEY}:${partnerId}`, list);
}

export async function listFacilityMedia(
  partnerId: string,
): Promise<FacilityMedia[]> {
  return load(partnerId);
}

export async function addPhoto(input: {
  partnerId: string;
  facilityId: string;
  url: string;
  caption?: string;
}): Promise<FacilityMedia | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((f) => f.facilityId === input.facilityId);
  if (idx === -1) return null;
  const photo: FacilityPhoto = {
    id: makeId("ph"),
    facilityId: input.facilityId,
    url: input.url,
    caption: input.caption,
    isCover: list[idx].photos.length === 0,
    createdAt: new Date().toISOString(),
  };
  list[idx] = {
    ...list[idx],
    photos: [...list[idx].photos, photo],
    updatedAt: new Date().toISOString(),
  };
  save(input.partnerId, list);
  return list[idx];
}

export async function removePhoto(input: {
  partnerId: string;
  facilityId: string;
  photoId: string;
}): Promise<FacilityMedia | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((f) => f.facilityId === input.facilityId);
  if (idx === -1) return null;
  const remaining = list[idx].photos.filter((p) => p.id !== input.photoId);
  // If cover was deleted, promote the first remaining photo to cover.
  const wasCover = list[idx].photos.find((p) => p.id === input.photoId)?.isCover;
  if (wasCover && remaining.length > 0) remaining[0].isCover = true;
  list[idx] = {
    ...list[idx],
    photos: remaining,
    updatedAt: new Date().toISOString(),
  };
  save(input.partnerId, list);
  return list[idx];
}

export async function setCoverPhoto(input: {
  partnerId: string;
  facilityId: string;
  photoId: string;
}): Promise<FacilityMedia | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((f) => f.facilityId === input.facilityId);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    photos: list[idx].photos.map((p) => ({ ...p, isCover: p.id === input.photoId })),
    updatedAt: new Date().toISOString(),
  };
  save(input.partnerId, list);
  return list[idx];
}

export async function setAmenities(input: {
  partnerId: string;
  facilityId: string;
  amenities: string[];
}): Promise<FacilityMedia | null> {
  const list = load(input.partnerId);
  const idx = list.findIndex((f) => f.facilityId === input.facilityId);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    amenities: input.amenities,
    updatedAt: new Date().toISOString(),
  };
  save(input.partnerId, list);
  return list[idx];
}
