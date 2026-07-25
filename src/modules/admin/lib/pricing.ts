// Admin-controlled mobile-mechanic pricing knobs.
// Facade over src/lib/mechanic.ts — see MODULES.md for the migration plan.

export type { MobilePricing, MobileQuote } from "@/lib/mechanic";

export {
  getMobilePricing,
  setMobilePricing,
  calcMobileQuote,
  isNightTime,
  MOBILE_SERVICE_CATALOGUE,
} from "@/lib/mechanic";
