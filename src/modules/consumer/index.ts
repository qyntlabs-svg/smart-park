// Consumer (a.k.a. customer) module — every screen a consumer sees.
// Existing files stay at src/pages/*; this barrel makes the module boundary
// visible and gives App.tsx a single import source per role.

// Auth
export { default as LoginScreen } from "@/pages/LoginScreen";

// Home + browsing
export { default as HomeScreen } from "@/pages/HomeScreen";
export { default as ChangeLocationScreen } from "@/pages/ChangeLocationScreen";

// Vehicles
export { default as AddVehicleScreen } from "@/pages/AddVehicleScreen";
export { default as VehicleAddedScreen } from "@/pages/VehicleAddedScreen";
export { default as MyVehiclesScreen } from "@/pages/MyVehiclesScreen";
export { default as EditVehicleScreen } from "@/pages/EditVehicleScreen";

// Parking booking flow
export { default as SlotSelectionScreen } from "@/pages/SlotSelectionScreen";
export { default as BookingSummaryScreen } from "@/pages/BookingSummaryScreen";
export { default as SelectionSuccessScreen } from "@/pages/SelectionSuccessScreen";
export { default as UpiPaymentScreen } from "@/pages/UpiPaymentScreen";
export { default as BookingQrScreen } from "@/pages/BookingQrScreen";
export { default as BookingHistoryScreen } from "@/pages/BookingHistoryScreen";

// Monthly pass
export { default as MonthlyPassScreen } from "@/pages/MonthlyPassScreen";
export { default as ActivePassScreen } from "@/pages/ActivePassScreen";

// Mechanic-consumer flow
export { default as MechanicsScreen } from "@/pages/MechanicsScreen";
export { default as MechanicShopDetailScreen } from "@/pages/MechanicShopDetailScreen";
export { default as ConsumerMechanicBookingsScreen } from "@/pages/ConsumerMechanicBookingsScreen";
export { default as ConsumerMobileMechanicRequestScreen } from "@/pages/ConsumerMobileMechanicRequestScreen";
export { default as ConsumerMobileMechanicStatusScreen } from "@/pages/ConsumerMobileMechanicStatusScreen";

// Profile / support
export { default as ProfileScreen } from "@/pages/ProfileScreen";
export { default as EditProfileScreen } from "@/pages/EditProfileScreen";
export { default as NotificationsScreen } from "@/pages/NotificationsScreen";
export { default as HelpSupportScreen } from "@/pages/HelpSupportScreen";
export { default as ShopScreen } from "@/pages/ShopScreen";
