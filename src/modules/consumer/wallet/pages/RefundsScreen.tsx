// Screen: C-25 · Primitives: Payment, Reservation
//
// List past refund requests + status. "Raise new" opens a bottom sheet with a
// reason picker; links a booking ref (mock — from route state or freeform).
//
// Route: /refunds

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Plus,
  ReceiptText,
  Clock3,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import {
  useCreateRefundRequest,
  useRefundRequests,
} from "@/modules/consumer/wallet/hooks";
import {
  REFUND_REASON_LABEL,
  REFUND_STATUS_LABEL,
  type RefundReason,
  type RefundRequest,
  type RefundStatus,
} from "@/modules/consumer/wallet/types";

const RefundsScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";
  const routeState = useLocation().state as
    | { bookingRef?: string; bookingTitle?: string; amount?: number }
    | undefined;

  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [newOpen, setNewOpen] = useState(!!routeState?.bookingRef);

  const { data: refunds = [], isLoading, isError, refetch } = useRefundRequests(
    userId,
  );

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-32">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Refunds & disputes
        </h1>
      </header>

      <div className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : refunds.length === 0 ? (
          <EmptyState onNew={() => setNewOpen(true)} />
        ) : (
          <div className="space-y-2">
            {refunds.map((r, i) => (
              <RefundRow
                key={r.id}
                request={r}
                index={i}
                onClick={() => setSelected(r)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          onClick={() => setNewOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Raise new refund
        </MobileButton>
      </div>

      {/* New request sheet */}
      <BottomSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        snapPoints={[0.9]}
      >
        <NewRefundForm
          userId={userId}
          defaults={{
            bookingRef: routeState?.bookingRef ?? "",
            bookingTitle: routeState?.bookingTitle ?? "",
            amount: routeState?.amount,
          }}
          onClose={() => setNewOpen(false)}
        />
      </BottomSheet>

      {/* Detail sheet */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        snapPoints={[0.85]}
      >
        {selected && (
          <RefundDetail request={selected} onClose={() => setSelected(null)} />
        )}
      </BottomSheet>
    </div>
  );
};

// ---------- Sub-components ----------

const EmptyState = ({ onNew }: { onNew: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-dashed border-border p-6 text-center"
  >
    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
      <ReceiptText className="w-7 h-7 text-primary" />
    </div>
    <p className="mt-3 text-body font-bold text-foreground">
      No refund requests yet
    </p>
    <p className="mt-1 text-body-sm text-muted-foreground">
      If a session went wrong, raise a request and we'll investigate.
    </p>
    <MobileButton className="mt-4" onClick={onNew}>
      Raise your first request
    </MobileButton>
  </motion.div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
    <p className="text-body-sm font-semibold text-destructive">
      Couldn't load refund requests
    </p>
    <MobileButton
      variant="outline"
      size="sm"
      className="mt-3"
      onClick={onRetry}
    >
      Try again
    </MobileButton>
  </div>
);

const RefundRow = ({
  request,
  index,
  onClick,
}: {
  request: RefundRequest;
  index: number;
  onClick: () => void;
}) => {
  const { icon: Icon, tone } = statusMeta(request.status);
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl border border-border bg-card"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone.bg}`}>
          <Icon className={`w-5 h-5 ${tone.fg}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-body-sm font-bold text-foreground truncate">
              {request.bookingTitle || "Refund request"}
            </p>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
          <p className="text-caption text-muted-foreground mt-0.5">
            {REFUND_REASON_LABEL[request.reason]}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`text-caption font-bold px-2 py-0.5 rounded-full ${tone.bg} ${tone.fg}`}
            >
              {REFUND_STATUS_LABEL[request.status]}
            </span>
            <span className="text-body-sm font-bold text-foreground">
              ₹{request.amount}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

const RefundDetail = ({
  request,
  onClose,
}: {
  request: RefundRequest;
  onClose: () => void;
}) => (
  <div className="pt-2 pb-6">
    <p className="text-heading-sm text-foreground">
      {request.bookingTitle || "Refund request"}
    </p>
    <p className="text-caption text-muted-foreground mt-1">
      Ref {request.bookingRef.slice(-8).toUpperCase()} · ₹{request.amount}
    </p>

    <div className="mt-4 rounded-2xl border border-border bg-card p-4 space-y-2">
      <MetaRow label="Reason" value={REFUND_REASON_LABEL[request.reason]} />
      <MetaRow label="Status" value={REFUND_STATUS_LABEL[request.status]} />
      <MetaRow
        label="Filed"
        value={new Date(request.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      />
      {request.detail && (
        <div>
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mt-2">
            Your note
          </p>
          <p className="text-body-sm text-foreground mt-1">{request.detail}</p>
        </div>
      )}
    </div>

    <div className="mt-4">
      <p className="text-body-sm font-bold text-foreground">Timeline</p>
      <div className="mt-2 space-y-3">
        {request.timeline.map((e, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <div>
              <p className="text-body-sm font-semibold text-foreground">
                {REFUND_STATUS_LABEL[e.status]}
              </p>
              {e.note && (
                <p className="text-caption text-muted-foreground">{e.note}</p>
              )}
              <p className="text-caption text-muted-foreground/70 mt-0.5">
                {new Date(e.at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <MobileButton fullWidth variant="outline" className="mt-6" onClick={onClose}>
      Close
    </MobileButton>
  </div>
);

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-body-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-semibold">{value}</span>
  </div>
);

// ---------- New refund form ----------

const NewRefundForm = ({
  userId,
  defaults,
  onClose,
}: {
  userId: string;
  defaults: { bookingRef: string; bookingTitle: string; amount?: number };
  onClose: () => void;
}) => {
  const [bookingRef, setBookingRef] = useState(defaults.bookingRef);
  const [bookingTitle, setBookingTitle] = useState(defaults.bookingTitle);
  const [amount, setAmount] = useState(
    defaults.amount ? String(defaults.amount) : "",
  );
  const [reason, setReason] = useState<RefundReason>("service_not_delivered");
  const [detail, setDetail] = useState("");
  const create = useCreateRefundRequest();

  const amountNum = parseInt(amount, 10);
  const valid = bookingRef.length > 0 && amountNum > 0;

  const submit = async () => {
    if (!valid) return;
    try {
      await create.mutateAsync({
        userId,
        bookingRef,
        bookingTitle,
        amount: amountNum,
        reason,
        detail: detail.trim() || undefined,
      });
      toast.success("Refund request submitted");
      onClose();
    } catch {
      toast.error("Could not submit refund");
    }
  };

  return (
    <div className="pt-2 pb-6">
      <p className="text-heading-sm text-foreground">Raise refund request</p>
      <p className="text-caption text-muted-foreground mt-1">
        We investigate within 48 hours. You'll be notified at each step.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="Booking reference">
          <input
            value={bookingRef}
            onChange={(e) => setBookingRef(e.target.value)}
            placeholder="e.g. AD12345 or ev-session-…"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
        <Field label="Booking title">
          <input
            value={bookingTitle}
            onChange={(e) => setBookingTitle(e.target.value)}
            placeholder="T Nagar · 25 Oct"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
        <Field label="Amount (₹)">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="0"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
        <Field label="Reason">
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(REFUND_REASON_LABEL) as RefundReason[]).map((k) => (
              <button
                key={k}
                onClick={() => setReason(k)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left text-body-sm ${
                  reason === k
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <span>{REFUND_REASON_LABEL[k]}</span>
                {reason === k && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Detail (optional)">
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="Anything else we should know?"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-body-sm resize-none"
          />
        </Field>
      </div>

      <MobileButton
        fullWidth
        className="mt-6"
        disabled={!valid}
        loading={create.isPending}
        onClick={submit}
      >
        Submit request
      </MobileButton>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
    <div className="mt-1">{children}</div>
  </div>
);

function statusMeta(status: RefundStatus): {
  icon: React.ComponentType<{ className?: string }>;
  tone: { bg: string; fg: string };
} {
  switch (status) {
    case "submitted":
    case "under_review":
      return {
        icon: Clock3,
        tone: { bg: "bg-warning/10", fg: "text-warning" },
      };
    case "approved":
    case "refunded":
      return {
        icon: CheckCircle2,
        tone: { bg: "bg-emerald-500/10", fg: "text-emerald-600" },
      };
    case "rejected":
      return {
        icon: XCircle,
        tone: { bg: "bg-destructive/10", fg: "text-destructive" },
      };
  }
}

export default RefundsScreen;
