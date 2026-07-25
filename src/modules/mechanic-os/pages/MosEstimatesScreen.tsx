// Screen: MOS-05 · Primitives: Pricing, Payment, Notification
// Route: /mechanic-os/estimates

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  ThumbsDown,
  X,
} from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  createInvoiceFromEstimate,
  listEstimates,
  updateEstimate,
  type Estimate,
  type EstimateStatus,
} from "@/modules/mechanic-os/lib/mos-store";
import { toast } from "sonner";

const STATUS_TONE: Record<EstimateStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  approved: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Awaiting approval",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

const MosEstimatesScreen = () => {
  const [tick, setTick] = useState(0);
  const estimates = useMemo(() => listEstimates(), [tick]);
  const [selected, setSelected] = useState<Estimate | null>(
    estimates[0] ?? null,
  );

  const refresh = () => {
    const next = listEstimates();
    setSelected((cur) =>
      cur ? next.find((e) => e.id === cur.id) ?? next[0] ?? null : next[0] ?? null,
    );
    setTick((t) => t + 1);
  };

  const send = (e: Estimate) => {
    updateEstimate(e.id, {
      status: "sent",
      sentAt: new Date().toISOString(),
    });
    toast.success(`Estimate sent to ${e.customerName} via SMS (mock)`);
    refresh();
  };

  const simulateApproval = (e: Estimate, approved: boolean) => {
    updateEstimate(e.id, {
      status: approved ? "approved" : "declined",
      respondedAt: new Date().toISOString(),
    });
    toast.message(
      approved
        ? `${e.customerName} approved the estimate`
        : `${e.customerName} declined the estimate`,
    );
    refresh();
  };

  const convertToInvoice = (e: Estimate) => {
    const inv = createInvoiceFromEstimate(e);
    toast.success(`Invoice ${inv.invoiceNumber} generated`);
    refresh();
  };

  return (
    <MechanicOsLayout
      title="Estimates & approvals"
      subtitle="Send an estimate → customer approves via SMS link (mock)"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-body-sm font-bold text-foreground">
              {estimates.length} estimates
            </p>
          </div>
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {estimates.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                  selected?.id === e.id ? "bg-secondary/70" : "hover:bg-secondary/40"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {e.customerName}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {e.vehicleLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-bold text-foreground">
                    ₹{e.total.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-md text-caption font-semibold ${STATUS_TONE[e.status]}`}
                  >
                    {STATUS_LABEL[e.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center">
              <FileText className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-body-sm text-muted-foreground mt-2">
                Select an estimate to preview.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body font-bold text-foreground">
                    {selected.customerName}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {selected.customerPhone} · {selected.vehicleLabel}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-caption font-semibold ${STATUS_TONE[selected.status]}`}
                >
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-border">
                <table className="w-full text-body-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Item</th>
                      <th className="text-right px-3 py-2 font-semibold w-16">Qty</th>
                      <th className="text-right px-3 py-2 font-semibold w-24">Rate</th>
                      <th className="text-right px-3 py-2 font-semibold w-24">Total</th>
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

              <div className="ml-auto max-w-xs space-y-1 text-body-sm">
                <Row label="Subtotal" value={`₹${selected.subtotal.toLocaleString("en-IN")}`} />
                <Row label="GST 18%" value={`₹${selected.tax.toLocaleString("en-IN")}`} />
                <Row label="Total" value={`₹${selected.total.toLocaleString("en-IN")}`} bold />
              </div>

              <div className="flex items-center gap-2 text-caption text-muted-foreground">
                <Clock className="w-3 h-3" />
                Created {new Date(selected.createdAt).toLocaleString()}
                {selected.sentAt &&
                  ` · Sent ${new Date(selected.sentAt).toLocaleString()}`}
                {selected.respondedAt &&
                  ` · Response ${new Date(selected.respondedAt).toLocaleString()}`}
              </div>

              <div className="pt-3 border-t border-border flex flex-wrap gap-2">
                {selected.status === "draft" && (
                  <MobileButton size="sm" onClick={() => send(selected)}>
                    <Send className="w-4 h-4" /> Send to customer
                  </MobileButton>
                )}
                {selected.status === "sent" && (
                  <>
                    <MobileButton
                      size="sm"
                      variant="success"
                      onClick={() => simulateApproval(selected, true)}
                    >
                      <Check className="w-4 h-4" /> Simulate approval
                    </MobileButton>
                    <MobileButton
                      size="sm"
                      variant="outline"
                      onClick={() => simulateApproval(selected, false)}
                    >
                      <ThumbsDown className="w-4 h-4" /> Simulate decline
                    </MobileButton>
                  </>
                )}
                {selected.status === "approved" && (
                  <MobileButton
                    size="sm"
                    variant="success"
                    onClick={() => convertToInvoice(selected)}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Generate invoice
                  </MobileButton>
                )}
                {selected.status === "declined" && (
                  <p className="text-caption text-destructive flex items-center gap-1">
                    <X className="w-3 h-3" /> Customer declined this estimate.
                  </p>
                )}
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

export default MosEstimatesScreen;
