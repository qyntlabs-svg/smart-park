// Types for the Consumer Active Parking Session (C-21).
// Kept small on purpose — the parking booking primitive already exists via
// api/parking + api/bookings; this module models the *live* session view.

export type ParkingSessionStatus =
  | "active"
  | "completed"
  | "cancelled";

export interface ParkingSession {
  id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  slotNumber: string;
  vehicleId?: string;
  vehicleRegistration?: string;
  hourlyRate: number;
  startedAt: string;
  /** null while active. */
  endedAt?: string;
  /** Latest computed running cost (rupees). Updated on tick. */
  runningCost: number;
  /** How many 30-min extensions the consumer bought so far. */
  extensions: number;
  /** Optional soft cap agreed at booking time (minutes). */
  capMinutes?: number;
  status: ParkingSessionStatus;
  exitQrToken: string;
}

export interface ExtendParkingInput {
  sessionId: string;
  addMinutes: number; // typically 30
}
