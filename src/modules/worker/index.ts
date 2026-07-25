// Worker (mechanic employee) module — invited by a Mechanic, has its own
// self-contained login + dashboard.

export { default as WorkerRegisterScreen } from "@/pages/WorkerRegisterScreen";
export { default as WorkerPendingScreen } from "@/pages/WorkerPendingScreen";
export { default as WorkerDashboardScreen } from "@/pages/WorkerDashboardScreen";
export { default as WorkerProfileScreen } from "@/pages/WorkerProfileScreen";

// W-05..W-10 (Phase-1 new screens).
export { default as WorkerJobDetailScreen } from "./pages/WorkerJobDetailScreen";
export { default as WorkerJobNavScreen } from "./pages/WorkerJobNavScreen";
export { default as WorkerJobProofScreen } from "./pages/WorkerJobProofScreen";
export { default as WorkerEarningsScreen } from "./pages/WorkerEarningsScreen";
export { default as WorkerAvailabilityScreen } from "./pages/WorkerAvailabilityScreen";
export { default as WorkerNotificationsScreen } from "./pages/WorkerNotificationsScreen";

// Data layer (facade over legacy src/lib/mechanic.ts — worker slice)
export * from "./lib";
