// Screen: MOS-06 · Primitives: Payment
// Route: /mechanic-os/invoices

import { useMemo, useState } from "react";
import { Printer, Receipt, Search, Check } from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  listInvoices,
  saveInvoices,
  type Invoice,
} from "@/modules/mechanic-os/lib/mos-store";
import { getMechanicShop } from "@/modules/mechanic/lib/shops";
import { toast } from "sonner";

const MosInvoicesScreen = () => {
  const shop = getMechanicShop();
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const invoices = useMemo(() => listInvoices(), [tick]);
  const [selected, setSelected] = useState<Invoice | null>(invoices[0] ?? null);

  const filtered = invoices.filter(
    (i) =>
      !q.trim() ||
      i.customerName.toLowerCase().includes(q.toLowerCase()) ||
      i.invoiceNumber.toLowerCase().includes(q.toLowerCase()),
  );

  const markPaid = (inv: Invoice) => {
    const all = listInvoices().map((i) =>
      i.id === inv.id
        ? { ...i, status: "paid" as const, paidAt: new Date().toISOString() }
        : i,
    );
    saveInvoices(all);
    toast.success(`${inv.invoiceNumber} marked paid`);
    setTick((t) => t + 1);
    setSelected(all.find((i) => i.id === inv.id) ?? null);
  };

  const printInvoice = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <MechanicOsLayout
      title="Invoicing & billing"
      subtitle="GST-compliant invoice generator"
      actions={
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search invoice # or name"
            className="h-10 pl-9 pr-3 rounded-lg bg-secondary text-body-sm w-72"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center">
                <Receipt className="w-6 h-6 mx-auto text-muted-foreground" />
                <p className="text-body-sm text-muted-foreground mt-2">
                  No invoices found.
                </p>
              </div>
            )}
            {filtered.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                  selected?.id === i.id ? "bg-secondary/70" : "hover:bg-secondary/40"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {i.invoiceNumber}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {i.customerName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-bold">
                    ₹{i.total.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-md text-caption font-semibold ${
                      i.status === "paid"
                        ? "bg-success/10 text-success"
                        : i.status === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {i.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail (printable) */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center">
              <Receipt className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-body-sm text-muted-foreground mt-2">
                Select an invoice to preview.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden print:border-none print:shadow-none">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-foreground">
                    Tax Invoice
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {selected.invoiceNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-bold text-foreground">
                    {shop?.shopName ?? "SmartPark Auto"}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {shop?.address ?? "—"}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    GSTIN 33AABCS0000A1Z5
                  </p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4 text-body-sm">
                <div>
                  <p className="text-caption text-muted-foreground">Bill to</p>
                  <p className="font-bold text-foreground">
                    {selected.customerName}
                  </p>
                  <p className="text-muted-foreground">
                    {selected.customerPhone}
                  </p>
                  {selected.customerGstin && (
                    <p className="text-muted-foreground">
                      GSTIN {selected.customerGstin}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-caption text-muted-foreground">Issued</p>
                  <p className="font-bold text-foreground">
                    {new Date(selected.issuedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-caption text-muted-foreground mt-2">
                    Vehicle
                  </p>
                  <p className="font-semibold text-foreground">
                    {selected.vehicleLabel}
                  </p>
                </div>
              </div>

              <div className="px-6">
                <table className="w-full text-body-sm border border-border rounded-lg overflow-hidden">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">
                        Description
                      </th>
                      <th className="text-right px-3 py-2 font-semibold w-16">
                        Qty
                      </th>
                      <th className="text-right px-3 py-2 font-semibold w-28">
                        Rate
                      </th>
                      <th className="text-right px-3 py-2 font-semibold w-28">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selected.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="px-3 py-2">{l.label}</td>
                        <td className="px-3 py-2 text-right">{l.qty}</td>
                        <td className="px-3 py-2 text-right">
                          ₹{l.unitPrice.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ₹{(l.unitPrice * l.qty).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4">
                <div className="ml-auto max-w-xs space-y-1 text-body-sm">
                  <Row label="Subtotal" value={`₹${selected.subtotal.toLocaleString("en-IN")}`} />
                  <Row label="CGST 9%" value={`₹${selected.cgst.toLocaleString("en-IN")}`} />
                  <Row label="SGST 9%" value={`₹${selected.sgst.toLocaleString("en-IN")}`} />
                  <Row
                    label="Total (INR)"
                    value={`₹${selected.total.toLocaleString("en-IN")}`}
                    bold
                  />
                </div>
              </div>

              <div className="p-6 border-t border-border flex items-center justify-between gap-2 print:hidden">
                <p className="text-caption text-muted-foreground">
                  {selected.status === "paid"
                    ? `Paid ${new Date(selected.paidAt!).toLocaleString()}`
                    : "Payment pending — send UPI reminder"}
                </p>
                <div className="flex items-center gap-2">
                  <MobileButton variant="outline" size="sm" onClick={printInvoice}>
                    <Printer className="w-4 h-4" /> Print
                  </MobileButton>
                  {selected.status !== "paid" && (
                    <MobileButton
                      variant="success"
                      size="sm"
                      onClick={() => markPaid(selected)}
                    >
                      <Check className="w-4 h-4" /> Mark paid
                    </MobileButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MechanicOsLayout>
  );
};

const Row = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={bold ? "text-body font-bold" : "font-semibold"}>{value}</span>
  </div>
);

export default MosInvoicesScreen;
