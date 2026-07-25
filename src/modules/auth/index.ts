// Auth module — shared entry points for role selection + per-role login /
// register. Existing screens live at src/pages/* for now; this barrel gives
// the module boundary in code so future migrations can just move the files.

export { default as SplashScreen } from "@/pages/SplashScreen";
export { default as OnboardingScreen } from "@/pages/OnboardingScreen";
export { default as RoleSelectionScreen } from "@/pages/RoleSelectionScreen";
export { default as RolePickerScreen } from "@/pages/RolePickerScreen";
export { default as TermsPrivacyScreen } from "@/pages/TermsPrivacyScreen";
export { default as AboutScreen } from "@/pages/AboutScreen";

// Per-role login lives inside each role's module, imported below for
// convenience so App.tsx can import all auth entry points from one place.
export { LoginScreen } from "@/modules/consumer";
export {
  PartnerLoginScreen,
  PartnerRegisterScreen,
  PartnerPendingScreen,
  PartnerKycScreen,
} from "@/modules/partner";
export {
  MechanicLoginScreen,
  MechanicRegisterScreen,
  MechanicPendingScreen,
  MechanicKycScreen,
} from "@/modules/mechanic";
export {
  WorkerRegisterScreen,
  WorkerPendingScreen,
} from "@/modules/worker";
