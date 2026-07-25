// Screen: CO-08 · Primitives: Payment
// Revenue & Payouts — money earned via platform, payout schedule.

import { useMemo } from "react";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  OperatorKpiCard,
  OperatorLayout,
  OperatorLoading,
  OperatorPageBody,
  OperatorSection,
} from "@/modules/operator/components/OperatorLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDailyRevenue,
  usePayouts,
  useRevenueSplit,
} from "@/modules/operator/hooks";
import { cn } from "@/lib/utils";

const OperatorRevenueScreen = () => {
  const daily = useDailyRevenue(30);
  const split = useRevenueSplit(30);
  const payouts = usePayouts();

  const pieData = useMemo(() => {
    if (!split.data) return [];
    return [
      { name: "Net to operator", value: split.data.net, color: "#10b981" },
      { name: "Platform fee (8%)", value: split.data.platformFee, color: "#2563eb" },
      { name: "Taxes pass-through", value: split.data.taxes, color: "#f59e0b" },
    ];
  }, [split.data]);

  if (daily.isLoading || split.isLoading || payouts.isLoading)
    return (
      <OperatorLayout title="Revenue" screenId="CO-08" primitives={["Payment"]}>
        <OperatorLoading />
      </OperatorLayout>
    );

  const next = payouts.data?.find((p) => p.status === "scheduled" || p.status === "in_transit");

  return (
    <OperatorLayout
      title="Revenue & payouts"
      screenId="CO-08"
      primitives={["Payment"]}
    >
      <OperatorPageBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OperatorKpiCard
            label="Gross (30d)"
            value={`₹${(split.data!.gross / 1000).toFixed(1)}k`}
            trend={{ value: "12%", positive: true }}
            icon={DollarSign}
          />
          <OperatorKpiCard
            label="Platform fee"
            value={`₹${(split.data!.platformFee / 1000).toFixed(1)}k`}
            hint="8% of gross"
            icon={TrendingUp}
          />
          <OperatorKpiCard
            label="Net to operator"
            value={`₹${(split.data!.net / 1000).toFixed(1)}k`}
            tone="success"
            icon={Wallet}
          />
          <OperatorKpiCard
            label="Next payout"
            value={next ? `₹${(next.net / 1000).toFixed(1)}k` : "None"}
            hint={next ? new Date(next.periodEnd).toLocaleDateString() : "up to date"}
            icon={Wallet}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <OperatorSection
            title="Daily gross (30d)"
            subtitle="From EV session ledger, pre-fee, pre-tax"
            className="lg:col-span-2"
          >
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily.data ?? []}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    fill="url(#rev)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </OperatorSection>

          <OperatorSection title="Revenue split (30d)">
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(v: number) => `₹${(v / 1000).toFixed(1)}k`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </OperatorSection>
        </div>

        <OperatorSection
          title="Payout schedule"
          subtitle="Weekly settlements; wired to your default bank account"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Period</TableHead>
                <TableHead className="text-[11px] text-right">Gross</TableHead>
                <TableHead className="text-[11px] text-right">Fee</TableHead>
                <TableHead className="text-[11px] text-right">Tax</TableHead>
                <TableHead className="text-[11px] text-right">Net</TableHead>
                <TableHead className="text-[11px]">Bank</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payouts.data ?? []).map((p) => (
                <TableRow key={p.id} className="text-[12px]">
                  <TableCell className="py-2">
                    {new Date(p.periodStart).toLocaleDateString()} →{" "}
                    {new Date(p.periodEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono">
                    ₹{p.gross.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-slate-500">
                    ₹{p.platformFee.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-slate-500">
                    ₹{p.taxes.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono font-semibold text-emerald-700">
                    ₹{p.net.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2 font-mono text-slate-600">
                    {p.bankMasked}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        p.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : p.status === "in_transit"
                            ? "bg-blue-50 text-blue-700"
                            : p.status === "scheduled"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700",
                      )}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </OperatorSection>
      </OperatorPageBody>
    </OperatorLayout>
  );
};

export default OperatorRevenueScreen;
