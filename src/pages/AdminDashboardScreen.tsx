import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AnimatedPage,
  AnimatedList,
  AnimatedListItem,
  hoverLift,
  hoverCapable,
} from "@/shared/motion";
import {
  Users,
  Store,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Loader2,
  ShieldCheck,
  BarChart3,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  AlertOctagon,
  ShieldAlert,
  KeyRound,
  Activity,
  Banknote,
  Flag,
  Building2,
  Percent,
  MessageSquare,
  Download,
  ChevronRight,
  Bell,
  BellOff,
  type LucideIcon,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useLogout } from "@/api/auth";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/shared/lib/notifications";

// ── API hooks ────────────────────────────────────────────────────────────────

const useAdminAnalytics = () =>
  useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any }>("/admin/analytics")
        .then((r) => r.data.data),
  });

const useAdminPartners = (kycStatus?: string) =>
  useQuery({
    queryKey: ["admin-partners", kycStatus],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/admin/partners", {
          params: kycStatus ? { kyc_status: kycStatus } : {},
        })
        .then((r) => r.data.data),
  });

const useApprovePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/admin/partners/${id}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-partners"] }),
  });
};

const useRejectPartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/partners/${id}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-partners"] }),
  });
};

// ── Component ────────────────────────────────────────────────────────────────

const AdminDashboardScreen = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "partners" | "notifications">(
    "overview",
  );
  const [partnerFilter, setPartnerFilter] = useState("pending");
  const [rejectModal, setRejectModal] = useState<{
    id: string;
    reason: string;
  } | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<string | null>(null);
  const [notifTick, setNotifTick] = useState(0);
  const adminNotifications = useMemo(
    () => getNotifications("admin", "admin"),
    // Recompute when the tab changes or after a manual mark-all-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, notifTick],
  );
  const unreadAdminNotifs = adminNotifications.filter((n) => !n.read).length;

  const { data: analytics, isLoading: loadingAnalytics } = useAdminAnalytics();
  const { data: partners, isLoading: loadingPartners } =
    useAdminPartners(partnerFilter);
  const approvePartner = useApprovePartner();
  const rejectPartner = useRejectPartner();
  const logout = useLogout();

  const handleApprove = async (id: string) => {
    await approvePartner.mutateAsync(id);
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    await rejectPartner.mutateAsync({
      id: rejectModal.id,
      reason: rejectModal.reason,
    });
    setRejectModal(null);
  };

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">
            Admin Panel
          </span>
        </div>
        <button
          onClick={async () => {
            await logout.mutateAsync().catch(() => {});
            window.location.href = "/role-select";
          }}
          className="touch-target flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Consoles grid — A-03..A-14 admin surfaces */}
      <div className="px-4 pt-4 space-y-4">
        {(
          [
            {
              section: "Trust & Safety",
              tiles: [
                { label: "Approvals", icon: ClipboardCheck, route: "/admin/approvals" },
                { label: "Disputes", icon: AlertOctagon, route: "/admin/disputes" },
                { label: "Fraud & Risk", icon: ShieldAlert, route: "/admin/fraud" },
                { label: "Admin RBAC", icon: KeyRound, route: "/admin/rbac" },
              ],
            },
            {
              section: "Ops",
              tiles: [
                { label: "Incidents", icon: Activity, route: "/admin/incidents" },
                { label: "Payouts", icon: Banknote, route: "/admin/payouts" },
                { label: "Feature Flags", icon: Flag, route: "/admin/flags" },
              ],
            },
            {
              section: "Directory",
              tiles: [
                { label: "Providers", icon: Building2, route: "/admin/providers" },
                { label: "Consumers", icon: Users, route: "/admin/consumers" },
              ],
            },
            {
              section: "Config",
              tiles: [
                { label: "Pricing Rules", icon: Percent, route: "/admin/pricing-rules" },
                { label: "Notifications", icon: MessageSquare, route: "/admin/notifications-templates" },
                { label: "Exports & Audits", icon: Download, route: "/admin/exports" },
              ],
            },
          ] as ReadonlyArray<{
            section: string;
            tiles: ReadonlyArray<{ label: string; icon: LucideIcon; route: string }>;
          }>
        ).map((group) => (
          <div key={group.section}>
            <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {group.section}
            </p>
            <AnimatedList className="grid grid-cols-2 gap-2">
              {group.tiles.map((t) => (
                <AnimatedListItem key={t.label}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={hoverCapable ? hoverLift : undefined}
                    onClick={() => navigate(t.route)}
                    className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-2xl text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <t.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="flex-1 text-body-sm font-semibold text-foreground truncate">
                      {t.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </motion.button>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-3 flex bg-secondary rounded-xl p-1">
        {(
          [
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "partners", label: "Partners", icon: Store },
            { key: "notifications", label: "Alerts", icon: Bell },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-caption font-semibold transition-all relative ${tab === key ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === "notifications" && unreadAdminNotifs > 0 && (
              <span className="ml-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive flex items-center justify-center text-[9px] font-bold text-white leading-none">
                {unreadAdminNotifs > 99 ? "99+" : unreadAdminNotifs}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {/* ── Overview Tab ── */}
        {tab === "overview" &&
          (loadingAnalytics ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Total Users",
                    value: analytics?.total_users ?? 0,
                    icon: Users,
                    color: "text-primary",
                  },
                  {
                    label: "Total Partners",
                    value: analytics?.total_partners ?? 0,
                    icon: Store,
                    color: "text-success",
                  },
                  {
                    label: "Total Bookings",
                    value: analytics?.total_bookings ?? 0,
                    icon: CheckCircle2,
                    color: "text-warning",
                  },
                  {
                    label: "Active Passes",
                    value: analytics?.active_passes ?? 0,
                    icon: Clock,
                    color: "text-primary",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-4 bg-card border border-border rounded-2xl"
                  >
                    <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                    <p className={`text-heading-sm ${s.color}`}>
                      {s.value.toLocaleString()}
                    </p>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Revenue */}
              <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-body font-bold text-foreground">
                    Platform Revenue
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm text-muted-foreground">
                      Total Revenue
                    </span>
                    <span className="text-body-sm font-bold text-foreground">
                      ₹{(analytics?.total_revenue ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-muted-foreground">
                      Platform Fee Collected
                    </span>
                    <span className="text-body-sm font-bold text-success">
                      ₹
                      {(
                        analytics?.platform_fee_collected ?? 0
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

        {/* ── Partners Tab ── */}
        {tab === "partners" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Filter */}
            <div className="flex gap-2">
              {["pending", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setPartnerFilter(f)}
                  className={`flex-1 py-2 rounded-xl text-caption font-semibold border transition-all capitalize ${partnerFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground bg-card"}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loadingPartners ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : !partners?.length ? (
              <div className="flex flex-col items-center py-16 gap-2">
                <Store className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-body-sm text-muted-foreground">
                  No {partnerFilter} partners
                </p>
              </div>
            ) : (
              partners.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 bg-card border border-border rounded-2xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-foreground truncate">
                        {v.business_name}
                      </p>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        {v.display_address ??
                          v.facility_name ??
                          "No address provided"}
                      </p>
                      <span
                        className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-caption font-semibold ${
                          v.kyc_status === "approved"
                            ? "bg-success/10 text-success"
                            : v.kyc_status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                        }`}
                      >
                        {v.kyc_status}
                      </span>
                      {v.rejection_reason && (
                        <p className="mt-1 text-caption text-destructive">
                          Reason: {v.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* KYC Documents */}
                  {v.partner_kyc_documents?.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() =>
                          setExpandedDocs(expandedDocs === v.id ? null : v.id)
                        }
                        className="flex items-center gap-1.5 text-caption font-semibold text-primary"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {v.partner_kyc_documents.length} document
                        {v.partner_kyc_documents.length > 1 ? "s" : ""}
                        {expandedDocs === v.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedDocs === v.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-2">
                              {v.partner_kyc_documents.map((doc: any) => (
                                <a
                                  key={doc.id}
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2.5 bg-secondary rounded-xl"
                                >
                                  <FileText className="w-4 h-4 text-primary shrink-0" />
                                  <span className="flex-1 text-caption font-semibold text-foreground capitalize">
                                    {doc.doc_type.replace(/_/g, " ")}
                                  </span>
                                  <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                                </a>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {v.kyc_status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <MobileButton
                        size="sm"
                        variant="success"
                        className="flex-1"
                        loading={approvePartner.isPending}
                        onClick={() => handleApprove(v.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </MobileButton>
                      <MobileButton
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        loading={rejectPartner.isPending}
                        onClick={() => setRejectModal({ id: v.id, reason: "" })}
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </MobileButton>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ── Notifications Tab ── */}
        {tab === "notifications" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {adminNotifications.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-2 text-center">
                <BellOff className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-body-sm text-muted-foreground">
                  No admin alerts yet
                </p>
                <p className="text-caption text-muted-foreground/70 max-w-xs">
                  New provider registrations, disputes, and incidents will
                  appear here as they happen.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-caption text-muted-foreground">
                    {adminNotifications.length} total ·{" "}
                    <span
                      className={
                        unreadAdminNotifs > 0 ? "text-destructive font-bold" : ""
                      }
                    >
                      {unreadAdminNotifs} unread
                    </span>
                  </p>
                  <button
                    onClick={() => {
                      markAllNotificationsRead("admin", "admin");
                      setNotifTick((t) => t + 1);
                    }}
                    className="text-caption font-semibold text-primary"
                  >
                    Mark all read
                  </button>
                </div>
                {adminNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border ${
                      n.read
                        ? "bg-card border-border"
                        : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Bell
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          n.read ? "text-muted-foreground" : "text-primary"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-bold text-foreground">
                          {n.title}
                        </p>
                        <p className="text-caption text-muted-foreground mt-0.5">
                          {n.body}
                        </p>
                        <p className="text-caption text-muted-foreground/70 mt-1">
                          {new Date(n.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Fix #34: Rejection reason modal — replaces window.prompt() */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-heading-sm text-foreground">Reject Partner</h3>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Provide a reason (optional)
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal({ ...rejectModal, reason: e.target.value })
              }
              placeholder="e.g. Incomplete documents, invalid address..."
              className="mt-3 w-full h-24 rounded-xl border border-border bg-secondary p-3 text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 h-12 rounded-xl border border-border text-body-sm font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejectPartner.isPending}
                className="flex-1 h-12 rounded-xl bg-destructive text-body-sm font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {rejectPartner.isPending ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatedPage>
  );
};

export default AdminDashboardScreen;
