// Screen: V-19 · Primitives: Review, Payment, Reservation
// Route: /partner/disputes

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertOctagon,
  Loader2,
  Send,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useDisputes,
  useResolveDispute,
  useRespondToDispute,
} from "./hooks";
import {
  DISPUTE_REASON_LABEL,
  DISPUTE_STATUS_LABEL,
  type Dispute,
  type DisputeStatus,
} from "./types";

const TABS: { key: "active" | "resolved"; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
];

const isActive = (s: DisputeStatus) =>
  s === "open" || s === "awaiting_vendor" || s === "under_review";

const PartnerDisputesScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: disputes = [], isLoading, isError } = useDisputes(partnerId);
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const respond = useRespondToDispute();
  const resolve = useResolveDispute();

  const filtered = useMemo(
    () =>
      disputes.filter((d) =>
        tab === "active" ? isActive(d.status) : !isActive(d.status),
      ),
    [disputes, tab],
  );

  const sendReply = async (d: Dispute) => {
    if (!reply.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    await respond.mutateAsync({
      partnerId,
      disputeId: d.id,
      text: reply.trim(),
    });
    toast.success("Reply sent");
    setReply("");
  };

  const handleResolve = async (d: Dispute, outcome: "refund" | "deny") => {
    const ok = window.confirm(
      outcome === "refund"
        ? `Approve refund of ₹${d.amount} to ${d.consumerName}?`
        : `Deny refund for ${d.consumerName}?`,
    );
    if (!ok) return;
    await resolve.mutateAsync({
      partnerId,
      disputeId: d.id,
      outcome,
    });
    toast.success(outcome === "refund" ? "Refund approved" : "Dispute denied");
  };

  return (
    <PartnerScreenLayout title="Disputes" icon={AlertOctagon}>
      <div className="flex bg-secondary rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground"
            }`}
          >
            {t.label} (
            {
              disputes.filter((d) =>
                t.key === "active" ? isActive(d.status) : !isActive(d.status),
              ).length
            }
            )
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-body-sm text-destructive">
          Couldn't load disputes
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 text-center">
          <MessageCircle className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            {tab === "active" ? "No open disputes 🎉" : "No resolved disputes yet"}
          </p>
        </div>
      ) : (
        filtered.map((d) => (
          <motion.div
            layout
            key={d.id}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedId((prev) => (prev === d.id ? null : d.id))
              }
              className="w-full text-left p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {d.consumerName} · {d.bookingRef}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(d.openedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {DISPUTE_REASON_LABEL[d.reason]}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body-sm font-bold text-foreground">
                    ₹{d.amount}
                  </p>
                  <StatusPill status={d.status} />
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    expandedId === d.id ? "rotate-90" : ""
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {expandedId === d.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border bg-secondary/40"
                >
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      {d.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl max-w-[85%] ${
                            m.from === "vendor"
                              ? "bg-primary/10 ml-auto"
                              : m.from === "consumer"
                                ? "bg-card border border-border"
                                : "bg-warning/10"
                          }`}
                        >
                          <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                            {m.from}
                          </p>
                          <p className="text-body-sm text-foreground mt-1">
                            {m.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    {isActive(d.status) && (
                      <>
                        <div className="flex gap-2">
                          <input
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Reply to consumer..."
                            className="flex-1 h-11 px-3 rounded-xl border border-border bg-card text-body-sm"
                          />
                          <button
                            onClick={() => sendReply(d)}
                            disabled={respond.isPending}
                            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                          >
                            {respond.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <MobileButton
                            variant="success"
                            size="sm"
                            className="flex-1 gap-1.5"
                            loading={resolve.isPending}
                            onClick={() => handleResolve(d, "refund")}
                          >
                            <ThumbsUp className="w-4 h-4" /> Approve refund
                          </MobileButton>
                          <MobileButton
                            variant="destructive"
                            size="sm"
                            className="flex-1 gap-1.5"
                            loading={resolve.isPending}
                            onClick={() => handleResolve(d, "deny")}
                          >
                            <ThumbsDown className="w-4 h-4" /> Deny
                          </MobileButton>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))
      )}
    </PartnerScreenLayout>
  );
};

const StatusPill = ({ status }: { status: DisputeStatus }) => {
  const map: Record<DisputeStatus, string> = {
    open: "bg-destructive/10 text-destructive",
    awaiting_vendor: "bg-warning/10 text-warning",
    under_review: "bg-primary/10 text-primary",
    resolved_refunded: "bg-success/10 text-success",
    resolved_denied: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`text-caption font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${map[status]}`}
    >
      {DISPUTE_STATUS_LABEL[status]}
    </span>
  );
};

export default PartnerDisputesScreen;
