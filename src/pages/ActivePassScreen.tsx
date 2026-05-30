import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Car,
  Calendar,
  Clock,
  Shield,
  QrCode,
  Loader2,
  Plus,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileButton } from "@/components/ui/mobile-button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

const useActivePasses = () =>
  useQuery({
    queryKey: ["active-pass"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/passes/monthly/active")
        .then((r) => {
          const d = r.data.data;
          // Handle both array and single object responses
          return Array.isArray(d) ? d : d ? [d] : [];
        }),
  });

const PassCard = ({ pass, onRenew }: { pass: any; onRenew: () => void }) => {
  const start = new Date(pass.start_date);
  const end = new Date(pass.end_date);
  const now = new Date();
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  const daysLeft = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / 86_400_000),
  );
  const progressPct = Math.round(((totalDays - daysLeft) / totalDays) * 100);

  const qrValue = JSON.stringify({
    type: "monthly-pass",
    passId: pass.pass_reference,
    vehicle: pass.vehicle_registration,
    validUntil: pass.end_date,
  });

  return (
    <div className="space-y-3">
      {/* QR */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-5 bg-card border border-border rounded-2xl flex flex-col items-center"
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-success" />
          <span className="text-body-sm font-bold text-success">
            Active Pass
          </span>
        </div>
        <div className="p-3 bg-background rounded-2xl">
          <QRCodeSVG value={qrValue} size={160} level="H" includeMargin />
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          Show at entry/exit gate
        </p>
        <p className="text-body-sm font-bold text-foreground mt-1">
          {pass.pass_reference}
        </p>
      </motion.div>

      {/* Details */}
      <div className="p-4 bg-card border border-border rounded-2xl space-y-2.5">
        {[
          { icon: MapPin, label: "Location", value: pass.facility_name ?? "—" },
          {
            icon: Car,
            label: "Vehicle",
            value: pass.vehicle_registration ?? "—",
          },
          ...(pass.slot_number
            ? [
                {
                  icon: QrCode,
                  label: "Assigned Slot",
                  value: pass.slot_number,
                },
              ]
            : []),
          {
            icon: Calendar,
            label: "Valid From",
            value: start.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          },
          {
            icon: Calendar,
            label: "Valid Until",
            value: end.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 py-1 border-b border-border last:border-0"
          >
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-body-sm text-muted-foreground flex-1">
              {label}
            </span>
            <span className="text-body-sm font-semibold text-foreground">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="p-4 bg-card border border-border rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-body-sm font-semibold text-foreground">
              Validity
            </span>
          </div>
          <span
            className={`text-body-sm font-bold ${daysLeft <= 7 ? "text-warning" : "text-success"}`}
          >
            {daysLeft} days left
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${daysLeft <= 7 ? "bg-warning" : "bg-success"}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
        <span className="text-body-sm text-muted-foreground">Amount Paid</span>
        <span className="text-body font-bold text-primary">
          ₹{Number(pass.amount_paid ?? 0).toLocaleString()}
        </span>
      </div>

      {/* Renew — same facility, extends from end_date */}
      <MobileButton fullWidth variant="outline" onClick={onRenew}>
        Renew This Pass
      </MobileButton>
    </div>
  );
};

const ActivePassScreen = () => {
  const navigate = useNavigate();
  const { data: passes = [], isLoading } = useActivePasses();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          My Parking Passes
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">
        {passes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-body font-semibold text-foreground">
              No Active Passes
            </p>
            <p className="text-body-sm text-muted-foreground">
              Get a monthly pass for unlimited parking access.
            </p>
            <MobileButton onClick={() => navigate("/monthly-pass")}>
              Get a Monthly Pass
            </MobileButton>
          </div>
        ) : (
          <>
            {passes.map((pass: any) => (
              <PassCard
                key={pass.id}
                pass={pass}
                onRenew={() =>
                  navigate("/monthly-pass", {
                    state: {
                      renewFacilityId: pass.facility_id,
                      renewFacilityName: pass.facility_name,
                      renewFromDate: pass.end_date,
                    },
                  })
                }
              />
            ))}

            {/* Add pass for a different parking */}
            <button
              onClick={() => navigate("/monthly-pass")}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-2xl text-body-sm font-semibold text-muted-foreground"
            >
              <Plus className="w-4 h-4" /> Add Pass for Another Parking
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivePassScreen;
