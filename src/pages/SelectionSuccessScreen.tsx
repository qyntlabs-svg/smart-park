import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, MapPin, Car, Clock, IndianRupee } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const SelectionSuccessScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  const slotNumber = state?.slotNumber || "A3";
  const duration = state?.duration || 2;
  const totalPrice = state?.totalPrice || 80;

  // Auto-navigate after 5s
  useEffect(() => {
    const t = setTimeout(() => navigate("/home", { replace: true }), 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  const details = [
    { icon: MapPin, label: "Parking", value: `Phoenix Mall • Slot ${slotNumber}` },
    { icon: Car, label: "Vehicle", value: "TN 01 AB 1234" },
    { icon: Clock, label: "Duration", value: `${duration} ${duration === 1 ? "Hour" : "Hours"}` },
    { icon: IndianRupee, label: "Estimated Price", value: `₹${totalPrice}` },
  ];

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-[120px] h-[120px] rounded-full bg-success/10 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-[80px] h-[80px] rounded-full bg-success flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-success-foreground" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-heading-lg text-success text-center"
      >
        Slot Selected!
      </motion.h1>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-8 w-full bg-card border border-border rounded-2xl p-5 space-y-4"
      >
        {details.map(({ icon: Icon, label, value }, i) => (
          <div key={i} className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-caption text-muted-foreground">{label}</p>
              <p className="text-body-sm font-semibold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Phase 2 teaser */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-4 w-full p-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl"
      >
        <p className="text-body-sm font-semibold text-primary">Phase 2 will add:</p>
        <ul className="mt-2 space-y-1 text-caption text-muted-foreground">
          <li>• Online payment integration</li>
          <li>• Booking confirmation & receipt</li>
          <li>• QR code for entry/exit</li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="mt-8 w-full pb-safe"
      >
        <MobileButton fullWidth onClick={() => navigate("/home", { replace: true })}>
          Back to Home
        </MobileButton>
      </motion.div>
    </div>
  );
};

export default SelectionSuccessScreen;
