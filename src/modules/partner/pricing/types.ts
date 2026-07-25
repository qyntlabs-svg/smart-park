// V-20 Pricing Rules — vendor-side dynamic-pricing configuration.

export type ListingKind = "parking" | "ev" | "rental";

export interface TimeOfDayRule {
  id: string;
  label: string;
  startHour: number; // 0-23
  endHour: number; // 0-23
  multiplier: number; // 1 = base, 1.5 = surge, 0.75 = discount
  daysOfWeek: number[]; // 0=Sun..6=Sat
  enabled: boolean;
}

export interface PricingConfig {
  partnerId: string;
  listingId: string;
  listingName: string;
  kind: ListingKind;
  basePrice: number;
  baseUnit: "hour" | "kwh" | "day";
  surgeEnabled: boolean;
  surgeMaxMultiplier: number;
  subsidyEnabled: boolean;
  subsidyLabel: string;
  subsidyDiscountPct: number;
  timeOfDay: TimeOfDayRule[];
  updatedAt: string;
}

export const KIND_LABEL: Record<ListingKind, string> = {
  parking: "Parking",
  ev: "EV Charging",
  rental: "Rental",
};

export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
