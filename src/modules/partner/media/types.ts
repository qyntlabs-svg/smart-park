// V-24 Facility Photos & Amenities — domain types.

export interface FacilityPhoto {
  id: string;
  facilityId: string;
  url: string;
  caption?: string;
  isCover?: boolean;
  createdAt: string;
}

export interface FacilityMedia {
  facilityId: string;
  facilityName: string;
  partnerId: string;
  photos: FacilityPhoto[];
  amenities: string[]; // slugs from AMENITY_CATALOG
  updatedAt: string;
}

export const AMENITY_CATALOG: Array<{ slug: string; label: string; emoji: string }> = [
  { slug: "cctv", label: "CCTV", emoji: "📹" },
  { slug: "wifi", label: "Wi-Fi", emoji: "📶" },
  { slug: "restroom", label: "Restroom", emoji: "🚻" },
  { slug: "cafe", label: "Café", emoji: "☕" },
  { slug: "shade", label: "Shade / covered", emoji: "🌤️" },
  { slug: "24x7", label: "24×7", emoji: "🕒" },
  { slug: "ev_only", label: "EV only", emoji: "⚡" },
  { slug: "atm", label: "ATM nearby", emoji: "🏧" },
  { slug: "restroom_wc", label: "Wheelchair access", emoji: "♿" },
  { slug: "security", label: "Security guard", emoji: "🛡️" },
  { slug: "attendant", label: "On-site attendant", emoji: "👤" },
  { slug: "washing", label: "Car wash", emoji: "🧽" },
];
