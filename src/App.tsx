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

import AdminDashboardScreen from "./pages/AdminDashboardScreen";
import RolePickerScreen from "./pages/RolePickerScreen";

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
        {/* Mechanic routes (self-contained local auth) */}
        <Route path="/mechanic/login" element={<MechanicLoginScreen />} />
        <Route path="/mechanic/register" element={<MechanicRegisterScreen />} />
        <Route path="/mechanic/kyc" element={<MechanicKycScreen />} />
        <Route path="/mechanic/pending" element={<MechanicPendingScreen />} />
        <Route path="/mechanic/setup" element={<MechanicSetupScreen />} />
        <Route path="/mechanic/dashboard" element={<MechanicDashboardScreen />} />
        <Route path="/mechanic/bookings" element={<MechanicBookingsScreen />} />
        <Route
          path="/mechanics/:id"
          element={
            <ProtectedRoute role="user">
              <MechanicShopDetailScreen />
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
        <Route path="/role-picker" element={<RolePickerScreen />} />
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
        <Suspense fallback={<Loading />}>
          <BackButtonHandler />
          <AnimatedRoutes />
        </Suspense>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
