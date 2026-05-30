import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Car,
  Calendar,
  Shield,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useVehicles } from "@/api/vehicles";

const DURATIONS = [
  { months: 1 as const, label: "1 Month", discount: 0 },
  { months: 3 as const, label: "3 Months", discount: 10 },
  { months: 6 as const, label: "6 Months", discount: 15 },
];

const useAvailablePasses = (lat?: number, lng?: number) =>
  useQuery({
    queryKey: ["passes-available", lat, lng],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/passes/monthly/available", {
          params: lat ? { lat, lng } : {},
        })
        .then((r) => r.data.data),
  });

const MonthlyPassScreen = () => {
  const navigate = useNavigate();
  const routeState = useLocation().state as any;

  // Renewal mode — facility is locked, start extends from existing pass end_date
  const isRenewal = !!routeState?.renewFacilityId;
  const renewFacilityId = routeState?.renewFacilityId ?? null;
  const renewFacilityName = routeState?.renewFacilityName ?? null;
  const renewFromDate = routeState?.renewFromDate ?? null;

  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    renewFacilityId,
  );
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6>(1);
  const [step, setStep] = useState<"select" | "review">("select");

  const { data: vehicles } = useVehicles();
  const defaultVehicle = vehicles?.find((v) => v.is_default) ?? vehicles?.[0];
  const { data: locations, isLoading } = useAvailablePasses();

  const location =
    (locations ?? []).find((l: any) => l.id === selectedLocation) ??
    (isRenewal
      ? {
          id: renewFacilityId,
          name: renewFacilityName,
          monthly_pass_price: 1500,
        }
      : null);
  const duration = DURATIONS.find((d) => d.months === selectedDuration)!;
  const basePrice = (location?.monthly_pass_price ?? 0) * selectedDuration;
  const discount = Math.round((basePrice * duration.discount) / 100);
  const finalPrice = basePrice - discount;

  // For renewals, start date is day after existing pass ends
  const startDate =
    isRenewal && renewFromDate
      ? new Date(new Date(renewFromDate).getTime() + 86_400_000)
      : new Date();
  const endDate = new Date(
    startDate.getTime() + selectedDuration * 30 * 24 * 60 * 60 * 1000,
  );

  const handlePurchase = () => {
    if (!defaultVehicle?.id) {
      alert("Please add a vehicle first");
      return;
    }
    navigate("/upi-payment", {
      state: {
        price: finalPrice,
        slot: "Monthly Pass",
        parking: location?.name,
        duration: duration.label,
        isPass: true,
        passData: {
          facility_id: selectedLocation,
          vehicle_id: defaultVehicle?.id,
          duration_months: selectedDuration,
        },
      },
    });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => (step === "review" ? setStep("select") : navigate(-1))}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Monthly Parking Pass
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {step === "select" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Info banner */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-body-sm font-bold text-foreground">
                  Unlimited Parking Access
                </p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  Get a dedicated parking slot with 24/7 entry & exit using your
                  personal QR code.
                </p>
              </div>
            </div>

            {/* Vehicle */}
            <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Vehicle</p>
                <p className="text-body-sm font-bold text-foreground">
                  {defaultVehicle?.registration_number ?? "No vehicle"}
                </p>
              </div>
            </div>

            {/* Duration selector */}
            <div>
              <p className="text-body-sm font-bold text-foreground mb-2">
                Select Duration
              </p>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.months}
                    onClick={() => setSelectedDuration(d.months)}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                      selectedDuration === d.months
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <p
                      className={`text-body-sm font-bold ${selectedDuration === d.months ? "text-primary" : "text-foreground"}`}
                    >
                      {d.label}
                    </p>
                    {d.discount > 0 && (
                      <p className="text-caption text-success font-semibold mt-0.5">
                        Save {d.discount}%
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <p className="text-body-sm font-bold text-foreground mb-2">
                {isRenewal ? "Renewing Pass For" : "Select Parking Location"}
              </p>
              {isRenewal ? (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-body-sm font-bold text-foreground">
                      {renewFacilityName}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Renewal starts{" "}
                      {startDate.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(locations ?? []).map((loc: any) => (
                    <motion.button
                      key={loc.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedLocation(loc.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedLocation === loc.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <MapPin
                            className={`w-5 h-5 ${selectedLocation === loc.id ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-bold text-foreground">
                            {loc.name}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            {loc.address}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-body-sm font-bold text-primary">
                              ₹{loc.monthly_pass_price}/mo
                            </span>
                            <span
                              className={`text-caption font-semibold ${loc.available_slots > 3 ? "text-success" : "text-warning"}`}
                            >
                              {loc.available_slots} slots left
                            </span>
                          </div>
                        </div>
                        {selectedLocation === loc.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === "review" && location && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
              <p className="text-body font-bold text-foreground">
                Pass Summary
              </p>
              {[
                ["Location", location.name],
                ["Vehicle", defaultVehicle?.registration_number ?? "—"],
                ["Duration", duration.label],
                ["Start Date", startDate.toLocaleDateString("en-IN")],
                ["End Date", endDate.toLocaleDateString("en-IN")],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-body-sm text-muted-foreground">
                    {label}
                  </span>
                  <span className="text-body-sm font-semibold text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
              <p className="text-body font-bold text-foreground">
                Price Breakdown
              </p>
              <div className="flex justify-between">
                <span className="text-body-sm text-muted-foreground">
                  ₹{location.monthly_pass_price} × {selectedDuration} month
                  {selectedDuration > 1 ? "s" : ""}
                </span>
                <span className="text-body-sm text-foreground">
                  ₹{basePrice}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-body-sm text-success">
                    Discount ({duration.discount}%)
                  </span>
                  <span className="text-body-sm text-success font-semibold">
                    -₹{discount}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-body font-bold text-foreground">
                  Total
                </span>
                <span className="text-heading-sm text-primary font-bold">
                  ₹{finalPrice}
                </span>
              </div>
            </div>

            <div className="p-4 bg-success/5 border border-success/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-body-sm font-bold text-foreground">
                    What you get
                  </p>
                  <ul className="mt-1 space-y-1 text-caption text-muted-foreground">
                    <li>• Dedicated parking slot</li>
                    <li>• 24/7 entry & exit access</li>
                    <li>• Unique QR code for scanning</li>
                    <li>• Auto-renewal reminder before expiry</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom action */}
      <div className="p-4 pb-safe bg-card border-t border-border">
        {step === "select" ? (
          <MobileButton
            fullWidth
            disabled={!selectedLocation}
            onClick={() => setStep("review")}
          >
            Continue – ₹
            {finalPrice > 0 ? finalPrice.toLocaleString() : "Select a location"}
          </MobileButton>
        ) : (
          <MobileButton fullWidth onClick={handlePurchase}>
            Pay ₹{finalPrice.toLocaleString()} via UPI
          </MobileButton>
        )}
      </div>
    </div>
  );
};

export default MonthlyPassScreen;
