// SOS / Tow types (C-41, C-42). Kept small — this is the consumer face; the
// full operator app is subagent C's territory.

export type SosSituation =
  | "breakdown"
  | "flat_tyre"
  | "tow"
  | "accident"
  | "out_of_charge";

export const SOS_SITUATION_LABEL: Record<SosSituation, string> = {
  breakdown: "Vehicle breakdown",
  flat_tyre: "Flat tyre",
  tow: "Need a tow",
  accident: "Accident",
  out_of_charge: "Out of charge",
};

export const SOS_SITUATION_DETAIL: Record<SosSituation, string> = {
  breakdown: "Engine won't start or vehicle is stalled",
  flat_tyre: "One or more tyres punctured",
  tow: "Vehicle needs to be moved to a shop",
  accident: "Collision — check-in on driver + vehicle",
  out_of_charge: "EV battery is dead",
};

export type SosStatus =
  | "searching"
  | "assigned"
  | "en_route"
  | "arrived"
  | "completed"
  | "cancelled";

export const SOS_STATUS_LABEL: Record<SosStatus, string> = {
  searching: "Searching for operator",
  assigned: "Operator assigned",
  en_route: "En route to you",
  arrived: "Operator arrived",
  completed: "Completed",
  cancelled: "Cancelled",
};

export interface SosRequest {
  id: string;
  userId: string;
  situation: SosSituation;
  notes?: string;
  /** Consumer's live GPS at request time. */
  origin: { lat: number; lng: number; label?: string };
  vehicleId?: string;
  vehicleRegistration?: string;
  status: SosStatus;

  /** Estimated cost quoted at request (₹). Locked once operator assigned. */
  estimatedCost: number;
  estimatedEtaMinutes: number;

  /** Populated once assigned. */
  driver?: {
    name: string;
    phone: string;
    rating: number;
    vehicle: string;          // e.g. "Tow truck TN 66 XX 9821"
    location: { lat: number; lng: number };
  };

  timeline: SosEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SosEvent {
  at: string;
  status: SosStatus;
  note?: string;
}

/** Cost table for the mock quote. */
export const SOS_COST_TABLE: Record<
  SosSituation,
  { base: number; eta: number }
> = {
  breakdown:      { base: 599, eta: 22 },
  flat_tyre:      { base: 399, eta: 18 },
  tow:            { base: 1499, eta: 30 },
  accident:       { base: 999, eta: 15 },
  out_of_charge:  { base: 799, eta: 25 },
};
