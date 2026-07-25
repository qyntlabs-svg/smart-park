// Mechanic (shop owner) module — auth, dashboard, bookings, reviews,
// worker management.

export { default as MechanicLoginScreen } from "@/pages/MechanicLoginScreen";
export { default as MechanicRegisterScreen } from "@/pages/MechanicRegisterScreen";
export { default as MechanicKycScreen } from "@/pages/MechanicKycScreen";
export { default as MechanicPendingScreen } from "@/pages/MechanicPendingScreen";
export { default as MechanicSetupScreen } from "@/pages/MechanicSetupScreen";
export { default as MechanicDashboardScreen } from "@/pages/MechanicDashboardScreen";
export { default as MechanicBookingsScreen } from "@/pages/MechanicBookingsScreen";
export { default as MechanicReviewsScreen } from "@/pages/MechanicReviewsScreen";
export { default as MechanicWorkersScreen } from "@/pages/MechanicWorkersScreen";

// M-10..M-13 (Phase-1 gap-fills, new pages).
export { default as MechanicJobDetailScreen } from "./pages/MechanicJobDetailScreen";
export { default as MechanicDispatchScreen } from "./pages/MechanicDispatchScreen";
export { default as MechanicPayoutsScreen } from "./pages/MechanicPayoutsScreen";
export { default as MechanicNotificationsScreen } from "./pages/MechanicNotificationsScreen";

// Data layer (facade over legacy src/lib/mechanic.ts)
export * from "./lib";
