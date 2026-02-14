import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const SplashScreen = lazy(() => import("./pages/SplashScreen"));
const OnboardingScreen = lazy(() => import("./pages/OnboardingScreen"));
const LoginScreen = lazy(() => import("./pages/LoginScreen"));
const OtpVerificationScreen = lazy(() => import("./pages/OtpVerificationScreen"));
const AddVehicleScreen = lazy(() => import("./pages/AddVehicleScreen"));
const VehicleAddedScreen = lazy(() => import("./pages/VehicleAddedScreen"));
const HomeScreen = lazy(() => import("./pages/HomeScreen"));
const SlotSelectionScreen = lazy(() => import("./pages/SlotSelectionScreen"));
const BookingSummaryScreen = lazy(() => import("./pages/BookingSummaryScreen"));
const SelectionSuccessScreen = lazy(() => import("./pages/SelectionSuccessScreen"));
const MyVehiclesScreen = lazy(() => import("./pages/MyVehiclesScreen"));
const ProfileScreen = lazy(() => import("./pages/ProfileScreen"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/verify-otp" element={<OtpVerificationScreen />} />
            <Route path="/add-vehicle" element={<AddVehicleScreen />} />
            <Route path="/vehicle-added" element={<VehicleAddedScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/parking/:id/slots" element={<SlotSelectionScreen />} />
            <Route path="/booking-summary" element={<BookingSummaryScreen />} />
            <Route path="/selection-success" element={<SelectionSuccessScreen />} />
            <Route path="/vehicles" element={<MyVehiclesScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
