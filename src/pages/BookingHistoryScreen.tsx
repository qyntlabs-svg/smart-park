import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Car,
  QrCode,
  Loader2,
  XCircle,
  Zap,
  ParkingCircle,
} from "lucide-react";
import { useBookings } from "@/api/bookings";
import { useAuthStore } from "@/store/auth.store";
import { useUserEvSessions } from "@/modules/ev/hooks";
import { CONNECTOR_LABEL, type EvSession } from "@/modules/ev/types";
import { AnimatedPage } from "@/shared/motion";

type Tab = "parking" | "charging";

const BookingHistoryScreen = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("parking");
  const { data: bookings, isLoading } = useBookings();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";
  const { data: evSessions = [], isLoading: evLoading } =
    useUserEvSessions(userId);

  const parkingCount = bookings?.length ?? 0;
  const chargingCount = evSessions.length;

  const handleViewQR = (b: any) => {
    if (b.status === "pending_payment") return;
    navigate("/booking-qr", {
      state: {
        bookingId: b.booking_reference,
        qrToken: b.qr_token,
        slot: b.slot_number,
        parking: b.facility_name,
        vehicle: b.vehicle_registration,
        duration: "-",
        price: b.total_amount,
        paidAt: b.created_at,
        paymentMethod: b.payment_status === "paid" ? "upi" : "cash",
      },
    });
  };

  const sortedEvSessions = useMemo(
    () =>
      [...evSessions].sort((a, b) =>
        (a.scheduledFor < b.scheduledFor ? 1 : -1),
      ),
    [evSessions],
  );

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          My Bookings
        </h1>
      </header>

      {/* Segmented tabs */}
      <div className="px-4 pt-3">
        <div className="inline-flex bg-secondary rounded-xl p-1 w-full">
          <TabButton
            active={tab === "parking"}
            onClick={() => setTab("parking")}
            icon={ParkingCircle}
            label="Parking"
            count={parkingCount}
          />
          <TabButton
            active={tab === "charging"}
            onClick={() => setTab("charging")}
            icon={Zap}
            label="Charging"
            count={chargingCount}
          />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {tab === "parking" ? (
          isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !bookings?.length ? (
            <EmptyState label="No parking bookings yet" icon={ParkingCircle} />
          ) : (
            bookings.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-4 bg-card border border-border rounded-2xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.status === "active" ? "bg-success/10" : "bg-secondary"}`}
                    >
                      {b.status === "active" ? (
                        <Clock className="w-5 h-5 text-success" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-body-sm font-bold text-foreground">
                        {b.facility_name ?? "Parking"}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {b.slot_number ? `Slot ${b.slot_number} · ` : ""}
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-caption font-semibold px-2 py-0.5 rounded-full ${b.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
                  >
                    {b.status === "active"
                      ? "Active"
                      : b.status === "confirmed"
                        ? "Confirmed"
                        : b.status === "pending_payment"
                          ? "Awaiting Payment"
                          : b.status === "completed"
                            ? "Completed"
                            : b.status === "cancelled"
                              ? "Cancelled"
                              : b.status === "failed"
                                ? "Failed"
                                : b.status === "expired"
                                  ? "Expired"
                                  : b.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="text-caption text-muted-foreground">
                      {b.vehicle_registration ?? "Vehicle"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {b.status !== "cancelled" &&
                      b.status !== "pending_payment" && (
                        <button
                          onClick={() => handleViewQR(b)}
                          className="flex items-center gap-1 text-caption font-semibold text-primary"
                        >
                          <QrCode className="w-4 h-4" /> View QR
                        </button>
                      )}
                    <span className="text-body-sm font-bold text-foreground">
                      ₹{b.total_amount}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )
        ) : evLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : sortedEvSessions.length === 0 ? (
          <EmptyState label="No charging sessions yet" icon={Zap} />
        ) : (
          sortedEvSessions.map((s, i) => (
            <ChargingRow key={s.id} session={s} delay={i * 0.06} />
          ))
        )}
      </div>
    </AnimatedPage>
  );
};

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-body-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-primary-foreground shadow-md"
        : "text-muted-foreground"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
    <span
      className={`text-caption font-bold ${active ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}
    >
      · {count}
    </span>
  </button>
);

const EmptyState = ({
  label,
  icon: Icon,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <Icon className="w-12 h-12 text-muted-foreground/30" />
    <p className="text-body-sm text-muted-foreground">{label}</p>
  </div>
);

const ChargingRow = ({
  session,
  delay,
}: {
  session: EvSession;
  delay: number;
}) => {
  const navigate = useNavigate();
  const statusMap: Record<
    EvSession["status"],
    { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    scheduled: {
      label: "Scheduled",
      cls: "bg-secondary text-muted-foreground",
      icon: Clock,
    },
    active: {
      label: "Live",
      cls: "bg-emerald-500/10 text-emerald-600",
      icon: Zap,
    },
    completed: {
      label: "Completed",
      cls: "bg-primary/10 text-primary",
      icon: CheckCircle2,
    },
    cancelled: {
      label: "Cancelled",
      cls: "bg-destructive/10 text-destructive",
      icon: XCircle,
    },
  };
  const meta = statusMap[session.status];
  const StatusIcon = meta.icon;

  const handleClick = () => {
    if (session.status === "active" || session.status === "scheduled") {
      navigate(`/ev/session/${session.id}`);
    } else {
      navigate(`/ev/session/${session.id}/receipt`);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="w-full text-left p-4 bg-card border border-border rounded-2xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <StatusIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-bold text-foreground">
              {CONNECTOR_LABEL[session.connectorType]} · {session.ratedKw} kW
            </p>
            <p className="text-caption text-muted-foreground">
              {new Date(session.scheduledFor).toLocaleString([], {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <span
          className={`text-caption font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}
        >
          {meta.label}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-caption text-muted-foreground">
          <span>{session.kwhDelivered.toFixed(1)} kWh</span>
          {session.status === "active" && (
            <span>· {session.currentKw.toFixed(1)} kW now</span>
          )}
        </div>
        <span className="text-body-sm font-bold text-foreground">
          ₹{session.cost}
        </span>
      </div>
    </motion.button>
  );
};

export default BookingHistoryScreen;
