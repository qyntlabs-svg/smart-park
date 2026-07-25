import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AnimatedPage,
  AnimatedList,
  AnimatedListItem,
  hoverLift,
  hoverCapable,
} from "@/shared/motion";
import {
  ScanLine,
  Car,
  Clock,
  CheckCircle2,
  LogOut,
  Store,
  Settings2,
  Download,
  QrCode,
  TrendingUp,
  Calendar,
  MapPin,
  Menu,
  CalendarCheck,
  Loader2,
  Zap,
  Warehouse,
  ChevronRight,
  Wallet,
  Receipt,
  MessageSquareWarning,
  Star as StarIcon,
  Percent,
  Users,
  BellRing,
  Image as ImageIcon,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import PartnerSideDrawer from "@/components/partner/PartnerSideDrawer";
import {
  usePartnerDashboard,
  usePartnerActiveBookings,
  usePartnerEarnings,
  usePartnerDailyLog,
  usePartnerPaymentHistory,
} from "@/api/partner";
import { useLogout } from "@/api/auth";

const PartnerDashboardScreen = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<
    "active" | "completed" | "earnings" | "invoices"
  >("active");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: dashboard } = usePartnerDashboard();
  const { data: activeBookings, isLoading: loadingActive } =
    usePartnerActiveBookings();
  const { data: earningsToday } = usePartnerEarnings("today");
  const { data: earningsWeek } = usePartnerEarnings("week");
  const { data: earningsMonth } = usePartnerEarnings("month");
  const { data: dailyLog, isLoading: loadingHistory } = usePartnerDailyLog();
  const { data: paymentHistory, isLoading: loadingInvoices } =
    usePartnerPaymentHistory();
  const logout = useLogout();

  const occupiedSlots = dashboard?.occupied_slots ?? 0;
  const availableSlots = dashboard?.available_slots ?? 0;
  const totalSlots = dashboard?.total_slots ?? 1;
  const todayRevenue = dashboard?.today_revenue ?? 0;
  const occupancyPct = dashboard?.occupancy_pct ?? 0;

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="touch-target flex items-center justify-center"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <Store className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">
            Partner Panel
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/partner/pin-map")}
            className="touch-target flex items-center justify-center"
          >
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/partner/setup")}
            className="touch-target flex items-center justify-center"
          >
            <Settings2 className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={async () => {
              await logout.mutateAsync().catch(() => {});
              window.location.href = "/role-select";
            }}
            className="touch-target flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Scan button */}
      <div className="px-4 pt-4">
        <MobileButton
          fullWidth
          variant="success"
          onClick={() => navigate("/partner/scan")}
          className="gap-3"
        >
          <ScanLine className="w-6 h-6" />
          Scan QR Code
        </MobileButton>
      </div>

      {/* Live Occupancy — shows cars physically inside right now */}
      <div className="px-4 pt-4">
        <div className="p-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Cars Inside Right Now
              </span>
              <p className="text-caption text-muted-foreground mt-0.5">
                Updated when vehicles scan in/out
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-heading-md font-bold ${occupancyPct > 80 ? "text-destructive" : occupancyPct > 50 ? "text-warning" : "text-success"}`}
              >
                {occupiedSlots}
              </span>
              <span className="text-body-sm text-muted-foreground">
                /{totalSlots}
              </span>
            </div>
          </div>

          {/* Slot grid — each square = one slot */}
          <div className="flex flex-wrap gap-1 mb-3">
            {Array.from({ length: Math.min(totalSlots, 40) }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-sm ${
                  i < occupiedSlots ? "bg-destructive" : "bg-success/40"
                }`}
              />
            ))}
            {totalSlots > 40 && (
              <span className="text-caption text-muted-foreground self-center ml-1">
                +{totalSlots - 40} more
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-destructive" />
                <span className="text-caption text-muted-foreground">
                  {occupiedSlots} occupied
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-success/40" />
                <span className="text-caption text-muted-foreground">
                  {availableSlots} free
                </span>
              </div>
            </div>
            <span
              className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                occupancyPct > 80
                  ? "bg-destructive/10 text-destructive"
                  : occupancyPct > 50
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
              }`}
            >
              {occupancyPct}% full
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pt-3 flex gap-3">
        {[
          {
            label: "Active",
            value: dashboard?.active_bookings ?? 0,
            color: "text-success",
          },
          {
            label: "Today",
            value: dashboard?.completed_today ?? 0,
            color: "text-primary",
          },
          {
            label: "Revenue",
            value: `₹${todayRevenue}`,
            color: "text-warning",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 p-3 bg-card border border-border rounded-2xl text-center"
          >
            <p className={`text-heading-sm ${s.color}`}>{s.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly Pass Quick Link */}
      <div className="px-4 pt-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/partner/monthly-passes")}
          className="w-full flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-body-sm font-bold text-foreground">
              Monthly Pass Management
            </p>
            <p className="text-caption text-muted-foreground">
              View holders, configure passes
            </p>
          </div>
        </motion.button>
      </div>

      {/* Additional listings: EV Charging + Parking Rentals (both optional) */}
      <div className="px-4 pt-3 grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/partner/ev")}
          className="flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-2xl text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-bold text-foreground">
              EV Charging
            </p>
            <p className="text-caption text-muted-foreground">
              Stations & pricing
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground self-end -mt-4" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/partner/rentals")}
          className="flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-2xl text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-bold text-foreground">
              Parking Rentals
            </p>
            <p className="text-caption text-muted-foreground">
              Day / week / month
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground self-end -mt-4" />
        </motion.button>
      </div>

      {/* V-17..V-24 quick tiles — extended vendor ops */}
      <div className="px-4 pt-3">
        <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Manage
        </p>
        <AnimatedList className="grid grid-cols-4 gap-2">
          {[
            { label: "Payouts", icon: Wallet, route: "/partner/payouts" },
            { label: "Invoices", icon: Receipt, route: "/partner/invoices" },
            { label: "Disputes", icon: MessageSquareWarning, route: "/partner/disputes" },
            { label: "Reviews", icon: StarIcon, route: "/partner/reviews" },
            { label: "Pricing", icon: Percent, route: "/partner/pricing-rules" },
            { label: "Staff", icon: Users, route: "/partner/staff" },
            { label: "Alerts", icon: BellRing, route: "/partner/notifications" },
            { label: "Media", icon: ImageIcon, route: "/partner/facility-media" },
          ].map((t) => (
            <AnimatedListItem key={t.label}>
              <motion.button
                whileTap={{ scale: 0.94 }}
                whileHover={hoverCapable ? hoverLift : undefined}
                onClick={() => navigate(t.route)}
                className="w-full flex flex-col items-center gap-1.5 p-3 bg-card border border-border rounded-2xl"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <t.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[11px] font-semibold text-foreground text-center">
                  {t.label}
                </span>
              </motion.button>
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-3 flex bg-secondary rounded-xl p-1">
        {(["active", "completed", "earnings", "invoices"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground"
            }`}
          >
            {t === "active"
              ? "Active"
              : t === "completed"
                ? "History"
                : t === "earnings"
                  ? "Earnings"
                  : "Invoices"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
        {tab === "active" &&
          (loadingActive ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : !(activeBookings ?? []).length ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Car className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-body-sm text-muted-foreground">
                No active bookings right now
              </p>
            </div>
          ) : (
            (activeBookings ?? []).map((s: any, i: number) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-card border border-border rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === "active" ? "bg-success/10" : "bg-warning/10"}`}
                  >
                    <Car
                      className={`w-5 h-5 ${s.status === "active" ? "text-success" : "text-warning"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-bold text-foreground">
                      {s.vehicle_registration ?? "Vehicle"}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Slot {s.slot_number ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-caption font-semibold px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                    >
                      {s.status === "active" ? "Inside" : "Booked"}
                    </span>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      {s.status === "active" && s.entry_time
                        ? `since ${new Date(s.entry_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : s.start_time
                          ? `${new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "—"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ))}

        {tab === "completed" && (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-caption font-semibold text-muted-foreground">
                Today's Sessions
              </span>
              <button
                className="flex items-center gap-1 text-caption text-primary font-semibold"
                onClick={() => navigate("/partner/daily-log")}
              >
                <Download className="w-3.5 h-3.5" /> Full Log
              </button>
            </div>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : !(dailyLog as any)?.entries?.length ? (
              <p className="text-body-sm text-muted-foreground text-center py-8">
                No sessions today
              </p>
            ) : (
              (dailyLog as any).entries.map((b: any, i: number) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 bg-card border border-border rounded-2xl"
                >
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
                    <div className="flex-1">
                      <p className="text-body-sm font-bold text-foreground">
                        {b.vehicle_registration ?? "Vehicle"}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        Slot {b.slot_number ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-sm font-bold text-foreground">
                        ₹{b.total_amount ?? 0}
                      </p>
                      <p className="text-caption text-muted-foreground capitalize">
                        {b.payment_status}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}

        {tab === "earnings" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-5 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-body font-bold text-foreground">
                  Earnings Summary
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Today", data: earningsToday },
                  { label: "This Week", data: earningsWeek },
                  { label: "This Month", data: earningsMonth },
                ].map(({ label, data }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-body-sm font-semibold text-foreground">
                        {label}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {data?.total_sessions ?? 0} sessions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body font-bold text-success">
                        ₹{(data?.total_revenue ?? 0).toLocaleString()}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        your share: ₹
                        {(data?.partner_share ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/partner/qr-codes")}
                className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl"
              >
                <QrCode className="w-6 h-6 text-primary" />
                <span className="text-caption font-semibold text-foreground">
                  QR Codes
                </span>
              </button>
              <button
                onClick={() => navigate("/partner/daily-log")}
                className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl"
              >
                <Download className="w-6 h-6 text-primary" />
                <span className="text-caption font-semibold text-foreground">
                  Daily Log
                </span>
              </button>
              <button
                onClick={() => navigate("/partner/reports")}
                className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl"
              >
                <Calendar className="w-6 h-6 text-primary" />
                <span className="text-caption font-semibold text-foreground">
                  Reports
                </span>
              </button>
            </div>
          </motion.div>
        )}
        {tab === "invoices" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-muted-foreground">
                Payment History
              </span>
              <span className="text-caption text-muted-foreground">
                {(paymentHistory ?? []).length} records
              </span>
            </div>
            {loadingInvoices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : !(paymentHistory ?? []).length ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-body-sm text-muted-foreground">
                  No payments yet
                </p>
                <p className="text-caption text-muted-foreground">
                  Payments will appear here once bookings are paid
                </p>
              </div>
            ) : (
              (paymentHistory ?? []).map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 bg-card border border-border rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === "success" ? "bg-success/10" : p.status === "refunded" ? "bg-warning/10" : "bg-secondary"}`}
                    >
                      <TrendingUp
                        className={`w-5 h-5 ${p.status === "success" ? "text-success" : p.status === "refunded" ? "text-warning" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-foreground">
                        ₹{Number(p.amount ?? 0).toLocaleString()}
                      </p>
                      <p className="text-caption text-muted-foreground capitalize">
                        {p.payment_method ?? "online"} · {p.status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-caption text-muted-foreground">
                        {p.paid_at
                          ? new Date(p.paid_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "—"}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.status === "success" ? "bg-success/10 text-success" : p.status === "refunded" ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground"}`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
      <PartnerSideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </AnimatedPage>
  );
};

export default PartnerDashboardScreen;
