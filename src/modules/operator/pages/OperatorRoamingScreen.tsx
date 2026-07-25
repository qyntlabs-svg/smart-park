// Screen: CO-09 · Primitives: Provider, Payment
// Roaming Partners — Visa-pattern roaming ledger. Marked "Phase 3" preview.

import { useMemo } from "react";
import { Globe } from "lucide-react";
import {
  OperatorEmpty,
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
  useRoamingEntries,
  useRoamingPartners,
} from "@/modules/operator/hooks";
import { cn } from "@/lib/utils";

const OperatorRoamingScreen = () => {
  const partners = useRoamingPartners();
  const entries = useRoamingEntries();

  const partnerMap = useMemo(() => {
    const m = new Map<string, string>();
    (partners.data ?? []).forEach((p) => m.set(p.id, p.name));
    return m;
  }, [partners.data]);

  const totals = useMemo(() => {
    const inbound = (entries.data ?? []).filter((e) => e.direction === "inbound");
    const outbound = (entries.data ?? []).filter((e) => e.direction === "outbound");
    const sum = (list: typeof inbound) =>
      list.reduce(
        (acc, e) => ({
          kwh: acc.kwh + e.kwh,
          amountInr:
            acc.amountInr +
            (e.currency === "INR"
              ? e.costCents / 100
              : e.currency === "USD"
                ? (e.costCents / 100) * 83
                : (e.costCents / 100) * 92),
        }),
        { kwh: 0, amountInr: 0 },
      );
    return { inbound: sum(inbound), outbound: sum(outbound) };
  }, [entries.data]);

  if (partners.isLoading || entries.isLoading)
    return (
      <OperatorLayout title="Roaming" screenId="CO-09" primitives={["Provider", "Payment"]}>
        <OperatorLoading />
      </OperatorLayout>
    );

  return (
    <OperatorLayout
      title="Roaming partners"
      screenId="CO-09"
      primitives={["Provider", "Payment"]}
      actions={
        <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200">
          Phase 3 preview
        </span>
      }
    >
      <OperatorPageBody>
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">
                Roaming acts like Visa for chargers
              </p>
              <p className="text-[12px] text-slate-600 mt-1">
                Consumers on partner networks can plug into your stations (and vice
                versa) and settle centrally. All charges cleared here appear on the
                consumer's home-network invoice, not yours.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi
            label="Partners active"
            value={String((partners.data ?? []).filter((p) => p.status === "active").length)}
          />
          <Kpi
            label="Inbound (30d)"
            value={`${Math.round(totals.inbound.kwh)} kWh`}
            hint={`≈ ₹${Math.round(totals.inbound.amountInr).toLocaleString()}`}
          />
          <Kpi
            label="Outbound (30d)"
            value={`${Math.round(totals.outbound.kwh)} kWh`}
            hint={`≈ ₹${Math.round(totals.outbound.amountInr).toLocaleString()}`}
          />
          <Kpi
            label="Net settlement"
            value={`₹${Math.round(
              totals.inbound.amountInr - totals.outbound.amountInr,
            ).toLocaleString()}`}
            hint="Positive = they owe you"
          />
        </div>

        <OperatorSection title="Partner networks">
          {(partners.data ?? []).length === 0 ? (
            <OperatorEmpty
              title="No partners"
              body="Sign up to the SmartPark roaming coalition to appear here."
              icon={Globe}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-[11px]">Partner</TableHead>
                  <TableHead className="text-[11px]">Country</TableHead>
                  <TableHead className="text-[11px] text-right">Network size</TableHead>
                  <TableHead className="text-[11px]">Contract start</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.data?.map((p) => (
                  <TableRow key={p.id} className="text-[12px]">
                    <TableCell className="py-2 font-semibold">{p.name}</TableCell>
                    <TableCell className="py-2 font-mono">{p.country}</TableCell>
                    <TableCell className="py-2 text-right">
                      {p.networkSize.toLocaleString()} stations
                    </TableCell>
                    <TableCell className="py-2">
                      {new Date(p.contractStart).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {p.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </OperatorSection>

        <OperatorSection
          title={`Ledger entries (${(entries.data ?? []).length})`}
          subtitle="Cross-network sessions cleared through the roaming rail"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Created</TableHead>
                <TableHead className="text-[11px]">Partner</TableHead>
                <TableHead className="text-[11px]">Session</TableHead>
                <TableHead className="text-[11px]">Direction</TableHead>
                <TableHead className="text-[11px] text-right">kWh</TableHead>
                <TableHead className="text-[11px] text-right">Amount</TableHead>
                <TableHead className="text-[11px]">Settled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries.data ?? []).map((e) => (
                <TableRow key={e.id} className="text-[12px]">
                  <TableCell className="py-2">
                    {new Date(e.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2">{partnerMap.get(e.partnerId)}</TableCell>
                  <TableCell className="py-2 font-mono">{e.sessionId.slice(-8)}</TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        e.direction === "inbound"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700",
                      )}
                    >
                      {e.direction}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono">{e.kwh}</TableCell>
                  <TableCell className="py-2 text-right font-mono">
                    {e.currency} {(e.costCents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2 text-slate-500">
                    {e.settledAt ? new Date(e.settledAt).toLocaleDateString() : "—"}
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

const Kpi = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
      {label}
    </p>
    <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
  </div>
);

export default OperatorRoamingScreen;
