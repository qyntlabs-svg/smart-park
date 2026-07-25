// Parking Rental module — types shared by vendor + consumer sides.
//
// A "rental listing" is an OPTIONAL offering a parking partner can enable
// on top of their normal hourly parking. It offers day / week / month
// contract-based access to one or more spots, distinct from hourly booking
// and monthly-pass (which is fixed-price + fixed 1-month duration).

export type RentalPeriod = "daily" | "weekly" | "monthly";
export type RentalStatus = "draft" | "active" | "paused";
export type RentalSlotType = "covered" | "open" | "basement" | "stack";
export type RentalVehicleType = "bike" | "car" | "commercial";

export interface RentalPricing {
  /** ₹ per day. Optional — if unset, daily rental disabled. */
  dailyRate?: number;
  /** ₹ per week. */
  weeklyRate?: number;
  /** ₹ per month. */
  monthlyRate?: number;
  /** One-time refundable security deposit collected on approval. */
  securityDeposit?: number;
  /** GST %; defaults to 18 if unset. */
  taxPct?: number;
}

export type RentalAmenity =
  | "24x7_access"
  | "cctv"
  | "security_guard"
  | "gated"
  | "covered"
  | "ev_socket"
  | "car_wash"
  | "restroom";

export interface RentalListing {
  id: string;
  partnerId: string;
  /** Optional link back to an existing parking facility so we can share
   *  photos / address in the future. */
  facilityId?: string;
  title: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  slotType: RentalSlotType;
  vehicleTypes: RentalVehicleType[];
  totalSpots: number;
  availableSpots: number;
  pricing: RentalPricing;
  amenities: RentalAmenity[];
  photos: string[]; // data URLs
  /** Minimum contract length the vendor will accept. */
  minPeriod: RentalPeriod;
  status: RentalStatus;
  contactPhone?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RentalBooking {
  id: string;
  listingId: string;
  partnerId: string;
  customerName: string;
  customerPhone: string;
  vehicleRegistration?: string;
  period: RentalPeriod;
  /** Number of periods (e.g. 3 with period=monthly = 3 months). */
  duration: number;
  startDate: string; // ISO
  endDate: string; // ISO
  amount: number; // subtotal (rate × duration)
  deposit: number;
  taxes: number;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  status:
    | "requested"
    | "approved"
    | "rejected"
    | "active"
    | "completed"
    | "cancelled";
  createdAt: string;
}

export interface RentalSearchFilters {
  vehicleType?: RentalVehicleType;
  slotType?: RentalSlotType;
  maxRatePerDay?: number;
  amenities?: RentalAmenity[];
  onlyActive?: boolean;
}

export const PERIOD_LABEL: Record<RentalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const SLOT_TYPE_LABEL: Record<RentalSlotType, string> = {
  covered: "Covered",
  open: "Open Air",
  basement: "Basement",
  stack: "Stack / Mechanical",
};

export const VEHICLE_LABEL: Record<RentalVehicleType, string> = {
  bike: "2-wheeler",
  car: "4-wheeler",
  commercial: "Commercial",
};

export const RENTAL_AMENITY_LABEL: Record<RentalAmenity, string> = {
  "24x7_access": "24×7 Access",
  cctv: "CCTV",
  security_guard: "Security Guard",
  gated: "Gated",
  covered: "Covered",
  ev_socket: "EV Socket",
  car_wash: "Car Wash",
  restroom: "Restroom",
};

/** Compute a quick daily-equivalent for sorting / comparison. */
export function dailyEquivalent(p: RentalPricing): number {
  if (p.dailyRate) return p.dailyRate;
  if (p.weeklyRate) return Math.round(p.weeklyRate / 7);
  if (p.monthlyRate) return Math.round(p.monthlyRate / 30);
  return Infinity;
}
