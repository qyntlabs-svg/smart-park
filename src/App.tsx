import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";

import SplashScreen from "./pages/SplashScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import RoleSelectionScreen from "./pages/RoleSelectionScreen";
import LoginScreen from "./pages/LoginScreen";
import OtpVerificationScreen from "./pages/OtpVerificationScreen";
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
import VendorLoginScreen from "./pages/VendorLoginScreen";
import VendorRegisterScreen from "./pages/VendorRegisterScreen";
import VendorKycScreen from "./pages/VendorKycScreen";
import VendorPendingScreen from "./pages/VendorPendingScreen";
import VendorSetupScreen from "./pages/VendorSetupScreen";
import VendorDashboardScreen from "./pages/VendorDashboardScreen";
import VendorScanScreen from "./pages/VendorScanScreen";

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
        <Route path="/verify-otp" element={<OtpVerificationScreen />} />
        <Route path="/add-vehicle" element={<AddVehicleScreen />} />
        <Route path="/vehicle-added" element={<VehicleAddedScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/parking/:id/slots" element={<SlotSelectionScreen />} />
        <Route path="/booking-summary" element={<BookingSummaryScreen />} />
        <Route path="/selection-success" element={<SelectionSuccessScreen />} />
        <Route path="/upi-payment" element={<UpiPaymentScreen />} />
        <Route path="/booking-qr" element={<BookingQrScreen />} />
        <Route path="/booking-history" element={<BookingHistoryScreen />} />
        <Route path="/vehicles" element={<MyVehiclesScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        {/* Vendor routes */}
        <Route path="/vendor/login" element={<VendorLoginScreen />} />
        <Route path="/vendor/register" element={<VendorRegisterScreen />} />
        <Route path="/vendor/kyc" element={<VendorKycScreen />} />
        <Route path="/vendor/pending" element={<VendorPendingScreen />} />
        <Route path="/vendor/setup" element={<VendorSetupScreen />} />
        <Route path="/vendor/dashboard" element={<VendorDashboardScreen />} />
        <Route path="/vendor/scan" element={<VendorScanScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <AnimatedRoutes />
        </Suspense>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
