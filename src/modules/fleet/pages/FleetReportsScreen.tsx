// Screen: F-07 · Primitives: Payment
// Cost Center Reports — chargeback per department / cost center.

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
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
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useFleetCostCenters,
  useFleetInvoices,
} from "@/modules/fleet/hooks";
import { cn } from "@/lib/utils";

const COLORS = ["#2563eb", "#10b981", "#f97316", "#8b5cf6", "#06b6d4"];

const FleetReportsScreen = () => {
  const centers = useFleetCostCenters();
  const invoices = useFleetInvoices();

  const [monthIdx, setMonthIdx] = useState(0);

  const invoice = invoices.data?.[monthIdx];

  const pie = useMemo(() => {
    if (!invoice) return [];
    return invoice.costCenterBreakdown.map((b, i) => {
      const cc = centers.data?.find((c) => c.id === b.costCenterId);
      return {
        name: cc?.name ?? b.costCenterId,
        code: cc?.code ?? b.costCenterId,
        value: b.total,
        color: COLORS[i % COLORS.length],
      };
    });
  }, [invoice, centers.data]);

  const trend = useMemo(() => {
    return [...(invoices.data ?? [])]
      .reverse()
      .map((inv) => ({
        month: inv.month.slice(5),
        total: Math.round(inv.total / 1000),
      }));
  }, [invoices.data]);

  const totalSpend = invoice?.total ?? 0;

  const exportCsv = () => {
    if (!invoice) return;
    const rows: string[] = [
      "cost_center_code,cost_center_name,budget,spend,utilization_pct",
    ];
    invoice.costCenterBreakdown.forEach((b) => {
      const cc = centers.data?.find((c) => c.id === b.costCenterId);
      const util = cc ? Math.round((b.total / cc.monthlyBudget) * 100) : 0;
      rows.push(`${cc?.code ?? ""},${cc?.name ?? ""},${cc?.monthlyBudget ?? 0},${b.total},${util}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-costcenter-report-${invoice.month}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  if (centers.isLoading || invoices.isLoading)
    return (
      <FleetLayout title="Cost reports" screenId="F-07" primitives={["Payment"]}>
        <FleetLoading />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Cost reports"
      screenId="F-07"
      primitives={["Payment"]}
      actions={
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      }
    >
      <FleetPageBody>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FleetSection
            title="Trend"
            subtitle="Total ₹k per month, 6 months"
            className="lg:col-span-2"
          >
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FleetSection>

          <FleetSection title="Month" subtitle="Pick to break down chargebacks">
            <div className="p-4 space-y-1">
              {(invoices.data ?? []).map((inv, i) => (
                <button
                  key={inv.id}
                  onClick={() => setMonthIdx(i)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px]",
                    monthIdx === i
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span>{inv.month}</span>
                  <span className="font-mono">₹{(inv.total / 1000).toFixed(1)}k</span>
                </button>
              ))}
            </div>
          </FleetSection>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FleetSection title={`Chargeback split — ${invoice?.month ?? ""}`}>
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pie}
                    dataKey="value"
                    nameKey="code"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pie.map((entry, i) => (
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
          </FleetSection>

          <FleetSection
            title="Per-cost-center detail"
            subtitle="With budget utilization"
            className="lg:col-span-2"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-[11px]">Code</TableHead>
                  <TableHead className="text-[11px]">Cost center</TableHead>
                  <TableHead className="text-[11px] text-right">Budget</TableHead>
                  <TableHead className="text-[11px] text-right">Spend</TableHead>
                  <TableHead className="text-[11px] text-right">Util</TableHead>
                  <TableHead className="text-[11px] w-40">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice?.costCenterBreakdown.map((b) => {
                  const cc = centers.data?.find((c) => c.id === b.costCenterId);
                  const util = cc ? Math.round((b.total / cc.monthlyBudget) * 100) : 0;
                  return (
                    <TableRow key={b.costCenterId} className="text-[12px]">
                      <TableCell className="py-2 font-mono font-semibold">
                        {cc?.code}
                      </TableCell>
                      <TableCell className="py-2">{cc?.name}</TableCell>
                      <TableCell className="py-2 text-right font-mono">
                        ₹{(cc?.monthlyBudget ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono font-semibold">
                        ₹{b.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            util > 100
                              ? "text-red-700"
                              : util > 85
                                ? "text-amber-700"
                                : "text-emerald-700",
                          )}
                        >
                          {util}%
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              util > 100
                                ? "bg-red-500"
                                : util > 85
                                  ? "bg-amber-500"
                                  : "bg-emerald-500",
                            )}
                            style={{ width: `${Math.min(100, util)}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="text-[12px] bg-slate-50/60">
                  <TableCell className="py-2 font-bold" colSpan={3}>
                    Total {invoice?.month}
                  </TableCell>
                  <TableCell className="py-2 text-right font-bold">
                    ₹{totalSpend.toLocaleString()}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </FleetSection>
        </div>
      </FleetPageBody>
    </FleetLayout>
  );
};

export default FleetReportsScreen;
