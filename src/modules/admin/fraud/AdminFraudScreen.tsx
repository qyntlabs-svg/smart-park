// Screen: A-09 · Primitives: Identity, Payment
// Route: /admin/fraud

import {
  ShieldAlert,
  Loader2,
  Ban,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import {
  useFraudFlags,
  useFraudTrend,
  useUpdateFlagStatus,
} from "./hooks";
import { LEVEL_LABEL, type FlaggedAccount, type RiskLevel } from "./types";

const AdminFraudScreen = () => {
  const { data: flags = [], isLoading, isError } = useFraudFlags();
  const { data: trend = [] } = useFraudTrend();
  const setStatus = useUpdateFlagStatus();

  const currentCbRate = trend.length ? trend[trend.length - 1].chargebackRate : 0;
  const flaggedCount = flags.filter((f) => f.status === "flagged").length;
  const blockedCount = flags.filter((f) => f.status === "blocked").length;

  const doAction = async (
    f: FlaggedAccount,
    status: FlaggedAccount["status"],
  ) => {
    const messages: Record<FlaggedAccount["status"], string> = {
      flagged: "Reflagged",
      reviewed_ok: "Cleared",
      blocked: "Account blocked",
    };
    if (status === "blocked" && !window.confirm(`Block ${f.name}? All bookings will be cancelled.`))
      return;
    await setStatus.mutateAsync({ id: f.id, status });
    toast.success(messages[status]);
  };

  return (
    <AdminLayout
      title="Fraud & Risk"
      subtitle="Flagged accounts, chargeback rate, risk trends"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi
          label="Chargeback rate"
          value={`${currentCbRate.toFixed(1)}%`}
          tone={currentCbRate > 1.5 ? "destructive" : "success"}
        />
        <Kpi label="Flagged accounts" value={String(flaggedCount)} tone="warning" />
        <Kpi label="Blocked" value={String(blockedCount)} tone="destructive" />
        <Kpi label="Under review" value={String(flags.filter((f) => f.status === "reviewed_ok").length)} tone="primary" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 mb-4">
        <p className="text-body-sm font-bold text-foreground mb-2">
          Chargeback vs. dispute rate (12 weeks)
        </p>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="chargebackRate"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Chargeback %"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="disputeRate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Dispute %"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-body-sm font-bold text-foreground">Flagged accounts</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-body-sm text-destructive p-4">Couldn't load fraud data</p>
        ) : flags.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-2 text-center">
            <ShieldAlert className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-body-sm text-muted-foreground">No flags 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="bg-secondary/60 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Account</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-right px-4 py-3">Score</th>
                  <th className="text-right px-4 py-3">CB rate</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{f.name}</p>
                      <p className="text-caption text-muted-foreground">
                        {f.phone} · {f.city}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{f.reason}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <LevelBadge level={f.level} />
                        <span className="text-body-sm font-bold text-foreground">
                          {f.score}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {f.chargebackRatePct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={f.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {f.status !== "reviewed_ok" && (
                          <MobileButton
                            size="sm"
                            variant="success"
                            className="gap-1"
                            onClick={() => doAction(f, "reviewed_ok")}
                            loading={setStatus.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Clear
                          </MobileButton>
                        )}
                        {f.status !== "blocked" && (
                          <MobileButton
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => doAction(f, "blocked")}
                            loading={setStatus.isPending}
                          >
                            <Ban className="w-3.5 h-3.5" /> Block
                          </MobileButton>
                        )}
                        {f.status === "blocked" && (
                          <MobileButton
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => doAction(f, "flagged")}
                            loading={setStatus.isPending}
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Reopen
                          </MobileButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const Kpi = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive" | "primary";
}) => {
  const color = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    primary: "text-primary",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className={`text-heading-md font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
};

const LevelBadge = ({ level }: { level: RiskLevel }) => {
  const map: Record<RiskLevel, string> = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-warning text-warning-foreground",
    med: "bg-primary/10 text-primary",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${map[level]}`}>
      {LEVEL_LABEL[level]}
    </span>
  );
};

const StatusPill = ({ status }: { status: FlaggedAccount["status"] }) => {
  const map: Record<FlaggedAccount["status"], string> = {
    flagged: "bg-warning/10 text-warning",
    reviewed_ok: "bg-success/10 text-success",
    blocked: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

export default AdminFraudScreen;
