// Mobility Intelligence — types for the Bloomberg-pattern analytics console.

export type IntelCity = "chennai" | "bengaluru" | "hyderabad" | "mumbai";

export interface IntelZone {
  id: string;
  city: IntelCity;
  name: string;
  lat: number;
  lng: number;
  supplyChargers: number;
  supplyParking: number;
}

export interface IntelDayCell {
  zoneId: string;
  date: string; // ISO date (day granularity)
  sessions: number;
  gmv: number; // INR
  unmet: number; // searches that returned no available charger
  avgPrice: number; // per kWh
  uniqueUsers: number;
}

export interface IntelHourCell {
  zoneId: string;
  date: string;
  hour: number; // 0..23
  demand: number; // requests
  supplyBusy: number; // chargers busy at that hour
}

export interface IntelProviderBench {
  providerId: string;
  providerName: string;
  city: IntelCity;
  uptimePct: number;
  utilizationPct: number;
  avgRating: number;
  gmv: number;
  isSelf?: boolean;
}

export interface IntelCohortRow {
  cohortStart: string; // ISO
  size: number;
  retentionPct: number[]; // week 0..11
}

export interface IntelElasticityPoint {
  segment: "commuter" | "fleet" | "casual" | "tourist";
  pricePerKwh: number;
  sessionsPerDay: number;
}

export const CITY_LABEL: Record<IntelCity, string> = {
  chennai: "Chennai",
  bengaluru: "Bengaluru",
  hyderabad: "Hyderabad",
  mumbai: "Mumbai",
};

export type DateRange = "7d" | "30d" | "90d";

export const DATE_RANGE_LABEL: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};
