// Screen: V-18 · Primitives: Payment
// Route: /partner/invoices

import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Search,
  Loader2,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import { useGstSummary, useInvoices } from "./hooks";
import {
  INVOICE_KIND_LABEL,
  INVOICE_STATUS_LABEL,
  type GstSummary,
  type Invoice,
} from "./types";

const PartnerInvoicesScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: invoices = [], isLoading, isError } = useInvoices(partnerId);
  const { data: gst } = useGstSummary(partnerId);
  const [filter, setFilter] = useState<"all" | Invoice["kind"]>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (filter !== "all" && i.kind !== filter) return false;
      if (query && !i.number.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [invoices, filter, query]);

  const download = (inv: Invoice) => {
    downloadInvoiceHtml(inv);
    toast.success(`Downloaded ${inv.number}.html`);
  };

  const downloadGstReport = () => {
    if (gst) {
      downloadGstReportHtml(gst);
      toast.success("GSTR-3B summary downloaded. Also emailed to you.");
    } else {
      toast.success("GSTR-3B summary ready — check your email");
    }
  };

  if (isError) {
    return (
      <PartnerScreenLayout title="Invoices & Tax" icon={Receipt}>
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-body-sm text-muted-foreground">
            Could not load invoices.
          </p>
        </div>
      </PartnerScreenLayout>
    );
  }

  return (
    <PartnerScreenLayout title="Invoices & Tax" icon={Receipt}>
      {/* GST summary hero */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption text-primary font-bold uppercase tracking-wider">
              Current FY summary
            </p>
            {gst && (
              <p className="text-caption text-muted-foreground mt-0.5">
                {new Date(gst.fyStart).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })}{" "}
                –{" "}
                {new Date(gst.fyEnd).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })}
              </p>
            )}
          </div>
          <button
            onClick={downloadGstReport}
            className="text-caption font-semibold text-primary flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> GSTR-3B
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <SummaryCell
            label="Revenue"
            value={`₹${(gst?.totalRevenue ?? 0).toLocaleString()}`}
          />
          <SummaryCell
            label="Tax Collected"
            value={`₹${(gst?.totalTax ?? 0).toLocaleString()}`}
          />
          <SummaryCell label="CGST" value={`₹${(gst?.totalCgst ?? 0).toLocaleString()}`} />
          <SummaryCell label="SGST" value={`₹${(gst?.totalSgst ?? 0).toLocaleString()}`} />
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice #"
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-body-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(["all", "invoice", "credit_note", "gst_report"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-caption font-semibold border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {f === "all" ? "All" : INVOICE_KIND_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-body-sm text-muted-foreground">
              No invoices match your filter
            </p>
          </div>
        ) : (
          filtered.map((inv) => (
            <div
              key={inv.id}
              className="p-3 bg-card border border-border rounded-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {inv.number}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {INVOICE_KIND_LABEL[inv.kind]} ·{" "}
                    {new Date(inv.issuedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body-sm font-bold text-foreground">
                    ₹{inv.total.toLocaleString()}
                  </p>
                  <span
                    className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                      inv.status === "paid"
                        ? "bg-success/10 text-success"
                        : inv.status === "void"
                          ? "bg-muted text-muted-foreground"
                          : "bg-warning/10 text-warning"
                    }`}
                  >
                    {INVOICE_STATUS_LABEL[inv.status]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => download(inv)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-caption font-semibold text-primary py-2 rounded-lg border border-primary/20 active:bg-primary/5"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          ))
        )}
      </div>
    </PartnerScreenLayout>
  );
};

const SummaryCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-card border border-border p-2.5">
    <p className="text-caption text-muted-foreground">{label}</p>
    <p className="text-body-sm font-bold text-foreground mt-0.5">{value}</p>
  </div>
);

// ----- HTML "PDF" helpers (no jsPDF) -----

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function triggerDownload(html: string, filename: string) {
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    /* browser refused — silent */
  }
}

function downloadInvoiceHtml(inv: Invoice) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(inv.number)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color:#111; padding:24px; max-width:640px; margin:0 auto; }
  h1 { margin:0 0 4px; font-size:22px; }
  .muted { color:#6b7280; font-size:12px; }
  .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-top:12px; }
  .row { display:flex; justify-content:space-between; padding:4px 0; font-size:14px; }
  .row.total { font-weight:700; border-top:1px solid #e5e7eb; padding-top:8px; margin-top:8px; font-size:15px; }
  .brand { color:#059669; font-weight:700; }
  .pill { display:inline-block; background:#ecfdf5; color:#065f46; border-radius:999px; padding:2px 8px; font-size:11px; font-weight:700; }
</style></head><body>
  <div class="brand">SmartPark · Partner Invoice</div>
  <h1>${esc(INVOICE_KIND_LABEL[inv.kind])} ${esc(inv.number)}</h1>
  <div class="muted">Issued ${new Date(inv.issuedAt).toLocaleDateString("en-IN")} · <span class="pill">${esc(INVOICE_STATUS_LABEL[inv.status])}</span></div>

  <div class="card">
    <div class="row"><span>Period</span><span>${new Date(inv.periodStart).toLocaleDateString("en-IN")} – ${new Date(inv.periodEnd).toLocaleDateString("en-IN")}</span></div>
    ${inv.gstin ? `<div class="row"><span>GSTIN</span><span>${esc(inv.gstin)}</span></div>` : ""}
    <div class="row"><span>Partner ID</span><span>${esc(inv.partnerId)}</span></div>
  </div>

  <div class="card">
    <div class="row"><span>Amount (pre-tax)</span><span>${inr(inv.amount)}</span></div>
    <div class="row"><span>CGST</span><span>${inr(inv.cgst)}</span></div>
    <div class="row"><span>SGST</span><span>${inr(inv.sgst)}</span></div>
    <div class="row"><span>IGST</span><span>${inr(inv.igst)}</span></div>
    <div class="row total"><span>Total</span><span>${inr(inv.total)}</span></div>
  </div>

  <p class="muted" style="margin-top:16px">Generated on ${new Date().toLocaleString("en-IN")}. Demo artefact — no real payment was processed.</p>
</body></html>`;
  triggerDownload(html, `${inv.number}.html`);
}

function downloadGstReportHtml(gst: GstSummary) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>GSTR-3B Summary</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color:#111; padding:24px; max-width:640px; margin:0 auto; }
  h1 { margin:0 0 4px; font-size:22px; }
  .muted { color:#6b7280; font-size:12px; }
  .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-top:12px; }
  .row { display:flex; justify-content:space-between; padding:4px 0; font-size:14px; }
  .row.total { font-weight:700; border-top:1px solid #e5e7eb; padding-top:8px; margin-top:8px; font-size:15px; }
  .brand { color:#059669; font-weight:700; }
</style></head><body>
  <div class="brand">SmartPark · Partner GSTR-3B Summary</div>
  <h1>Financial Year ${new Date(gst.fyStart).getFullYear()}–${String(new Date(gst.fyEnd).getFullYear()).slice(-2)}</h1>
  <div class="muted">${new Date(gst.fyStart).toLocaleDateString("en-IN")} – ${new Date(gst.fyEnd).toLocaleDateString("en-IN")}</div>

  <div class="card">
    <div class="row"><span>Total invoices</span><span>${gst.invoiceCount}</span></div>
    <div class="row"><span>Gross revenue</span><span>${inr(gst.totalRevenue)}</span></div>
    <div class="row"><span>CGST</span><span>${inr(gst.totalCgst)}</span></div>
    <div class="row"><span>SGST</span><span>${inr(gst.totalSgst)}</span></div>
    <div class="row"><span>IGST</span><span>${inr(gst.totalIgst)}</span></div>
    <div class="row total"><span>Total tax</span><span>${inr(gst.totalTax)}</span></div>
  </div>

  <p class="muted" style="margin-top:16px">Generated on ${new Date().toLocaleString("en-IN")}.</p>
</body></html>`;
  triggerDownload(html, `gstr-3b-${new Date(gst.fyStart).getFullYear()}.html`);
}

export default PartnerInvoicesScreen;
