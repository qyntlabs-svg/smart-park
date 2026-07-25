// Fleet OS module — public types shared across pages.
// Screen family: F-01 … F-13 (see docs/SCREEN_INVENTORY.md §4.7).
// Mobility Kernel primitives: Vehicle, Identity, Payment, Reservation, Notification.

export type FleetVehicleFuel = "ev" | "ice" | "hybrid";
export type FleetVehicleStatus =
  | "in_service"
  | "idle"
  | "charging"
  | "maintenance"
  | "offline";

export interface FleetVehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  fuel: FleetVehicleFuel;
  batteryKwh?: number;
  currentSocPct?: number;
  odometerKm: number;
  status: FleetVehicleStatus;
  healthScore: number; // 0-100
  costCenterId: string;
  depotId: string;
  assignedDriverId?: string;
  nextServiceKm: number;
  telematics: {
    online: boolean;
    lastPingAt: string;
    signalStrength: 0 | 1 | 2 | 3 | 4;
  };
  createdAt: string;
}

export type FleetDriverStatus = "active" | "on_leave" | "suspended";

export interface FleetDriver {
  id: string;
  name: string;
  employeeCode: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string; // ISO date
  costCenterId: string;
  rating: number; // 0-5
  totalTrips: number;
  totalKm: number;
  status: FleetDriverStatus;
  shifts: FleetShift[];
  createdAt: string;
}

export interface FleetShift {
  id: string;
  driverId: string;
  vehicleId?: string;
  startAt: string;
  endAt: string;
  routeId?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
}

export interface FleetCostCenter {
  id: string;
  name: string;
  code: string;
  monthlyBudget: number;
  monthlySpend: number;
}

export interface FleetDepot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface FleetRoute {
  id: string;
  name: string;
  originDepotId: string;
  waypoints: Array<{ lat: number; lng: number; label: string }>;
  distanceKm: number;
  chargingStops: string[]; // stationIds
  optimizedAt?: string;
}

export interface FleetMaintenanceOrder {
  id: string;
  vehicleId: string;
  type: "predictive" | "scheduled" | "breakdown";
  reason: string;
  status: "requested" | "booked" | "in_progress" | "completed";
  mechanicShopId?: string;
  scheduledAt: string;
  completedAt?: string;
  estCost: number;
}

export interface FleetPolicy {
  id: string;
  name: string;
  scope: "global" | "cost_center" | "driver";
  scopeId?: string;
  maxSessionSpend: number;
  dailySpendCap: number;
  monthlySpendCap: number;
  requireApprovalOver: number;
  mandatoryStops: string[]; // stationIds
  allowedFuelTypes: FleetVehicleFuel[];
  enabled: boolean;
}

export interface FleetBatchReservation {
  id: string;
  label: string;
  depotId: string;
  windowStart: string;
  windowEnd: string;
  chargersNeeded: number;
  status: "draft" | "confirmed" | "partially_confirmed" | "cancelled";
  confirmedIds: string[];
  createdAt: string;
}

export interface FleetInvoice {
  id: string;
  month: string; // YYYY-MM
  total: number;
  status: "draft" | "issued" | "paid" | "overdue";
  costCenterBreakdown: Array<{ costCenterId: string; total: number }>;
  issuedAt: string;
}

export interface FleetApiKey {
  id: string;
  label: string;
  keyMasked: string; // sk_live_****abcd
  scopes: FleetApiScope[];
  createdAt: string;
  lastUsedAt?: string;
  rotatedAt?: string;
  revoked: boolean;
}

export type FleetApiScope =
  | "vehicles.read"
  | "vehicles.write"
  | "drivers.read"
  | "reservations.read"
  | "reservations.write"
  | "reports.read";

export interface FleetSsoConfig {
  id: string;
  protocol: "saml" | "oidc";
  issuer: string;
  entityId?: string;
  ssoUrl: string;
  audience: string;
  certificateFingerprint: string;
  status: "draft" | "verified" | "error";
  updatedAt: string;
}

export interface FleetAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  vehicleId?: string;
  createdAt: string;
  read: boolean;
}

export const FUEL_LABEL: Record<FleetVehicleFuel, string> = {
  ev: "EV",
  ice: "ICE",
  hybrid: "Hybrid",
};

export const VEHICLE_STATUS_LABEL: Record<FleetVehicleStatus, string> = {
  in_service: "In service",
  idle: "Idle",
  charging: "Charging",
  maintenance: "Maintenance",
  offline: "Offline",
};

export const DRIVER_STATUS_LABEL: Record<FleetDriverStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  suspended: "Suspended",
};
