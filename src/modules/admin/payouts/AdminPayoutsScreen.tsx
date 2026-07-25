// Screen: A-07 · Primitives: Payment
// Route: /admin/payouts

import {
  Banknote,
  Loader2,
  Play,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import {
  usePayoutBatches,
  usePayoutExceptions,
  usePayoutOpsAggregate,
  useResolvePayoutException,
  useRunPayoutBatch,
} from "./hooks";
import type { PayoutBatchStatus } from "./types";

const AdminPayoutsScreen = () => {
  const { data: batches = [], isLoading: loadingBatches, isError } =
    usePayoutBatches();
  const { data: exceptions = [] } = usePayoutExceptions();
  const { data: agg } = usePayoutOpsAggregate();
  const runBatch = useRunPayoutBatch();
  const resolve = useResolvePayoutException();

  const doRun = async () => {
    if (!window.confirm("Run the next batch payout now?")) return;
    await runBatch.mutateAsync();
    toast.success("Batch queued");
  };

  return (
    <AdminLayout
      title="Payouts Ops"
      subtitle="Batch payout runs and exception handling"
      action={
        <MobileButton
          size="sm"
          onClick={doRun}
          loading={runBatch.isPending}
          className="gap-1.5"
        >
          <Play className="w-4 h-4" /> Run batch
        </MobileButton>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi label="Paid (30d)" value={`₹${(agg?.last30dPaid ?? 0).toLocaleString()}`} tone="success" />
        <Kpi label="Payouts (30d)" value={String(agg?.last30dCount ?? 0)} />
        <Kpi label="Pending" value={`₹${(agg?.pendingSum ?? 0).toLocaleString()}`} tone="warning" />
        <Kpi
          label="Open exceptions"
          value={String(agg?.exceptionCount ?? 0)}
          tone={(agg?.exceptionCount ?? 0) > 0 ? "destructive" : "muted"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Chart */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-body-sm font-bold text-foreground mb-2">
            Weekly payout volume
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg?.weeklyTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, "Total"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exceptions */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-body-sm font-bold text-foreground mb-2">Exceptions</p>
          {exceptions.filter((e) => !e.resolved).length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-1 text-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <p className="text-body-sm text-muted-foreground">
                No open exceptions
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exceptions
                .filter((e) => !e.resolved)
                .map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl bg-destructive/5 border border-destructive/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-foreground truncate">
                          {e.providerName}
                        </p>
                        <p className="text-caption text-destructive mt-0.5">
                          {e.reason}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-body-sm font-bold text-foreground">
                          ₹{e.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <MobileButton
                      size="sm"
                      variant="outline"
                      className="mt-2 gap-1.5"
                      onClick={async () => {
                        await resolve.mutateAsync(e.id);
                        toast.success("Exception resolved");
                      }}
                      loading={resolve.isPending}
                    >
                      Mark resolved
                    </MobileButton>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Batches */}
      <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-body-sm font-bold text-foreground">Batch runs</p>
        </div>
        {loadingBatches ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-body-sm text-destructive p-4">
            Couldn't load payout batches
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="bg-secondary/60 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Run at</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-right px-4 py-3">Success / Fail</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-left px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">
                      {new Date(b.runAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      ₹{b.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-success font-semibold">
                        {b.succeeded}
                      </span>
                      {" / "}
                      <span
                        className={
                          b.failed > 0
                            ? "text-destructive font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {b.failed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground uppercase">{b.method}</td>
                    <td className="px-4 py-3 text-caption text-muted-foreground">
                      {b.operatorNote ?? "—"}
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
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "success" | "warning" | "destructive";
}) => {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className={`text-heading-sm font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
};

const StatusPill = ({ status }: { status: PayoutBatchStatus }) => {
  const map: Record<PayoutBatchStatus, string> = {
    queued: "bg-muted text-muted-foreground",
    processing: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    partial_failure: "bg-warning/10 text-warning",
    failed: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
      {status === "partial_failure" ? (
        <span className="inline-flex items-center gap-0.5">
          <AlertTriangle className="w-3 h-3" /> partial
        </span>
      ) : (
        status
      )}
    </span>
  );
};

export default AdminPayoutsScreen;
