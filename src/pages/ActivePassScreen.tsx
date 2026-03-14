import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Car, Calendar, Clock, Shield, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileButton } from "@/components/ui/mobile-button";

const MOCK_PASS = {
  id: "MP-2026-001",
  locationName: "Phoenix Mall Parking",
  address: "Tambaram, Chennai",
  vehicle: "TN 01 AB 1234",
  startDate: "2026-03-01",
  endDate: "2026-03-31",
  amount: 2500,
  status: "active" as const,
  slot: "M-05",
};

const ActivePassScreen = () => {
  const navigate = useNavigate();

  const start = new Date(MOCK_PASS.startDate);
  const end = new Date(MOCK_PASS.endDate);
  const now = new Date();
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPct = Math.round(((totalDays - daysLeft) / totalDays) * 100);

  const qrValue = JSON.stringify({
    type: "monthly-pass",
    passId: MOCK_PASS.id,
    vehicle: MOCK_PASS.vehicle,
    validUntil: MOCK_PASS.endDate,
    slot: MOCK_PASS.slot,
  });

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">My Parking Pass</h1>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {/* Status badge */}
        <div className="flex items-center justify-center">
          <span className="px-4 py-1.5 rounded-full bg-success/10 text-success text-body-sm font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Active Pass
          </span>
        </div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-card border border-border rounded-2xl flex flex-col items-center"
        >
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Entry/Exit QR</p>
          <div className="p-4 bg-background rounded-2xl">
            <QRCodeSVG value={qrValue} size={180} level="H" includeMargin />
          </div>
          <p className="mt-3 text-caption text-muted-foreground">Show this QR at entry/exit gate</p>
          <p className="text-body-sm font-bold text-foreground mt-1">{MOCK_PASS.id}</p>
        </motion.div>

        {/* Pass details */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
          <p className="text-body font-bold text-foreground">Pass Details</p>
          {[
            { icon: MapPin, label: "Location", value: MOCK_PASS.locationName },
            { icon: Car, label: "Vehicle", value: MOCK_PASS.vehicle },
            { icon: QrCode, label: "Slot", value: MOCK_PASS.slot },
            { icon: Calendar, label: "Valid From", value: start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
            { icon: Calendar, label: "Valid Until", value: end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-body-sm text-muted-foreground flex-1">{label}</span>
              <span className="text-body-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        {/* Validity progress */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-body-sm font-semibold text-foreground">Validity</span>
            </div>
            <span className={`text-body-sm font-bold ${daysLeft <= 5 ? "text-warning" : "text-success"}`}>
              {daysLeft} days left
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${daysLeft <= 5 ? "bg-warning" : "bg-success"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
          <span className="text-body-sm text-muted-foreground">Amount Paid</span>
          <span className="text-heading-sm font-bold text-primary">₹{MOCK_PASS.amount.toLocaleString()}</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="p-4 pb-safe bg-card border-t border-border flex gap-3">
        <MobileButton fullWidth variant="outline" onClick={() => navigate("/monthly-pass")}>
          Renew Pass
        </MobileButton>
        <MobileButton fullWidth onClick={() => navigate("/home")}>
          Go Home
        </MobileButton>
      </div>
    </div>
  );
};

export default ActivePassScreen;
