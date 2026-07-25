// Journey planner types (C-45, C-46).

export type JourneyLegKind = "drive" | "charge" | "park";

export interface JourneyLeg {
  id: string;
  kind: JourneyLegKind;
  title: string;
  subtitle?: string;
  /** Estimated minutes for this leg. */
  minutes: number;
  /** Estimated cost for this leg (₹). */
  cost: number;
  /** Distance in km (only for drive legs). */
  km?: number;
  /** For charge legs — kWh to add. */
  kwh?: number;
}

export interface Journey {
  id: string;
  userId: string;
  from: string;
  to: string;
  createdAt: string;
  totalMinutes: number;
  totalCost: number;
  legs: JourneyLeg[];
  /** Set to true once "Confirm all" has been tapped. */
  reserved?: boolean;
}
