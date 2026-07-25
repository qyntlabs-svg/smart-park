// Screen: F-08 · Primitives: Payment, Identity
// Corporate Wallet & Billing — single invoice, per-driver policy tags, monthly statement.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Download, FileText } from "lucide-react";
import {
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
  FleetKpiCard,
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
  useFleetDrivers,
  useFleetInvoices,
} from "@/modules/fleet/hooks";
import { cn } from "@/lib/utils";
import type { FleetInvoice } from "@/modules/fleet/types";

const FleetBillingScreen = () => {
  const invoices = useFleetInvoices();
  const drivers = useFleetDrivers();
  const centers = useFleetCostCenters();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const walletBalance = 425000;
  const autoTopUp = { threshold: 100000, amount: 500000 };

  const selected: FleetInvoice | undefined = useMemo(() => {
    if (!invoices.data) return undefined;
    return invoices.data.find((i) => i.id === selectedId) ?? invoices.data[0];
  }, [invoices.data, selectedId]);

  const perDriverPolicy = useMemo(() => {
    return (drivers.data ?? []).slice(0, 8).map((d) => {
      const cc = centers.data?.find((c) => c.id === d.costCenterId);
      // fabricate driver-level spend from rating & trips
      const spend = Math.round(d.totalTrips * 12 + (5 - d.rating) * 800);
      return {
        driver: d,
        cc,
        spend,
        cap: cc?.monthlyBudget ? Math.round(cc.monthlyBudget / 6) : 24000,
      };
    });
  }, [drivers.data, centers.data]);

  if (invoices.isLoading || drivers.isLoading || centers.isLoading)
    return (
      <FleetLayout title="Billing" screenId="F-08" primitives={["Payment", "Identity"]}>
        <FleetLoading />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Corporate wallet & billing"
      screenId="F-08"
      primitives={["Payment", "Identity"]}
    >
      <FleetPageBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FleetKpiCard
            label="Wallet balance"
            value={`₹${(walletBalance / 1000).toFixed(1)}k`}
            hint="Auto-tops up @ ₹1L threshold"
            icon={CreditCard}
          />
          <FleetKpiCard
            label="Auto top-up"
            value={`₹${(autoTopUp.amount / 1000).toFixed(0)}k`}
            hint={`When < ₹${autoTopUp.threshold / 1000}k`}
            icon={CheckCircle2}
          />
          <FleetKpiCard
            label="Payment mode"
            value="Corporate invoice"
            hint="Single invoice, split by cost center"
            icon={FileText}
          />
        </div>

        <FleetSection
          title="Monthly statements"
          subtitle={`${invoices.data?.length ?? 0} months on record`}
          right={
            <button
              onClick={() => toast.success("PDF statement generated (mock)")}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Month</TableHead>
                <TableHead className="text-[11px]">Issued</TableHead>
                <TableHead className="text-[11px]">Cost centers</TableHead>
                <TableHead className="text-[11px] text-right">Total</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoices.data ?? []).map((inv) => (
                <TableRow
                  key={inv.id}
                  className={cn(
                    "text-[12px] cursor-pointer",
                    selected?.id === inv.id && "bg-blue-50/40",
                  )}
                  onClick={() => setSelectedId(inv.id)}
                >
                  <TableCell className="py-2 font-semibold">{inv.month}</TableCell>
                  <TableCell className="py-2 text-slate-500">
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2">
                    {inv.costCenterBreakdown.length}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono font-semibold">
                    ₹{inv.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.status === "overdue"
                            ? "bg-red-50 text-red-700"
                            : inv.status === "issued"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {inv.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </FleetSection>

        <FleetSection
          title="Per-driver policy tags"
          subtitle="Auto-derived from cost center — override per driver in Policies"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Driver</TableHead>
                <TableHead className="text-[11px]">Cost ctr</TableHead>
                <TableHead className="text-[11px] text-right">Monthly cap</TableHead>
                <TableHead className="text-[11px] text-right">Spend</TableHead>
                <TableHead className="text-[11px] w-40">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perDriverPolicy.map(({ driver, cc, spend, cap }) => {
                const util = Math.round((spend / cap) * 100);
                return (
                  <TableRow key={driver.id} className="text-[12px]">
                    <TableCell className="py-2">
                      <span className="font-semibold text-slate-800">{driver.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {" "}
                        · {driver.employeeCode}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 font-mono">{cc?.code}</TableCell>
                    <TableCell className="py-2 text-right font-mono">
                      ₹{cap.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 text-right font-mono font-semibold">
                      ₹{spend.toLocaleString()}
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
            </TableBody>
          </Table>
        </FleetSection>
      </FleetPageBody>
    </FleetLayout>
  );
};

export default FleetBillingScreen;
