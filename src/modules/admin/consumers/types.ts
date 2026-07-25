// A-05 Consumer Directory — domain types.

export interface ConsumerRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  vehiclesCount: number;
  bookingsCount: number;
  gmvLifetime: number;
  lastBookingAt?: string;
  createdAt: string;
  suspended?: boolean;
}

export interface ConsumerBooking {
  id: string;
  ref: string;
  kind: "parking" | "ev" | "rental" | "mechanic" | "tow";
  amount: number;
  status: "active" | "completed" | "cancelled" | "disputed";
  createdAt: string;
  provider: string;
}
