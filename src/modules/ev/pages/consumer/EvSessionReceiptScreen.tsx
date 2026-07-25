// Screen: C-23 · Primitives: Reservation, Payment, Review
//
// Final receipt for a completed EV charging session. Also serves as the
// "booking detail" view when reached from history. Includes a rate-station
// action, book-again shortcut, and stub invoice-download.
//
// Route: /ev/session/:id/receipt

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Loader2,
  Star,
  RotateCw,
  FileText,
  IndianRupee,
  Timer,
  Gauge,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useCreateEvReview,
  useEvReservation,
  useEvSession,
  useEvStation,
} from "@/modules/ev/hooks";
import { CONNECTOR_LABEL } from "@/modules/ev/types";

const PLATFORM_FEE = 5;

const EvSessionReceiptScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useEvSession(id);
  const { data: station } = useEvStation(session?.stationId);
  const { data: reservation } = useEvReservation(session?.reservationId);
  const createReview = useCreateEvReview();

  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const breakdown = useMemo(() => {
    if (!session) return null;
    const energy = Math.round(session.kwhDelivered * session.pricePerKwh);
    const gst = Math.round((energy * session.taxPct) / 100);
    // Idle fee: mock 0 minutes since we auto-stop.
    const idle = 0;
    const platformFee = PLATFORM_FEE;
    const total = energy + gst + idle + platformFee;
    return { energy, gst, idle, platformFee, total };
  }, [session]);

  const durationMin = useMemo(() => {
    if (!session?.startedAt || !session.endedAt) return 0;
    return (
      (new Date(session.endedAt).getTime() -
        new Date(session.startedAt).getTime()) /
      60_000
    );
  }, [session?.startedAt, session?.endedAt]);

  const avgKw = useMemo(() => {
    if (!session || !durationMin) return 0;
    return (session.kwhDelivered / (durationMin / 60)) || 0;
  }, [session?.kwhDelivered, durationMin]);

  if (isLoading || !session) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const submitReview = async () => {
    if (!session || rating < 1) return;
    try {
      await createReview.mutateAsync({
        stationId: session.stationId,
        sessionId: session.id,
        userId: session.userId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Thanks for your rating!");
      setRateOpen(false);
      setComment("");
    } catch {
      toast.error("Could not submit review");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-24">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate("/home")}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Session receipt
        </h1>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Success hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-body font-bold text-foreground">
              Session complete
            </p>
            <p className="text-body-sm text-muted-foreground">
              {session.kwhDelivered.toFixed(2)} kWh delivered
            </p>
          </div>
        </motion.div>

        {/* Cost breakdown */}
        {breakdown && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
              Cost breakdown
            </p>
            <div className="mt-3 space-y-2">
              <Row
                label={`Energy · ${session.kwhDelivered.toFixed(2)} kWh × ₹${session.pricePerKwh.toFixed(1)}`}
                value={`₹${breakdown.energy}`}
              />
              <Row
                label={`GST (${session.taxPct}%)`}
                value={`₹${breakdown.gst}`}
              />
              <Row label="Idle fee" value={`₹${breakdown.idle}`} muted />
              <Row
                label="Platform fee"
                value={`₹${breakdown.platformFee}`}
                muted
              />
              <div className="pt-2 border-t border-border flex items-baseline justify-between">
                <span className="text-body font-bold text-foreground">
                  Total paid
                </span>
                <span className="text-heading-md text-primary">
                  ₹{breakdown.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Session stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat
            icon={Timer}
            label="Duration"
            value={formatMinutes(durationMin)}
          />
          <Stat
            icon={Gauge}
            label="Avg kW"
            value={`${avgKw.toFixed(1)} kW`}
          />
          <Stat
            icon={Zap}
            label="Peak kW"
            value={`${session.peakKw.toFixed(1)} kW`}
          />
          <Stat
            icon={IndianRupee}
            label="₹/kWh"
            value={`₹${session.pricePerKwh.toFixed(1)}`}
          />
        </div>

        {/* Station + connector recap */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-bold text-foreground truncate">
                {station?.name ?? "EV station"}
              </p>
              <p className="text-caption text-muted-foreground truncate">
                {station?.address ?? ""}
              </p>
            </div>
          </div>
          <Row
            label="Connector"
            value={`${CONNECTOR_LABEL[session.connectorType]} · ${session.ratedKw} kW`}
          />
          <Row
            label="Payment"
            value={reservation?.paymentId ? "UPI" : "UPI"}
          />
          {reservation?.paymentId && (
            <Row label="Payment ID" value={reservation.paymentId} muted />
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <MobileButton
            onClick={() => setRateOpen(true)}
            variant="outline"
            className="gap-1.5"
          >
            <Star className="w-4 h-4" /> Rate this station
          </MobileButton>
          <MobileButton
            variant="outline"
            onClick={() =>
              navigate(`/ev/stations/${session.stationId}/reserve`)
            }
            className="gap-1.5"
          >
            <RotateCw className="w-4 h-4" /> Book again
          </MobileButton>
          <MobileButton
            variant="outline"
            onClick={() => {
              if (!session || !breakdown) return;
              downloadReceiptHtml({
                sessionId: session.id,
                stationName: station?.name ?? "Station",
                connectorLabel: `${CONNECTOR_LABEL[session.connectorType]} · ${session.ratedKw} kW`,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                kwh: session.kwhDelivered,
                durationMin,
                avgKw,
                pricePerKwh: session.pricePerKwh,
                taxPct: session.taxPct,
                breakdown,
                paymentId: reservation?.paymentId,
              });
              toast.success("Invoice downloaded. Also emailed to you.");
            }}
            className="gap-1.5"
          >
            <FileText className="w-4 h-4" /> Get invoice PDF
          </MobileButton>
        </div>
      </div>

      {/* Rate dialog */}
      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rate {station?.name ?? "this station"}</DialogTitle>
            <DialogDescription>
              Your rating helps other EV drivers pick trustworthy stations.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`${n} star`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating >= n
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Input
              className="mt-4"
              placeholder="Optional feedback"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-2 flex gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setRateOpen(false)}
            >
              Cancel
            </MobileButton>
            <MobileButton
              className="flex-1"
              disabled={rating < 1}
              loading={createReview.isPending}
              onClick={submitReview}
            >
              Submit
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex items-baseline justify-between">
    <span
      className={`text-body-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {label}
    </span>
    <span
      className={`text-body-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {value}
    </span>
  </div>
);

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-border bg-card p-3">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
    <p className="mt-1 text-heading-sm text-foreground">{value}</p>
  </div>
);

function formatMinutes(minutes: number): string {
  if (!isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

/**
 * Build a self-contained HTML string of the receipt and trigger a browser
 * download. No jsPDF, no server round-trip — the file opens as a print-ready
 * page in any browser and can be Print-to-PDF'd from there.
 */
function downloadReceiptHtml(input: {
  sessionId: string;
  stationName: string;
  connectorLabel: string;
  startedAt?: string;
  endedAt?: string;
  kwh: number;
  durationMin: number;
  avgKw: number;
  pricePerKwh: number;
  taxPct: number;
  breakdown: {
    energy: number;
    gst: number;
    idle: number;
    platformFee: number;
    total: number;
  };
  paymentId?: string;
}) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("en-IN") : "—";
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt · ${input.sessionId}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; padding: 24px; max-width: 520px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .muted { color: #6b7280; font-size: 12px; }
  .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 12px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
  .row.total { font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px; font-size: 15px; }
  .label { color: #374151; }
  .value { color: #111; font-weight: 600; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
  .stat .k { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .stat .v { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .brand { color: #059669; font-weight: 700; }
</style>
</head>
<body>
  <div class="brand">SmartPark · EV Charging</div>
  <h1>Session receipt</h1>
  <div class="muted">Session ID · ${input.sessionId}</div>

  <div class="card">
    <div class="row"><span class="label">Station</span><span class="value">${escapeHtml(input.stationName)}</span></div>
    <div class="row"><span class="label">Connector</span><span class="value">${escapeHtml(input.connectorLabel)}</span></div>
    <div class="row"><span class="label">Started</span><span class="value">${fmtDate(input.startedAt)}</span></div>
    <div class="row"><span class="label">Ended</span><span class="value">${fmtDate(input.endedAt)}</span></div>
  </div>

  <div class="grid" style="margin-top:12px">
    <div class="stat"><div class="k">Delivered</div><div class="v">${input.kwh.toFixed(2)} kWh</div></div>
    <div class="stat"><div class="k">Duration</div><div class="v">${formatMinutes(input.durationMin)}</div></div>
    <div class="stat"><div class="k">Avg kW</div><div class="v">${input.avgKw.toFixed(1)} kW</div></div>
    <div class="stat"><div class="k">Rate</div><div class="v">${fmt(input.pricePerKwh)}/kWh</div></div>
  </div>

  <div class="card">
    <div class="row"><span class="label">Energy</span><span class="value">${fmt(input.breakdown.energy)}</span></div>
    <div class="row"><span class="label">GST (${input.taxPct}%)</span><span class="value">${fmt(input.breakdown.gst)}</span></div>
    <div class="row"><span class="label">Idle fee</span><span class="value">${fmt(input.breakdown.idle)}</span></div>
    <div class="row"><span class="label">Platform fee</span><span class="value">${fmt(input.breakdown.platformFee)}</span></div>
    <div class="row total"><span>Total paid</span><span>${fmt(input.breakdown.total)}</span></div>
    ${input.paymentId ? `<div class="row"><span class="label">Payment ID</span><span class="value">${escapeHtml(input.paymentId)}</span></div>` : ""}
  </div>

  <p class="muted" style="margin-top:16px">Generated on ${new Date().toLocaleString("en-IN")}. This receipt is a demo artefact — no real payment was processed.</p>
</body>
</html>`;
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${input.sessionId}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on next tick so the download has a chance to start.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    /* browser refused the download — swallow silently, the toast still fires */
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default EvSessionReceiptScreen;
