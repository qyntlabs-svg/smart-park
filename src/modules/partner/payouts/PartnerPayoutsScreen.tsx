// Screen: V-17 · Primitives: Payment, Identity
// Route: /partner/payouts

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Wallet,
  CalendarClock,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  AlertTriangle,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  usePayoutAccount,
  usePayouts,
  useRequestManualPayout,
  useUpdatePayoutSchedule,
} from "./hooks";
import {
  PAYOUT_STATUS_LABEL,
  SCHEDULE_LABEL,
  type PayoutSchedule,
} from "./types";

const PartnerPayoutsScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: account, isLoading: loadingAcc, isError: accError } =
    usePayoutAccount(partnerId);
  const { data: payouts = [], isLoading: loadingList } = usePayouts(partnerId);
  const setSchedule = useUpdatePayoutSchedule();
  const requestPayout = useRequestManualPayout();
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");

  const upcoming = payouts.filter(
    (p) => p.status === "pending" || p.status === "in_transit",
  );
  const history = payouts.filter(
    (p) => p.status === "paid" || p.status === "failed",
  );
  const nextPayout = upcoming[0];

  const changeSchedule = async (schedule: PayoutSchedule) => {
    await setSchedule.mutateAsync({ partnerId, schedule });
    toast.success(`Schedule updated to ${SCHEDULE_LABEL[schedule]}`);
  };

  const handleManualRequest = async () => {
    await requestPayout.mutateAsync(partnerId);
    toast.success("Payout requested — expect T+1");
  };

  if (accError) {
    return (
      <PartnerScreenLayout title="Payouts" icon={Wallet}>
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-body-sm text-muted-foreground">
            Could not load payout account. Try again.
          </p>
        </div>
      </PartnerScreenLayout>
    );
  }

  return (
    <PartnerScreenLayout title="Payouts" icon={Wallet}>
      {/* Next payout hero */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-primary/5 border border-primary/20 p-4"
      >
        <p className="text-caption font-bold text-primary uppercase tracking-wider">
          Next payout
        </p>
        {loadingList ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : nextPayout ? (
          <>
            <p className="mt-2 text-heading-md font-bold text-foreground">
              ₹{nextPayout.net.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-2 text-body-sm text-muted-foreground">
              <CalendarClock className="w-4 h-4" />
              ETA{" "}
              {new Date(nextPayout.scheduledFor).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })}
              <span className="text-caption px-2 py-0.5 rounded-full bg-warning/10 text-warning font-semibold">
                {PAYOUT_STATUS_LABEL[nextPayout.status]}
              </span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-body-sm text-muted-foreground">
            No payouts scheduled. Request one below when your balance clears.
          </p>
        )}
        <MobileButton
          size="sm"
          className="mt-4 gap-1.5"
          onClick={handleManualRequest}
          loading={requestPayout.isPending}
          disabled={!account?.verified}
        >
          <ArrowUpRight className="w-4 h-4" /> Request payout now
        </MobileButton>
      </motion.div>

      {/* Bank / UPI account */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-body-sm font-bold text-foreground">Payout method</p>
          {account?.verified && (
            <span className="text-caption px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
        {loadingAcc || !account ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <Row label="UPI VPA" value={account.upiVpa ?? "—"} />
            <Row
              label="Bank"
              value={`${account.bankName ?? "—"} ••${account.bankAccountLast4 ?? "—"}`}
            />
            <Row label="IFSC" value={account.bankIfsc ?? "—"} />
            <Row label="Holder" value={account.holderName ?? "—"} />
            <Row
              label="Min balance"
              value={`₹${account.minBalance.toLocaleString()}`}
            />
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
          <Repeat className="w-4 h-4 text-primary" /> Payout schedule
        </p>
        <div className="mt-3 space-y-2">
          {(Object.keys(SCHEDULE_LABEL) as PayoutSchedule[]).map((s) => (
            <button
              key={s}
              onClick={() => changeSchedule(s)}
              disabled={setSchedule.isPending}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left ${
                account?.schedule === s
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <span className="text-body-sm font-semibold text-foreground">
                {SCHEDULE_LABEL[s]}
              </span>
              {account?.schedule === s && (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Statement tabs */}
      <div className="flex bg-secondary rounded-xl p-1">
        {(["upcoming", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all capitalize ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground"
            }`}
          >
            {t === "upcoming"
              ? `Upcoming (${upcoming.length})`
              : `History (${history.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loadingList ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (tab === "upcoming" ? upcoming : history).length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <Banknote className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-body-sm text-muted-foreground">
              {tab === "upcoming"
                ? "No payouts in flight"
                : "No completed payouts yet"}
            </p>
          </div>
        ) : (
          (tab === "upcoming" ? upcoming : history).map((p) => (
            <div
              key={p.id}
              className="p-3 bg-card border border-border rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-body-sm font-bold text-foreground">
                    ₹{p.net.toLocaleString()}
                    <span className="text-caption text-muted-foreground font-normal ml-1">
                      net (₹{p.fee} fee)
                    </span>
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {new Date(p.periodStart).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(p.periodEnd).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={p.status} />
                  <p className="text-caption text-muted-foreground mt-0.5">
                    {p.reference}
                  </p>
                </div>
              </div>
              {p.failureReason && (
                <p className="mt-2 text-caption text-destructive">
                  {p.failureReason}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </PartnerScreenLayout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-body-sm text-muted-foreground">{label}</span>
    <span className="text-body-sm font-semibold text-foreground truncate ml-2 max-w-[60%]">
      {value}
    </span>
  </div>
);

const StatusBadge = ({ status }: { status: keyof typeof PAYOUT_STATUS_LABEL }) => {
  const map: Record<string, string> = {
    paid: "bg-success/10 text-success",
    in_transit: "bg-primary/10 text-primary",
    pending: "bg-warning/10 text-warning",
    failed: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}
    >
      {PAYOUT_STATUS_LABEL[status]}
    </span>
  );
};

export default PartnerPayoutsScreen;
