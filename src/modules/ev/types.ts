// EV Charging module — public types shared by vendor + consumer sides.

export type ConnectorType =
  | "type2"
  | "ccs"
  | "chademo"
  | "gbt"
  | "bharat_ac_001"
  | "bharat_dc_001";

export type EvPriceUnit = "per_kwh" | "per_hour";
export type EvStationStatus = "draft" | "active" | "paused";

/** Live status of an individual charging gun. */
export type ChargerStatus =
  | "available"
  | "in_use"
  | "offline"
  | "maintenance";

export const CHARGER_STATUS_LABEL: Record<ChargerStatus, string> = {
  available: "Available",
  in_use: "In use",
  offline: "Offline",
  maintenance: "Maintenance",
};

export interface EvConnector {
  id: string;
  type: ConnectorType;
  /** Rated output in kW (e.g. 3.3, 7.4, 22, 50, 60, 150). */
  powerKw: number;
  /** How many physical guns of this type at the station. */
  count: number;
  /** How many are currently free — mock; real backend would be live. */
  available: number;
  /**
   * Optional per-gun live status. Length == count. If absent, all guns are
   * derived from `available` (available[0..available-1] = available, rest in_use).
   */
  status?: ChargerStatus[];
}

export interface EvPricing {
  unit: EvPriceUnit;
  /** ₹ per kWh or ₹ per hour depending on unit. */
  amount: number;
  /** Optional overstay fee once charging completes, per minute. */
  idleFeePerMinute?: number;
  /** GST %, defaults to 18 if not set. */
  taxPct?: number;
}

export type EvAmenity =
  | "restroom"
  | "cafe"
  | "wifi"
  | "shade"
  | "24x7"
  | "wheelchair"
  | "cctv"
  | "atm";

export interface EvStation {
  id: string;
  partnerId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  connectors: EvConnector[];
  pricing: EvPricing;
  amenities: EvAmenity[];
  photos: string[]; // data URLs in the mock; upload URLs in real backend
  status: EvStationStatus;
  isOpen24x7: boolean;
  openTime?: string; // "HH:mm" — only if !isOpen24x7
  closeTime?: string; // "HH:mm"
  supportPhone?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Consumer-facing search filters. */
export interface EvSearchFilters {
  connectorType?: ConnectorType;
  minPowerKw?: number;
  maxPriceAmount?: number;
  amenities?: EvAmenity[];
  onlyOpen?: boolean;
}

export const CONNECTOR_LABEL: Record<ConnectorType, string> = {
  type2: "Type 2 (AC)",
  ccs: "CCS 2 (DC)",
  chademo: "CHAdeMO (DC)",
  gbt: "GB/T (DC)",
  bharat_ac_001: "Bharat AC-001",
  bharat_dc_001: "Bharat DC-001",
};

export const AMENITY_LABEL: Record<EvAmenity, string> = {
  restroom: "Restroom",
  cafe: "Café / Food",
  wifi: "Free Wi-Fi",
  shade: "Covered / Shade",
  "24x7": "Open 24×7",
  wheelchair: "Wheelchair Access",
  cctv: "CCTV",
  atm: "ATM Nearby",
};

// ---------- EV vehicle profile (local, keyed by vehicleId from vehicles API) ----------

export interface EvVehicleProfile {
  vehicleId: string;
  connectorType: ConnectorType;
  /** Nominal battery capacity in kWh. */
  batteryKwh: number;
  /**
   * Last known state-of-charge, 0-100. Optional: allows the reservation flow
   * to show a realistic "current SOC" without asking the user each time.
   */
  currentSocPct?: number;
}

// ---------- Reservations ----------

export type EvReservationStatus =
  | "requested"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"
  | "no_show"
  | "at_risk";

export type EvReservationTarget =
  | { kind: "soc"; targetSocPct: number }
  | { kind: "duration"; minutes: number }
  | { kind: "full" };

export interface EvReservation {
  id: string;
  stationId: string;
  chargerId: string;
  connectorType: ConnectorType;
  powerKw: number;
  vehicleId: string;
  userId: string;
  /** ISO strings. */
  requestedStart: string;
  requestedEnd: string;
  target: EvReservationTarget;
  /** kWh we expect to deliver during the session. */
  targetKwh: number;
  estimatedCost: number;
  actualCost?: number;
  status: EvReservationStatus;
  /** Reason set when status = at_risk / cancelled. */
  reason?:
    | "charger_offline"
    | "no_show"
    | "user_cancelled"
    | "vendor_cancelled"
    | "hold_expired";
  paymentId?: string;
  /** 4-digit plug-in code shown at the station. */
  plugInCode: string;
  /** Reservation hold expires this many minutes after requestedStart. */
  holdMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Sessions ----------

export type EvSessionStatus =
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled";

export interface EvSession {
  id: string;
  reservationId: string;
  stationId: string;
  chargerId: string;
  connectorType: ConnectorType;
  ratedKw: number;
  vehicleId: string;
  userId: string;
  status: EvSessionStatus;
  /** ISO timestamps. */
  scheduledFor: string;
  startedAt?: string;
  endedAt?: string;
  /** Cumulative kWh delivered so far. */
  kwhDelivered: number;
  /** Instantaneous kW draw (0 when idle/dip). */
  currentKw: number;
  /** kW peak observed. */
  peakKw: number;
  /** ₹ so far (energy only — idle/GST added at receipt time). */
  cost: number;
  /** Target kWh we're charging to (from reservation). */
  targetKwh: number;
  /** Optional target SOC (%). */
  targetSocPct?: number;
  /** Optional current SOC (%). */
  currentSocPct?: number;
  /** Optional initial SOC captured when the session started. */
  startSocPct?: number;
  /** Snapshot of station pricing used to compute cost. */
  pricePerKwh: number;
  taxPct: number;
  idleFeePerMinute: number;
  /** Timestamp of last telemetry tick (used to compute deltas). */
  lastTickAt: string;
  /** 5% chance-per-window flag for a visual "power dip". */
  powerDip: boolean;
  /** How many ticks since the last dip (used to throttle). */
  dipCooldown: number;
}

// ---------- Reviews ----------

export interface EvReview {
  id: string;
  stationId: string;
  sessionId?: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

// ---------- Booking summary state (shared shape with legacy parking flow) ----------

/** Discriminator we pass through booking-summary → UPI → QR so the shared
 *  parking screens can branch cleanly without duplicating layouts. */
export type BookingKind = "parking" | "ev-charging";
