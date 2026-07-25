// Mechanic OS — desktop-first SaaS console for larger shops.
//
// Owns MOS-01 … MOS-11 plus the sidebar layout shell. Data lives in
// ./lib/mos-store; screens themselves compose over shop bookings from
// @/modules/mechanic.

export { default as MosConsoleHomeScreen } from "./pages/MosConsoleHomeScreen";
export { default as MosJobListScreen } from "./pages/MosJobListScreen";
export { default as MosDigitalJobCardScreen } from "./pages/MosDigitalJobCardScreen";
export { default as MosCustomerCrmScreen } from "./pages/MosCustomerCrmScreen";
export { default as MosInventoryScreen } from "./pages/MosInventoryScreen";
export { default as MosEstimatesScreen } from "./pages/MosEstimatesScreen";
export { default as MosInvoicesScreen } from "./pages/MosInvoicesScreen";
export { default as MosBaySchedulerScreen } from "./pages/MosBaySchedulerScreen";
export { default as MosMultiShopRollupScreen } from "./pages/MosMultiShopRollupScreen";
export { default as MosTechPerformanceScreen } from "./pages/MosTechPerformanceScreen";
export { default as MosRecallsScreen } from "./pages/MosRecallsScreen";
export { default as MosRemindersScreen } from "./pages/MosRemindersScreen";

export { default as MechanicOsLayout } from "./components/MechanicOsLayout";
