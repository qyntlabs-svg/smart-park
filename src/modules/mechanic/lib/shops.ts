// Mechanic-shop-scoped exports (auth + shop CRUD + reviews + bookings + categories).
//
// This is a facade re-export over the current monolithic src/lib/mechanic.ts.
// New code should import from "@/modules/mechanic/lib/shops" so that when we
// physically split the underlying store later, callers won't need to change.

export type {
  MechanicAuth,
  MechanicStatus,
  MechanicShop,
  MechanicService,
  MechanicReview,
  MechanicBooking,
  VehicleCategory,
} from "@/lib/mechanic";

export {
  // Auth
  getMechanicAuth,
  setMechanicAuth,
  // Shop CRUD
  getMechanicShop,
  setMechanicShop,
  getPublicShops,
  addReviewToShop,
  // Bookings
  getMechanicBookings,
  addMechanicBooking,
  updateMechanicBooking,
  getConsumerBookings,
  getShopBookings,
  generateOtp,
  maskContact,
  // Category catalogue
  VEHICLE_CATEGORIES,
} from "@/lib/mechanic";
