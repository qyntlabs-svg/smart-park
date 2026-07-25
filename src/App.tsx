import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import { App as CapacitorApp } from "@capacitor/app";
import { usePushNotifications } from "@/hooks/usePushNotifications";

import SplashScreen from "./pages/SplashScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import RoleSelectionScreen from "./pages/RoleSelectionScreen";
import LoginScreen from "./pages/LoginScreen";
import AddVehicleScreen from "./pages/AddVehicleScreen";
import VehicleAddedScreen from "./pages/VehicleAddedScreen";
import HomeScreen from "./pages/HomeScreen";
import SlotSelectionScreen from "./pages/SlotSelectionScreen";
import BookingSummaryScreen from "./pages/BookingSummaryScreen";
import SelectionSuccessScreen from "./pages/SelectionSuccessScreen";
import MyVehiclesScreen from "./pages/MyVehiclesScreen";
import ProfileScreen from "./pages/ProfileScreen";
import UpiPaymentScreen from "./pages/UpiPaymentScreen";
import BookingQrScreen from "./pages/BookingQrScreen";
import BookingHistoryScreen from "./pages/BookingHistoryScreen";
import PartnerLoginScreen from "./pages/PartnerLoginScreen";
import PartnerRegisterScreen from "./pages/PartnerRegisterScreen";
import PartnerKycScreen from "./pages/PartnerKycScreen";
import PartnerPendingScreen from "./pages/PartnerPendingScreen";
import PartnerSetupScreen from "./pages/PartnerSetupScreen";
import PartnerDashboardScreen from "./pages/PartnerDashboardScreen";
import PartnerScanScreen from "./pages/PartnerScanScreen";
import PartnerQrCodesScreen from "./pages/PartnerQrCodesScreen";
import PartnerDailyLogScreen from "./pages/PartnerDailyLogScreen";
import PartnerReportsScreen from "./pages/PartnerReportsScreen";
import PartnerPinMapScreen from "./pages/PartnerPinMapScreen";
import EditProfileScreen from "./pages/EditProfileScreen";
import EditVehicleScreen from "./pages/EditVehicleScreen";
import MechanicsScreen from "./pages/MechanicsScreen";
import ShopScreen from "./pages/ShopScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import HelpSupportScreen from "./pages/HelpSupportScreen";
import TermsPrivacyScreen from "./pages/TermsPrivacyScreen";
import AboutScreen from "./pages/AboutScreen";
import ChangeLocationScreen from "./pages/ChangeLocationScreen";
import MonthlyPassScreen from "./pages/MonthlyPassScreen";
import ActivePassScreen from "./pages/ActivePassScreen";
import PartnerMonthlyPassScreen from "./pages/PartnerMonthlyPassScreen";

import MechanicLoginScreen from "./pages/MechanicLoginScreen";
import MechanicRegisterScreen from "./pages/MechanicRegisterScreen";
import MechanicKycScreen from "./pages/MechanicKycScreen";
import MechanicPendingScreen from "./pages/MechanicPendingScreen";
import MechanicSetupScreen from "./pages/MechanicSetupScreen";
import MechanicDashboardScreen from "./pages/MechanicDashboardScreen";
import MechanicShopDetailScreen from "./pages/MechanicShopDetailScreen";
import MechanicBookingsScreen from "./pages/MechanicBookingsScreen";
import MechanicReviewsScreen from "./pages/MechanicReviewsScreen";
import ConsumerMechanicBookingsScreen from "./pages/ConsumerMechanicBookingsScreen";
import MechanicWorkersScreen from "./pages/MechanicWorkersScreen";
import WorkerRegisterScreen from "./pages/WorkerRegisterScreen";
import WorkerPendingScreen from "./pages/WorkerPendingScreen";
import WorkerDashboardScreen from "./pages/WorkerDashboardScreen";
import WorkerProfileScreen from "./pages/WorkerProfileScreen";
import ConsumerMobileMechanicRequestScreen from "./pages/ConsumerMobileMechanicRequestScreen";
import ConsumerMobileMechanicStatusScreen from "./pages/ConsumerMobileMechanicStatusScreen";
import AdminMobilePricingScreen from "./pages/AdminMobilePricingScreen";

import AdminDashboardScreen from "./pages/AdminDashboardScreen";
import RolePickerScreen from "./pages/RolePickerScreen";
import {
  MechanicGuard,
  WorkerGuard,
  TowGuard,
} from "@/modules/auth/guards";
import { AppBootstrap } from "@/modules/consumer/app-bootstrap/AppBootstrap";

// New feature modules (see src/modules/MODULES.md for the module map).
import {
  PartnerEvStationsScreen,
  PartnerEvStationSetupScreen,
  ConsumerEvStationsScreen,
  ConsumerEvStationDetailScreen,
  EvChargerSelectionScreen,
  EvBookingQrScreen,
  EvActiveSessionScreen,
  EvSessionReceiptScreen,
} from "@/modules/ev";
import {
  PartnerRentalsScreen,
  PartnerRentalSetupScreen,
  ConsumerParkingRentalsScreen,
  ConsumerParkingRentalDetailScreen,
} from "@/modules/rental";

// MECHANIC_OPS_EXT imports (subagent C — M-10..M-13, MOS-01..MOS-11, W-05..W-10, T-01..T-08).
import {
  MechanicJobDetailScreen,
  MechanicDispatchScreen,
  MechanicPayoutsScreen,
  MechanicNotificationsScreen,
} from "@/modules/mechanic";
import {
  WorkerJobDetailScreen,
  WorkerJobNavScreen,
  WorkerJobProofScreen,
  WorkerEarningsScreen,
  WorkerAvailabilityScreen,
  WorkerNotificationsScreen,
} from "@/modules/worker";
import {
  MosConsoleHomeScreen,
  MosJobListScreen,
  MosDigitalJobCardScreen,
  MosCustomerCrmScreen,
  MosInventoryScreen,
  MosEstimatesScreen,
  MosInvoicesScreen,
  MosBaySchedulerScreen,
  MosMultiShopRollupScreen,
  MosTechPerformanceScreen,
  MosRecallsScreen,
  MosRemindersScreen,
} from "@/modules/mechanic-os";
import {
  TowLoginScreen,
  TowRegisterScreen,
  TowDispatchScreen,
  TowJobDetailScreen,
  TowJobProofScreen,
  TowEarningsScreen,
  TowAvailabilityScreen,
  TowProfileScreen,
  TowNotificationsScreen,
} from "@/modules/tow";

// Consumer-extended screens (subagent A) — grouped under a namespace so App.tsx
// stays readable and the CONSUMER_EXT route block below stays self-documenting.
import { ActiveParkingSessionScreen } from "@/modules/consumer/parking-session";
import { WalletScreen, RefundsScreen } from "@/modules/consumer/wallet";
import { EvSubscriptionScreen } from "@/modules/consumer/subscription";
import { SosHomeScreen, SosLiveStatusScreen } from "@/modules/consumer/sos";
import {
  AiConciergeChatScreen,
  AiProactiveFeedScreen,
} from "@/modules/consumer/ai";
import {
  JourneyPlannerScreen,
  OneTapJourneyScreen,
} from "@/modules/consumer/journey";
import {
  VehicleHealthScoreScreen,
  EnergyInsightsScreen,
  MonthlySavingsScreen,
  StreaksScreen,
} from "@/modules/consumer/insights";
import {
  ReferralScreen,
  FamilySharingScreen,
} from "@/modules/consumer/social";
import { MyCarScreen } from "@/modules/consumer/vehicle-identity";
import {
  RoamingStatusScreen,
  NotificationPreferencesScreen,
} from "@/modules/consumer/preferences";
const ConsumerExt = {
  ActiveParkingSessionScreen,
  WalletScreen,
  RefundsScreen,
  EvSubscriptionScreen,
  SosHomeScreen,
  SosLiveStatusScreen,
  AiConciergeChatScreen,
  AiProactiveFeedScreen,
  JourneyPlannerScreen,
  OneTapJourneyScreen,
  VehicleHealthScoreScreen,
  EnergyInsightsScreen,
  MonthlySavingsScreen,
  StreaksScreen,
  ReferralScreen,
  FamilySharingScreen,
  MyCarScreen,
  RoamingStatusScreen,
  NotificationPreferencesScreen,
};

// Owner: subagent D-2 (DATA_GROWTH_EXT). These namespaced imports back the
// routes registered inside the DATA_GROWTH_EXT marker block below. Kept as
// namespace imports so the marker block stays self-contained.
import * as D2Intel from "@/modules/intel";
import * as D2Vip from "@/modules/vip";
import * as D2Growth from "@/modules/growth";

// Owner: subagent D-1 (B2B_CONSOLES_EXT). Namespaced imports back the routes
// registered inside the B2B_CONSOLES_EXT marker block below. All three consoles
// (Fleet OS, Charging Operator SaaS, Developer Portal) mount OUTSIDE
// <ProtectedRoute>; each console handles workspace scoping internally.
import * as D1Fleet from "@/modules/fleet";
import * as D1Operator from "@/modules/operator";
import * as D1Developer from "@/modules/developer";

// Owner: subagent B (VENDOR_ADMIN_EXT). Namespaced imports back the routes
// registered inside the VENDOR_ADMIN_EXT marker block below. Vendor screens
// (V-17..V-26) mount under /partner/* with mobile-first layout; admin screens
// (A-03..A-14) mount under /admin/* with desktop-first sidebar layout.
import { PartnerPayoutsScreen } from "@/modules/partner/payouts";
import { PartnerInvoicesScreen } from "@/modules/partner/invoices";
import { PartnerDisputesScreen } from "@/modules/partner/disputes";
import { PartnerPricingRulesScreen } from "@/modules/partner/pricing";
import { PartnerStaffScreen } from "@/modules/partner/staff";
import { PartnerNotificationsScreen } from "@/modules/partner/notifications";
import { PartnerReviewsScreen } from "@/modules/partner/reviews";
import { PartnerFacilityMediaScreen } from "@/modules/partner/media";
import { PartnerOnboardingChecklistScreen } from "@/modules/partner/onboarding";
import { PartnerReferralScreen } from "@/modules/partner/referral";
import { AdminApprovalsScreen } from "@/modules/admin/approvals";
import { AdminProvidersScreen } from "@/modules/admin/providers";
import { AdminConsumersScreen } from "@/modules/admin/consumers";
import { AdminDisputesScreen } from "@/modules/admin/disputes";
import { AdminPayoutsScreen } from "@/modules/admin/payouts";
import { AdminIncidentsScreen } from "@/modules/admin/incidents";
import { AdminFraudScreen } from "@/modules/admin/fraud";
import { AdminFlagsScreen } from "@/modules/admin/flags";
import { AdminPricingRulesScreen } from "@/modules/admin/pricing";
import { AdminNotificationTemplatesScreen } from "@/modules/admin/notifications-templates";
import { AdminExportsScreen } from "@/modules/admin/exports";
import { AdminRbacScreen } from "@/modules/admin/rbac";

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const Loading = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Handles Android hardware back button + app resume token restore
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rootScreens = [
      "/",
      "/role-select",
      "/home",
      "/partner/dashboard",
      "/admin/dashboard",
      "/onboarding",
    ];

    const handler = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (rootScreens.includes(location.pathname)) {
        CapacitorApp.exitApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, [location.pathname, navigate]);

  // Fix 3: Re-hydrate token from persistent storage when app resumes (e.g. after UPI app)
  useEffect(() => {
    const resumeHandler = CapacitorApp.addListener(
      "appStateChange",
      async ({ isActive }) => {
        if (isActive) {
          const { getToken } = await import("@/lib/token");
          const token = await getToken();
          if (token && !useAuthStore.getState().token) {
            useAuthStore.setState({ token });
          }
        }
      },
    );
    return () => {
      resumeHandler.then((h) => h.remove());
    };
  }, []);

  return null;
};

const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "user" | "partner" | "admin";
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);
  const activeRole = useAuthStore((s) => s.activeRole);
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/role-select" state={{ from: location }} replace />;
  }

  // Admin can browse all routes
  if (hasRole("admin")) return <>{children}</>;

  // If a role is required, check it — but respect activeRole override for dual-role users
  if (role) {
    // activeRole="user" means they chose consumer login — grant user route access
    // activeRole="partner" means they chose partner login — grant partner route access
    const effectivelyHasRole =
      hasRole(role) ||
      (role === "user" && activeRole === "user") ||
      (role === "partner" && activeRole === "partner");

    if (!effectivelyHasRole) {
      const dest =
        activeRole === "partner" || (!activeRole && hasRole("partner"))
          ? "/partner/dashboard"
          : "/home";
      return <Navigate to={dest} replace />;
    }

    // Block dual-role users from crossing into the wrong dashboard
    if (role === "partner" && activeRole === "user") {
      return <Navigate to="/home" replace />;
    }
    if (role === "user" && activeRole === "partner") {
      return <Navigate to="/partner/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/role-select" element={<RoleSelectionScreen />} />
        {/* Consumer routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/verify-otp" element={<Navigate to="/login" replace />} />
        <Route path="/add-vehicle" element={<AddVehicleScreen />} />
        <Route path="/vehicle-added" element={<VehicleAddedScreen />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute role="user">
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parking/:id/slots"
          element={
            <ProtectedRoute role="user">
              <SlotSelectionScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-summary"
          element={
            <ProtectedRoute role="user">
              <BookingSummaryScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/selection-success"
          element={
            <ProtectedRoute role="user">
              <SelectionSuccessScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upi-payment"
          element={
            <ProtectedRoute role="user">
              <UpiPaymentScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-qr"
          element={
            <ProtectedRoute role="user">
              <BookingQrScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-history"
          element={
            <ProtectedRoute role="user">
              <BookingHistoryScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute role="user">
              <MyVehiclesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:id/edit"
          element={
            <ProtectedRoute role="user">
              <EditVehicleScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="user">
              <ProfileScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute role="user">
              <EditProfileScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mechanics"
          element={
            <ProtectedRoute role="user">
              <MechanicsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop"
          element={
            <ProtectedRoute role="user">
              <ShopScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute role="user">
              <NotificationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help-support"
          element={
            <ProtectedRoute role="user">
              <HelpSupportScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/terms-privacy" element={<TermsPrivacyScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route
          path="/change-location"
          element={
            <ProtectedRoute role="user">
              <ChangeLocationScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monthly-pass"
          element={
            <ProtectedRoute role="user">
              <MonthlyPassScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monthly-pass/active"
          element={
            <ProtectedRoute role="user">
              <ActivePassScreen />
            </ProtectedRoute>
          }
        />
        {/* Consumer: EV charging */}
        <Route
          path="/ev"
          element={
            <ProtectedRoute role="user">
              <ConsumerEvStationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ev/:id"
          element={
            <ProtectedRoute role="user">
              <ConsumerEvStationDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ev/stations/:id/reserve"
          element={
            <ProtectedRoute role="user">
              <EvChargerSelectionScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ev/reservation/:id/qr"
          element={
            <ProtectedRoute role="user">
              <EvBookingQrScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ev/session/:id"
          element={
            <ProtectedRoute role="user">
              <EvActiveSessionScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ev/session/:id/receipt"
          element={
            <ProtectedRoute role="user">
              <EvSessionReceiptScreen />
            </ProtectedRoute>
          }
        />
        {/* Consumer: Parking rentals */}
        <Route
          path="/rentals"
          element={
            <ProtectedRoute role="user">
              <ConsumerParkingRentalsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentals/:id"
          element={
            <ProtectedRoute role="user">
              <ConsumerParkingRentalDetailScreen />
            </ProtectedRoute>
          }
        />
        {/* Partner routes */}
        <Route path="/partner/login" element={<PartnerLoginScreen />} />
        <Route path="/partner/register" element={<PartnerRegisterScreen />} />
        <Route
          path="/partner/kyc"
          element={
            <ProtectedRoute>
              <PartnerKycScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/pending"
          element={
            <ProtectedRoute>
              <PartnerPendingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/setup"
          element={
            <ProtectedRoute>
              <PartnerSetupScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/dashboard"
          element={
            <ProtectedRoute>
              <PartnerDashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/scan"
          element={
            <ProtectedRoute>
              <PartnerScanScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/qr-codes"
          element={
            <ProtectedRoute>
              <PartnerQrCodesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/daily-log"
          element={
            <ProtectedRoute>
              <PartnerDailyLogScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/reports"
          element={
            <ProtectedRoute>
              <PartnerReportsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/pin-map"
          element={
            <ProtectedRoute>
              <PartnerPinMapScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/monthly-passes"
          element={
            <ProtectedRoute>
              <PartnerMonthlyPassScreen />
            </ProtectedRoute>
          }
        />
        {/* Partner: EV charging stations */}
        <Route
          path="/partner/ev"
          element={
            <ProtectedRoute>
              <PartnerEvStationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/ev/new"
          element={
            <ProtectedRoute>
              <PartnerEvStationSetupScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/ev/:id/edit"
          element={
            <ProtectedRoute>
              <PartnerEvStationSetupScreen />
            </ProtectedRoute>
          }
        />
        {/* Partner: Parking rental listings */}
        <Route
          path="/partner/rentals"
          element={
            <ProtectedRoute>
              <PartnerRentalsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/rentals/new"
          element={
            <ProtectedRoute>
              <PartnerRentalSetupScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/rentals/:id/edit"
          element={
            <ProtectedRoute>
              <PartnerRentalSetupScreen />
            </ProtectedRoute>
          }
        />
        {/* Mechanic routes (self-contained local auth) */}
        <Route path="/mechanic/login" element={<MechanicLoginScreen />} />
        <Route path="/mechanic/register" element={<MechanicRegisterScreen />} />
        <Route path="/mechanic/kyc" element={<MechanicKycScreen />} />
        <Route path="/mechanic/pending" element={<MechanicPendingScreen />} />
        <Route path="/mechanic/setup" element={<MechanicSetupScreen />} />
        <Route
          path="/mechanic/dashboard"
          element={
            <MechanicGuard>
              <MechanicDashboardScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic/bookings"
          element={
            <MechanicGuard>
              <MechanicBookingsScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic/reviews"
          element={
            <MechanicGuard>
              <MechanicReviewsScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic/workers"
          element={
            <MechanicGuard>
              <MechanicWorkersScreen />
            </MechanicGuard>
          }
        />
        {/* Worker (mechanic employee) routes */}
        <Route path="/worker/register/:token" element={<WorkerRegisterScreen />} />
        <Route
          path="/worker/pending"
          element={
            <WorkerGuard>
              <WorkerPendingScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/worker/dashboard"
          element={
            <WorkerGuard>
              <WorkerDashboardScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/worker/profile"
          element={
            <WorkerGuard>
              <WorkerProfileScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/mechanics/:id"
          element={
            <ProtectedRoute role="user">
              <MechanicShopDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-service-bookings"
          element={
            <ProtectedRoute role="user">
              <ConsumerMechanicBookingsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mobile-mechanic"
          element={
            <ProtectedRoute role="user">
              <ConsumerMobileMechanicRequestScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mobile-mechanic/:id"
          element={
            <ProtectedRoute role="user">
              <ConsumerMobileMechanicStatusScreen />
            </ProtectedRoute>
          }
        />
        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mobile-pricing"
          element={
            <ProtectedRoute role="admin">
              <AdminMobilePricingScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/role-picker" element={<RolePickerScreen />} />
        {/* === BEGIN CONSUMER_EXT ROUTES === */}
        {/* Owner: subagent A. Add Consumer Phase 1+2+3 routes strictly between these markers. */}
        {/* C-21 Active parking session */}
        <Route
          path="/parking/session/:id"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.ActiveParkingSessionScreen />
            </ProtectedRoute>
          }
        />
        {/* C-24 Wallet / payment methods */}
        <Route
          path="/wallet"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.WalletScreen />
            </ProtectedRoute>
          }
        />
        {/* C-25 Refunds & disputes */}
        <Route
          path="/refunds"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.RefundsScreen />
            </ProtectedRoute>
          }
        />
        {/* C-34 EV subscription */}
        <Route
          path="/ev/subscription"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.EvSubscriptionScreen />
            </ProtectedRoute>
          }
        />
        {/* C-41 / C-42 SOS */}
        <Route
          path="/sos"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.SosHomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sos/:id"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.SosLiveStatusScreen />
            </ProtectedRoute>
          }
        />
        {/* C-43 / C-44 AI Concierge */}
        <Route
          path="/ai/chat"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.AiConciergeChatScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/feed"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.AiProactiveFeedScreen />
            </ProtectedRoute>
          }
        />
        {/* C-45 / C-46 Journey planner + one-tap */}
        <Route
          path="/journey"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.JourneyPlannerScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journey/one-tap"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.OneTapJourneyScreen />
            </ProtectedRoute>
          }
        />
        {/* C-47 / C-48 / C-49 / C-50 Insights */}
        <Route
          path="/health-score"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.VehicleHealthScoreScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights/energy"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.EnergyInsightsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights/savings"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.MonthlySavingsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/streaks"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.StreaksScreen />
            </ProtectedRoute>
          }
        />
        {/* C-51 Referral / C-55 Family sharing */}
        <Route
          path="/referral"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.ReferralScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.FamilySharingScreen />
            </ProtectedRoute>
          }
        />
        {/* C-52 Vehicle identity — My Car */}
        <Route
          path="/my-car"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.MyCarScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-car/:vehicleId"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.MyCarScreen />
            </ProtectedRoute>
          }
        />
        {/* C-53 Roaming */}
        <Route
          path="/roaming"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.RoamingStatusScreen />
            </ProtectedRoute>
          }
        />
        {/* C-54 Notification preferences */}
        <Route
          path="/notifications/preferences"
          element={
            <ProtectedRoute role="user">
              <ConsumerExt.NotificationPreferencesScreen />
            </ProtectedRoute>
          }
        />
        {/* === END CONSUMER_EXT ROUTES === */}
        {/* === BEGIN VENDOR_ADMIN_EXT ROUTES === */}
        {/* Owner: subagent B. Add Vendor + Admin extended routes strictly between these markers. */}
        {/* Vendor screens (V-17..V-26) — mobile-first partner surfaces */}
        <Route
          path="/partner/payouts"
          element={
            <ProtectedRoute>
              <PartnerPayoutsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/invoices"
          element={
            <ProtectedRoute>
              <PartnerInvoicesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/disputes"
          element={
            <ProtectedRoute>
              <PartnerDisputesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/pricing-rules"
          element={
            <ProtectedRoute>
              <PartnerPricingRulesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/staff"
          element={
            <ProtectedRoute>
              <PartnerStaffScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/notifications"
          element={
            <ProtectedRoute>
              <PartnerNotificationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/reviews"
          element={
            <ProtectedRoute>
              <PartnerReviewsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/facility-media"
          element={
            <ProtectedRoute>
              <PartnerFacilityMediaScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/onboarding"
          element={
            <ProtectedRoute>
              <PartnerOnboardingChecklistScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/referral"
          element={
            <ProtectedRoute>
              <PartnerReferralScreen />
            </ProtectedRoute>
          }
        />
        {/* Admin console (A-03..A-14) — desktop-first ops surfaces */}
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute role="admin">
              <AdminApprovalsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/providers"
          element={
            <ProtectedRoute role="admin">
              <AdminProvidersScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/consumers"
          element={
            <ProtectedRoute role="admin">
              <AdminConsumersScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute role="admin">
              <AdminDisputesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payouts"
          element={
            <ProtectedRoute role="admin">
              <AdminPayoutsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/incidents"
          element={
            <ProtectedRoute role="admin">
              <AdminIncidentsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fraud"
          element={
            <ProtectedRoute role="admin">
              <AdminFraudScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/flags"
          element={
            <ProtectedRoute role="admin">
              <AdminFlagsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pricing-rules"
          element={
            <ProtectedRoute role="admin">
              <AdminPricingRulesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications-templates"
          element={
            <ProtectedRoute role="admin">
              <AdminNotificationTemplatesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exports"
          element={
            <ProtectedRoute role="admin">
              <AdminExportsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rbac"
          element={
            <ProtectedRoute role="admin">
              <AdminRbacScreen />
            </ProtectedRoute>
          }
        />
        {/* === END VENDOR_ADMIN_EXT ROUTES === */}
        {/* === BEGIN MECHANIC_OPS_EXT ROUTES === */}
        {/* Owner: subagent C. Add Mechanic app / Mechanic OS / Worker / Tow-SOS routes strictly between these markers. */}
        {/* Mechanic app — Phase-1 additions (M-10..M-13) */}
        <Route
          path="/mechanic/bookings/:id"
          element={
            <MechanicGuard>
              <MechanicJobDetailScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic/dispatch"
          element={
            <MechanicGuard>
              <MechanicDispatchScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic/payouts"
          element={
            <MechanicGuard>
              <MechanicPayoutsScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic/notifications"
          element={
            <MechanicGuard>
              <MechanicNotificationsScreen />
            </MechanicGuard>
          }
        />

        {/* Worker (mechanic employee) — W-05..W-10 */}
        <Route
          path="/worker/jobs/:id"
          element={
            <WorkerGuard>
              <WorkerJobDetailScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/worker/jobs/:id/nav"
          element={
            <WorkerGuard>
              <WorkerJobNavScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/worker/jobs/:id/proof"
          element={
            <WorkerGuard>
              <WorkerJobProofScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/worker/earnings"
          element={
            <WorkerGuard>
              <WorkerEarningsScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/worker/availability"
          element={
            <WorkerGuard>
              <WorkerAvailabilityScreen />
            </WorkerGuard>
          }
        />
        <Route
          path="/worker/notifications"
          element={
            <WorkerGuard>
              <WorkerNotificationsScreen />
            </WorkerGuard>
          }
        />

        {/* Mechanic OS — desktop console (MOS-01..MOS-11).
            Uses the same mechanicAuth session as the mechanic app. */}
        <Route
          path="/mechanic-os"
          element={
            <MechanicGuard>
              <MosConsoleHomeScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/jobs"
          element={
            <MechanicGuard>
              <MosJobListScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/jobs/:id"
          element={
            <MechanicGuard>
              <MosDigitalJobCardScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/customers"
          element={
            <MechanicGuard>
              <MosCustomerCrmScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/inventory"
          element={
            <MechanicGuard>
              <MosInventoryScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/estimates"
          element={
            <MechanicGuard>
              <MosEstimatesScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/invoices"
          element={
            <MechanicGuard>
              <MosInvoicesScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/scheduler"
          element={
            <MechanicGuard>
              <MosBaySchedulerScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/rollup"
          element={
            <MechanicGuard>
              <MosMultiShopRollupScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/tech-perf"
          element={
            <MechanicGuard>
              <MosTechPerformanceScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/recalls"
          element={
            <MechanicGuard>
              <MosRecallsScreen />
            </MechanicGuard>
          }
        />
        <Route
          path="/mechanic-os/reminders"
          element={
            <MechanicGuard>
              <MosRemindersScreen />
            </MechanicGuard>
          }
        />

        {/* Tow / SOS Operator app (T-01..T-08) */}
        <Route path="/tow" element={<Navigate to="/tow/dispatch" replace />} />
        <Route path="/tow/login" element={<TowLoginScreen />} />
        <Route path="/tow/register" element={<TowRegisterScreen />} />
        <Route
          path="/tow/dispatch"
          element={
            <TowGuard>
              <TowDispatchScreen />
            </TowGuard>
          }
        />
        <Route path="/tow/jobs" element={<Navigate to="/tow/dispatch" replace />} />
        <Route
          path="/tow/jobs/:id"
          element={
            <TowGuard>
              <TowJobDetailScreen />
            </TowGuard>
          }
        />
        <Route
          path="/tow/jobs/:id/proof"
          element={
            <TowGuard>
              <TowJobProofScreen />
            </TowGuard>
          }
        />
        <Route
          path="/tow/earnings"
          element={
            <TowGuard>
              <TowEarningsScreen />
            </TowGuard>
          }
        />
        <Route
          path="/tow/availability"
          element={
            <TowGuard>
              <TowAvailabilityScreen />
            </TowGuard>
          }
        />
        <Route
          path="/tow/profile"
          element={
            <TowGuard>
              <TowProfileScreen />
            </TowGuard>
          }
        />
        <Route
          path="/tow/notifications"
          element={
            <TowGuard>
              <TowNotificationsScreen />
            </TowGuard>
          }
        />
        {/* === END MECHANIC_OPS_EXT ROUTES === */}
        {/* === BEGIN B2B_CONSOLES_EXT ROUTES === */}
        {/* Owner: subagent D-1. Add Fleet OS / Charging Operator SaaS / Developer Portal routes strictly between these markers. */}

        {/* ---- Fleet OS (F-01 .. F-13) — desktop-first console at /fleet/* ---- */}
        <Route path="/fleet" element={<D1Fleet.FleetHomeScreen />} />
        <Route
          path="/fleet/vehicles"
          element={<D1Fleet.FleetVehiclesScreen />}
        />
        <Route path="/fleet/drivers" element={<D1Fleet.FleetDriversScreen />} />
        <Route path="/fleet/energy" element={<D1Fleet.FleetEnergyScreen />} />
        <Route
          path="/fleet/maintenance"
          element={<D1Fleet.FleetMaintenanceScreen />}
        />
        <Route
          path="/fleet/batch-reserve"
          element={<D1Fleet.FleetBatchReserveScreen />}
        />
        <Route path="/fleet/reports" element={<D1Fleet.FleetReportsScreen />} />
        <Route path="/fleet/billing" element={<D1Fleet.FleetBillingScreen />} />
        <Route path="/fleet/routes" element={<D1Fleet.FleetRoutesScreen />} />
        <Route
          path="/fleet/policies"
          element={<D1Fleet.FleetPoliciesScreen />}
        />
        <Route
          path="/fleet/api-keys"
          element={<D1Fleet.FleetApiKeysScreen />}
        />
        <Route path="/fleet/sso" element={<D1Fleet.FleetSsoScreen />} />
        <Route
          path="/fleet/notifications"
          element={<D1Fleet.FleetNotificationsScreen />}
        />

        {/* ---- Charging Operator SaaS (CO-01 .. CO-12) at /operator/* ---- */}
        <Route path="/operator" element={<D1Operator.OperatorHomeScreen />} />
        <Route
          path="/operator/stations"
          element={<D1Operator.OperatorStationsScreen />}
        />
        <Route
          path="/operator/stations/:id"
          element={<D1Operator.OperatorStationDetailScreen />}
        />
        <Route
          path="/operator/remote"
          element={<D1Operator.OperatorRemoteScreen />}
        />
        <Route
          path="/operator/pricing"
          element={<D1Operator.OperatorPricingScreen />}
        />
        <Route
          path="/operator/sla"
          element={<D1Operator.OperatorSlaScreen />}
        />
        <Route
          path="/operator/utilization"
          element={<D1Operator.OperatorUtilizationScreen />}
        />
        <Route
          path="/operator/revenue"
          element={<D1Operator.OperatorRevenueScreen />}
        />
        <Route
          path="/operator/roaming"
          element={<D1Operator.OperatorRoamingScreen />}
        />
        <Route
          path="/operator/maintenance"
          element={<D1Operator.OperatorMaintenanceScreen />}
        />
        <Route
          path="/operator/firmware"
          element={<D1Operator.OperatorFirmwareScreen />}
        />
        <Route
          path="/operator/notifications"
          element={<D1Operator.OperatorNotificationsScreen />}
        />

        {/* ---- Developer Portal (DEV-01 .. DEV-09) at /developer/* ---- */}
        <Route
          path="/developer"
          element={<D1Developer.DeveloperHomeScreen />}
        />
        <Route
          path="/developer/keys"
          element={<D1Developer.DeveloperKeysScreen />}
        />
        <Route
          path="/developer/sandbox"
          element={<D1Developer.DeveloperSandboxScreen />}
        />
        <Route
          path="/developer/docs"
          element={<D1Developer.DeveloperDocsScreen />}
        />
        <Route
          path="/developer/webhooks"
          element={<D1Developer.DeveloperWebhooksScreen />}
        />
        <Route
          path="/developer/logs"
          element={<D1Developer.DeveloperLogsScreen />}
        />
        <Route
          path="/developer/usage"
          element={<D1Developer.DeveloperUsageScreen />}
        />
        <Route
          path="/developer/billing"
          element={<D1Developer.DeveloperBillingScreen />}
        />
        <Route
          path="/developer/apps"
          element={<D1Developer.DeveloperAppsScreen />}
        />
        {/* === END B2B_CONSOLES_EXT ROUTES === */}
        {/* === BEGIN DATA_GROWTH_EXT ROUTES === */}
        {/* Owner: subagent D-2. Add Mobility Intelligence / VIP / Growth routes strictly between these markers. */}
        {/* Mobility Intelligence (MI-01…MI-08) — admin/govt/insurer analytics console */}
        <Route
          path="/intel"
          element={
            <ProtectedRoute>
              <D2Intel.IntelHomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intel/heatmap"
          element={
            <ProtectedRoute>
              <D2Intel.IntelHeatmapScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intel/gaps"
          element={
            <ProtectedRoute>
              <D2Intel.IntelGapsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intel/forecasts"
          element={
            <ProtectedRoute>
              <D2Intel.IntelForecastsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intel/elasticity"
          element={
            <ProtectedRoute>
              <D2Intel.IntelElasticityScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intel/cohorts"
          element={
            <ProtectedRoute>
              <D2Intel.IntelCohortsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intel/benchmarks"
          element={
            <ProtectedRoute>
              <D2Intel.IntelBenchmarksScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intel/export"
          element={
            <ProtectedRoute>
              <D2Intel.IntelExportScreen />
            </ProtectedRoute>
          }
        />
        {/* Vehicle Identity Platform (VIP-01…VIP-08) — admin/OEM/insurer facing */}
        <Route
          path="/vip"
          element={
            <ProtectedRoute>
              <D2Vip.VipVehicleSearchScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip/vehicles/:id"
          element={
            <ProtectedRoute>
              <D2Vip.VipVehicleProfileScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip/vehicles/:id/history"
          element={
            <ProtectedRoute>
              <D2Vip.VipHistoryScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip/vehicles/:id/ownership"
          element={
            <ProtectedRoute>
              <D2Vip.VipOwnershipScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip/vehicles/:id/docs"
          element={
            <ProtectedRoute>
              <D2Vip.VipDocsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip/vehicles/:id/permissions"
          element={
            <ProtectedRoute>
              <D2Vip.VipPermissionsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip/integrations/insurance"
          element={
            <ProtectedRoute>
              <D2Vip.VipInsuranceIntegrationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip/integrations/oem"
          element={
            <ProtectedRoute>
              <D2Vip.VipOemFeedsScreen />
            </ProtectedRoute>
          }
        />
        {/* Growth surfaces */}
        <Route
          path="/growth/subscribe"
          element={
            <ProtectedRoute role="user">
              <D2Growth.SubscriptionUpsellScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/growth/nps"
          element={
            <ProtectedRoute role="user">
              <D2Growth.NpsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/growth/winback"
          element={
            <ProtectedRoute role="admin">
              <D2Growth.WinbackCampaignScreen />
            </ProtectedRoute>
          }
        />
        {/* G-09 must render for unauthenticated users — mounted OUTSIDE ProtectedRoute */}
        <Route path="/city/:citySlug" element={<D2Growth.CityLandingScreen />} />
        {/* === END DATA_GROWTH_EXT ROUTES === */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const PushNotificationHandler = () => {
  usePushNotifications();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <PushNotificationHandler />
        <AppBootstrap />
        <Suspense fallback={<Loading />}>
          <BackButtonHandler />
          <AnimatedRoutes />
        </Suspense>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
