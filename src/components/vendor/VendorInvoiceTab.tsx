import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, Eye, IndianRupee, Calendar,
  Building2, Hash, Receipt, ChevronDown, ChevronUp
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

// Mock invoice data — will come from DB once Cloud is enabled
const MOCK_INVOICES: PlatformInvoice[] = [
  {
    id: "INV-2026-03-001",
    invoiceDate: "2026-03-01",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    grossRevenue: 48400,
    commissionRate: 10,
    commissionAmount: 4840,
    gstOnCommission: 871.2, // 18% GST on commission
    tdsDeducted: 484, // 2% TDS u/s 194H
    netPayable: 43076, // gross - commission - tds (GST is included in commission)
    totalSessions: 412,
    status: "paid",
    paymentDate: "2026-03-05",
    transactionRef: "UTR2026030500123",
  },
  {
    id: "INV-2026-02-001",
    invoiceDate: "2026-02-01",
    periodStart: "2026-01-01",
    periodEnd: "2026-01-31",
    grossRevenue: 52200,
    commissionRate: 10,
    commissionAmount: 5220,
    gstOnCommission: 939.6,
    tdsDeducted: 522,
    netPayable: 46458,
    totalSessions: 445,
    status: "paid",
    paymentDate: "2026-02-04",
    transactionRef: "UTR2026020400098",
  },
  {
    id: "INV-2026-04-001",
    invoiceDate: "2026-04-01",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    grossRevenue: 19800,
    commissionRate: 10,
    commissionAmount: 1980,
    gstOnCommission: 356.4,
    tdsDeducted: 198,
    netPayable: 17622,
    totalSessions: 168,
    status: "pending",
  },
];

type PlatformInvoice = {
  id: string;
  invoiceDate: string;
  periodStart: string;
  periodEnd: string;
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  gstOnCommission: number;
  tdsDeducted: number;
  netPayable: number;
  totalSessions: number;
  status: "paid" | "pending" | "overdue";
  paymentDate?: string;
  transactionRef?: string;
};

const PLATFORM_DETAILS = {
  name: "ParkIt Technologies Pvt. Ltd.",
  gstin: "29AABCT1332L1ZT", // Example GSTIN
  pan: "AABCT1332L",
  address: "No. 42, MG Road, Bengaluru, Karnataka 560001",
  sac: "996812", // SAC for parking services
  cin: "U74999KA2025PTC123456",
};

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const formatPeriod = (start: string, end: string) =>
  `${new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;

const StatusBadge = ({ status }: { status: PlatformInvoice["status"] }) => {
  const styles = {
    paid: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    overdue: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

const InvoiceDetailView = ({ invoice, onClose }: { invoice: PlatformInvoice; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="space-y-4"
  >
    {/* Invoice Header */}
    <div className="p-5 bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">Tax Invoice</span>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="space-y-1 text-caption text-muted-foreground mb-4">
        <p className="text-body-sm font-bold text-foreground">{PLATFORM_DETAILS.name}</p>
        <p>GSTIN: {PLATFORM_DETAILS.gstin}</p>
        <p>PAN: {PLATFORM_DETAILS.pan}</p>
        <p>CIN: {PLATFORM_DETAILS.cin}</p>
        <p>{PLATFORM_DETAILS.address}</p>
      </div>

      <div className="h-px bg-border my-3" />

      <div className="grid grid-cols-2 gap-3 text-caption">
        <div>
          <p className="text-muted-foreground">Invoice No.</p>
          <p className="font-bold text-foreground">{invoice.id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Invoice Date</p>
          <p className="font-bold text-foreground">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Billing Period</p>
          <p className="font-bold text-foreground">{formatPeriod(invoice.periodStart, invoice.periodEnd)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">SAC Code</p>
          <p className="font-bold text-foreground">{PLATFORM_DETAILS.sac}</p>
        </div>
      </div>
    </div>

    {/* Line Items */}
    <div className="p-5 bg-card border border-border rounded-2xl">
      <p className="text-body-sm font-bold text-foreground mb-3">Commission Breakdown</p>

      <div className="space-y-2.5">
        <div className="flex justify-between text-caption">
          <span className="text-muted-foreground">Gross Booking Revenue ({invoice.totalSessions} sessions)</span>
          <span className="font-semibold text-foreground">{formatCurrency(invoice.grossRevenue)}</span>
        </div>

        <div className="h-px bg-border" />

        <div className="flex justify-between text-caption">
          <span className="text-muted-foreground">Platform Commission @ {invoice.commissionRate}%</span>
          <span className="font-semibold text-destructive">− {formatCurrency(invoice.commissionAmount)}</span>
        </div>

        <div className="flex justify-between text-caption pl-3">
          <span className="text-muted-foreground">CGST @ 9% on Commission</span>
          <span className="text-muted-foreground">(₹{(invoice.gstOnCommission / 2).toFixed(2)})</span>
        </div>
        <div className="flex justify-between text-caption pl-3">
          <span className="text-muted-foreground">SGST @ 9% on Commission</span>
          <span className="text-muted-foreground">(₹{(invoice.gstOnCommission / 2).toFixed(2)})</span>
        </div>
        <div className="flex justify-between text-caption pl-3">
          <span className="text-muted-foreground">Total GST (18%) on Commission</span>
          <span className="text-muted-foreground">Included in commission</span>
        </div>

        <div className="h-px bg-border" />

        <div className="flex justify-between text-caption">
          <span className="text-muted-foreground">TDS Deducted u/s 194H @ 2%</span>
          <span className="font-semibold text-destructive">− {formatCurrency(invoice.tdsDeducted)}</span>
        </div>

        <div className="h-px bg-border" />

        <div className="flex justify-between text-body-sm pt-1">
          <span className="font-bold text-foreground">Net Payable to Vendor</span>
          <span className="font-bold text-success">{formatCurrency(invoice.netPayable)}</span>
        </div>
      </div>
    </div>

    {/* Payment Info */}
    {invoice.status === "paid" && invoice.transactionRef && (
      <div className="p-4 bg-success/5 border border-success/20 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <IndianRupee className="w-4 h-4 text-success" />
          <span className="text-caption font-bold text-success">Payment Settled</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-caption">
          <div>
            <p className="text-muted-foreground">Settlement Date</p>
            <p className="font-semibold text-foreground">{formatDate(invoice.paymentDate!)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">UTR / Ref</p>
            <p className="font-semibold text-foreground text-[11px]">{invoice.transactionRef}</p>
          </div>
        </div>
      </div>
    )}

    {/* Legal Note */}
    <div className="p-3 bg-secondary rounded-xl">
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        This is a computer-generated invoice and does not require a physical signature.
        Subject to terms of the ParkIt Vendor Agreement. GST is applicable on platform
        commission as per GST Act, 2017. TDS is deducted at source under Section 194H
        of the Income Tax Act, 1961. For disputes, contact vendor-support@parkit.in
        within 30 days of invoice date.
      </p>
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <MobileButton fullWidth variant="outline" onClick={onClose}>
        Back
      </MobileButton>
      <MobileButton fullWidth variant="default" className="gap-2">
        <Download className="w-4 h-4" /> Download PDF
      </MobileButton>
    </div>
  </motion.div>
);

const VendorInvoiceTab = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);
  const [showSummary, setShowSummary] = useState(true);

  if (selectedInvoice) {
    return <InvoiceDetailView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />;
  }

  const totalCommission = MOCK_INVOICES.reduce((s, i) => s + i.commissionAmount, 0);
  const totalTds = MOCK_INVOICES.reduce((s, i) => s + i.tdsDeducted, 0);
  const totalPaid = MOCK_INVOICES.filter((i) => i.status === "paid").reduce((s, i) => s + i.netPayable, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Fiscal Summary */}
      <button
        onClick={() => setShowSummary(!showSummary)}
        className="w-full p-4 bg-card border border-border rounded-2xl text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-body-sm font-bold text-foreground">Fiscal Summary (FY 2025-26)</span>
          </div>
          {showSummary ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        {showSummary && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="mt-3 space-y-2">
            {[
              { label: "Total Commission Paid", value: formatCurrency(totalCommission), color: "text-destructive" },
              { label: "Total TDS Deducted", value: formatCurrency(totalTds), color: "text-warning" },
              { label: "Total Net Received", value: formatCurrency(totalPaid), color: "text-success" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-caption">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1">
              TDS certificates (Form 16A) available for download quarterly.
            </p>
          </motion.div>
        )}
      </button>

      {/* Invoice List */}
      <div className="flex items-center justify-between">
        <span className="text-caption font-semibold text-muted-foreground">All Invoices</span>
        <button className="flex items-center gap-1 text-caption text-primary font-semibold">
          <Download className="w-3.5 h-3.5" /> Export All
        </button>
      </div>

      {MOCK_INVOICES.map((inv, i) => (
        <motion.button
          key={inv.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => setSelectedInvoice(inv)}
          className="w-full p-4 bg-card border border-border rounded-2xl text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-body-sm font-bold text-foreground">{inv.id}</p>
                <StatusBadge status={inv.status} />
              </div>
              <p className="text-caption text-muted-foreground">
                {formatPeriod(inv.periodStart, inv.periodEnd)} · {inv.totalSessions} sessions
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-caption text-muted-foreground line-through">
                {formatCurrency(inv.commissionAmount)}
              </p>
              <p className="text-body-sm font-bold text-success">{formatCurrency(inv.netPayable)}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default VendorInvoiceTab;
