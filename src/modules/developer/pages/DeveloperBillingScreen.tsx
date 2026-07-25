// Screen: DEV-08 · Primitives: Payment, Provider
// Billing — plans + invoices for API access.

import { toast } from "sonner";
import { Check, Download, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DevKpi,
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import {
  useDevActivePlan,
  useDevInvoices,
  useSetActivePlan,
} from "@/modules/developer/hooks";
import { PLANS } from "@/modules/developer/store";
import { cn } from "@/lib/utils";

const DeveloperBillingScreen = () => {
  const plan = useDevActivePlan();
  const invoices = useDevInvoices();
  const setPlan = useSetActivePlan();

  const paid = (invoices.data ?? []).filter((i) => i.status === "paid");
  const totalPaid = paid.reduce((s, i) => s + i.total, 0);
  const outstanding = (invoices.data ?? [])
    .filter((i) => i.status === "issued")
    .reduce((s, i) => s + i.total, 0);

  return (
    <DeveloperLayout
      title="Billing"
      screenId="DEV-08"
      primitives={["Payment", "Provider"]}
    >
      {plan.isLoading || invoices.isLoading ? (
        <DevLoading />
      ) : (
        <DevPageBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <DevKpi label="Active plan" value={plan.data?.name ?? "—"} />
            <DevKpi
              label="Monthly base"
              value={
                plan.data?.monthlyPrice
                  ? `₹${plan.data.monthlyPrice.toLocaleString()}`
                  : "Free"
              }
            />
            <DevKpi label="Paid YTD" value={`₹${totalPaid.toLocaleString()}`} />
            <DevKpi
              label="Outstanding"
              value={`₹${outstanding.toLocaleString()}`}
              hint={outstanding > 0 ? "1 issued" : "You're current"}
            />
          </div>

          <DevSection title="Plans" subtitle="Change any time; pro-rated to the day">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {PLANS.map((p) => {
                const active = plan.data?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-xl border-2 p-4 flex flex-col",
                      active
                        ? "border-violet-500 bg-violet-50/30"
                        : "border-slate-200",
                    )}
                  >
                    <p className="text-[13px] font-bold text-slate-900">
                      {p.name}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {p.monthlyPrice === 0
                        ? "Free"
                        : `₹${p.monthlyPrice.toLocaleString()}`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {p.requestsIncluded.toLocaleString()} req / mo
                      {p.overageRate > 0 && (
                        <> · ₹{p.overageRate}/req overage</>
                      )}
                    </p>
                    <ul className="mt-3 text-[12px] text-slate-600 space-y-1 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={active}
                      onClick={async () => {
                        await setPlan.mutateAsync(p.id);
                        toast.success(`Switched to ${p.name}`);
                      }}
                      className={cn(
                        "mt-4 h-9 rounded-md text-[12px] font-semibold",
                        active
                          ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                          : "bg-violet-600 hover:bg-violet-700 text-white",
                      )}
                    >
                      {active ? "Current plan" : `Switch to ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </DevSection>

          <DevSection title="Invoices" subtitle="Downloadable statements">
            {(invoices.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-[13px] text-slate-500">
                <FileText className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No invoices yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Invoice</TableHead>
                    <TableHead className="text-[11px]">Period</TableHead>
                    <TableHead className="text-[11px]">Plan</TableHead>
                    <TableHead className="text-[11px] text-right">Requests</TableHead>
                    <TableHead className="text-[11px] text-right">Overage</TableHead>
                    <TableHead className="text-[11px] text-right">Total</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.data!.map((i) => (
                    <TableRow key={i.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono">{i.id}</TableCell>
                      <TableCell className="py-2">{i.month}</TableCell>
                      <TableCell className="py-2">
                        <span className="capitalize">{i.plan}</span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {i.requests.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        ₹{i.overageCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 text-right font-bold">
                        ₹{i.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                            i.status === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : i.status === "issued"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {i.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <button
                          onClick={() => toast.success(`Downloading ${i.id}`)}
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DevSection>
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperBillingScreen;
