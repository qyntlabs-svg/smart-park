import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Car, Calendar, Shield, CheckCircle2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const LOCATIONS = [
  { id: "1", name: "Phoenix Mall Parking", address: "Tambaram, Chennai", monthlyPrice: 2500, slotsAvailable: 5, totalMonthly: 15 },
  { id: "2", name: "Tambaram Station Parking", address: "Tambaram East, Chennai", monthlyPrice: 1800, slotsAvailable: 8, totalMonthly: 20 },
  { id: "3", name: "Grand Square Mall", address: "Velachery, Chennai", monthlyPrice: 3000, slotsAvailable: 2, totalMonthly: 10 },
  { id: "5", name: "Chromepet Market Parking", address: "Chromepet, Chennai", monthlyPrice: 1500, slotsAvailable: 10, totalMonthly: 12 },
];

const DURATIONS = [
  { months: 1, label: "1 Month", discount: 0 },
  { months: 3, label: "3 Months", discount: 10 },
  { months: 6, label: "6 Months", discount: 15 },
];

const MonthlyPassScreen = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [step, setStep] = useState<"select" | "review">("select");

  const location = LOCATIONS.find((l) => l.id === selectedLocation);
  const duration = DURATIONS.find((d) => d.months === selectedDuration)!;
  const basePrice = (location?.monthlyPrice || 0) * selectedDuration;
  const discount = Math.round((basePrice * duration.discount) / 100);
  const finalPrice = basePrice - discount;

  const handlePurchase = () => {
    navigate("/upi-payment", {
      state: {
        amount: finalPrice,
        description: `Monthly Pass – ${location?.name} (${duration.label})`,
        returnTo: "/monthly-pass/active",
        passData: {
          locationId: selectedLocation,
          locationName: location?.name,
          duration: selectedDuration,
          vehicle: "TN 01 AB 1234",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + selectedDuration * 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: finalPrice,
        },
      },
    });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => (step === "review" ? setStep("select") : navigate(-1))} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Monthly Parking Pass</h1>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {step === "select" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Info banner */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-body-sm font-bold text-foreground">Unlimited Parking Access</p>
                <p className="text-caption text-muted-foreground mt-0.5">Get a dedicated parking slot with 24/7 entry & exit using your personal QR code.</p>
              </div>
            </div>

            {/* Vehicle */}
            <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Vehicle</p>
                <p className="text-body-sm font-bold text-foreground">TN 01 AB 1234</p>
              </div>
            </div>

            {/* Duration selector */}
            <div>
              <p className="text-body-sm font-bold text-foreground mb-2">Select Duration</p>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.months}
                    onClick={() => setSelectedDuration(d.months)}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                      selectedDuration === d.months ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <p className={`text-body-sm font-bold ${selectedDuration === d.months ? "text-primary" : "text-foreground"}`}>{d.label}</p>
                    {d.discount > 0 && <p className="text-caption text-success font-semibold mt-0.5">Save {d.discount}%</p>}
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <p className="text-body-sm font-bold text-foreground mb-2">Select Parking Location</p>
              <div className="space-y-2">
                {LOCATIONS.map((loc) => (
                  <motion.button
                    key={loc.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      selectedLocation === loc.id ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <MapPin className={`w-5 h-5 ${selectedLocation === loc.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-bold text-foreground">{loc.name}</p>
                        <p className="text-caption text-muted-foreground">{loc.address}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-body-sm font-bold text-primary">₹{loc.monthlyPrice}/mo</span>
                          <span className={`text-caption font-semibold ${loc.slotsAvailable > 3 ? "text-success" : "text-warning"}`}>
                            {loc.slotsAvailable} passes left
                          </span>
                        </div>
                      </div>
                      {selectedLocation === loc.id && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === "review" && location && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
              <p className="text-body font-bold text-foreground">Pass Summary</p>
              {[
                ["Location", location.name],
                ["Vehicle", "TN 01 AB 1234"],
                ["Duration", duration.label],
                ["Start Date", new Date().toLocaleDateString("en-IN")],
                ["End Date", new Date(Date.now() + selectedDuration * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-body-sm text-muted-foreground">{label}</span>
                  <span className="text-body-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
              <p className="text-body font-bold text-foreground">Price Breakdown</p>
              <div className="flex justify-between">
                <span className="text-body-sm text-muted-foreground">₹{location.monthlyPrice} × {selectedDuration} month{selectedDuration > 1 ? "s" : ""}</span>
                <span className="text-body-sm text-foreground">₹{basePrice}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-body-sm text-success">Discount ({duration.discount}%)</span>
                  <span className="text-body-sm text-success font-semibold">-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-body font-bold text-foreground">Total</span>
                <span className="text-heading-sm text-primary font-bold">₹{finalPrice}</span>
              </div>
            </div>

            <div className="p-4 bg-success/5 border border-success/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-body-sm font-bold text-foreground">What you get</p>
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
          <MobileButton fullWidth disabled={!selectedLocation} onClick={() => setStep("review")}>
            Continue – ₹{finalPrice > 0 ? finalPrice.toLocaleString() : "Select a location"}
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
