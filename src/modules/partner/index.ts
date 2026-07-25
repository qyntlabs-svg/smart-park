// Partner (parking vendor) module — includes hourly parking dashboard,
// KYC, QR/scan, monthly passes, plus the new EV + Rental features which
// live in their own dedicated modules but are surfaced through the Partner
// nav (side drawer, dashboard tiles).

// Auth + onboarding
export { default as PartnerLoginScreen } from "@/pages/PartnerLoginScreen";
export { default as PartnerRegisterScreen } from "@/pages/PartnerRegisterScreen";
export { default as PartnerKycScreen } from "@/pages/PartnerKycScreen";
export { default as PartnerPendingScreen } from "@/pages/PartnerPendingScreen";
export { default as PartnerSetupScreen } from "@/pages/PartnerSetupScreen";

// Dashboard + operations
export { default as PartnerDashboardScreen } from "@/pages/PartnerDashboardScreen";
export { default as PartnerScanScreen } from "@/pages/PartnerScanScreen";
export { default as PartnerQrCodesScreen } from "@/pages/PartnerQrCodesScreen";
export { default as PartnerDailyLogScreen } from "@/pages/PartnerDailyLogScreen";
export { default as PartnerReportsScreen } from "@/pages/PartnerReportsScreen";
export { default as PartnerPinMapScreen } from "@/pages/PartnerPinMapScreen";
export { default as PartnerMonthlyPassScreen } from "@/pages/PartnerMonthlyPassScreen";

// EV + Rental — re-exported here so App.tsx can import all Partner-visible
// pages from "@/modules/partner" while the actual code lives in its own
// domain module.
export {
  PartnerEvStationsScreen,
  PartnerEvStationSetupScreen,
} from "@/modules/ev";
export {
  PartnerRentalsScreen,
  PartnerRentalSetupScreen,
} from "@/modules/rental";
