// Screen: A-06 · Primitives: Payment, Review
// Route: /admin/disputes

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import { useAuthStore } from "@/store/auth.store";
import { useAdminDisputes, useResolveAdminDispute } from "./hooks";
import type { AdminDispute, AdminDisputeStatus } from "./types";

const AdminDisputesScreen = () => {
  const reviewer = useAuthStore((s) => s.user?.name ?? s.user?.id ?? "admin");
  const [status, setStatus] = useState<AdminDisputeStatus | "all">("open");
  const { data: allDisputes = [], isLoading, isError } = useAdminDisputes(
    status === "all" ? undefined : status,
  );
  const resolve = useResolveAdminDispute();
  const [modal, setModal] = useState<{
    dispute: AdminDispute;
    outcome: "refund" | "deny";
    note: string;
  } | null>(null);

  const openBreached = useMemo(
    () => allDisputes.filter((d) => d.slaBreached).length,
    [allDisputes],
  );

  const submit = async () => {
    if (!modal) return;
    if (!modal.note.trim()) {
      toast.error("Resolution note required");
      return;
    }
    await resolve.mutateAsync({
      id: modal.dispute.id,
      reviewer,
      outcome: modal.outcome,
      note: modal.note.trim(),
    });
    toast.success(
      modal.outcome === "refund" ? "Refund approved" : "Refund denied",
    );
    setModal(null);
  };

  return (
    <AdminLayout
      title="Disputes & Refunds"
      subtitle="Cross-provider dispute queue with resolution actions"
    >
      {openBreached > 0 && (
        <div className="mb-4 p-3 rounded-2xl border border-destructive/30 bg-destructive/10 text-body-sm text-destructive flex items-center gap-2">
          <Timer className="w-4 h-4" />
          {openBreached} dispute{openBreached > 1 ? "s" : ""} past SLA — resolve immediately
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["open", "under_review", "resolved_refunded", "resolved_denied", "all"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-caption font-semibold border capitalize ${
                status === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ),
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-body-sm text-destructive">Couldn't load disputes</div>
      ) : allDisputes.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 rounded-2xl border border-dashed border-border">
          <AlertOctagon className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            No disputes in this bucket 🎉
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {allDisputes.map((d) => (
            <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {d.ref} · {d.reason}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {d.consumerName} → {d.providerName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body-sm font-bold text-foreground">
                    ₹{d.amount.toLocaleString()}
                  </p>
                  <StatusBadge status={d.status} slaBreached={d.slaBreached} />
                </div>
              </div>

              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                {d.transcript.map((t, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-caption ${
                      t.from === "admin"
                        ? "bg-warning/10 text-warning-foreground border border-warning/20"
                        : t.from === "vendor"
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-secondary"
                    }`}
                  >
                    <p className="font-bold uppercase tracking-wider text-[10px]">
                      {t.from}
                    </p>
                    <p className="text-foreground mt-0.5">{t.text}</p>
                  </div>
                ))}
              </div>

              {(d.status === "open" || d.status === "under_review") && (
                <div className="mt-3 flex gap-2">
                  <MobileButton
                    size="sm"
                    variant="success"
                    className="flex-1 gap-1.5"
                    onClick={() =>
                      setModal({ dispute: d, outcome: "refund", note: "" })
                    }
                  >
                    <ThumbsUp className="w-4 h-4" /> Refund
                  </MobileButton>
                  <MobileButton
                    size="sm"
                    variant="destructive"
                    className="flex-1 gap-1.5"
                    onClick={() =>
                      setModal({ dispute: d, outcome: "deny", note: "" })
                    }
                  >
                    <ThumbsDown className="w-4 h-4" /> Deny
                  </MobileButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {modal?.outcome === "refund" ? "Approve refund" : "Deny refund"}
            </DialogTitle>
            <DialogDescription>
              {modal?.outcome === "refund"
                ? `Refund ₹${modal.dispute.amount.toLocaleString()} to ${modal.dispute.consumerName}?`
                : `Deny ${modal?.dispute.consumerName}'s refund request?`}
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={modal?.note ?? ""}
            onChange={(e) =>
              modal && setModal({ ...modal, note: e.target.value })
            }
            placeholder="Resolution note — sent to consumer + vendor"
            className="w-full h-24 rounded-xl border border-border bg-secondary p-3 text-body-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <DialogFooter className="gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setModal(null)}
            >
              Cancel
            </MobileButton>
            <MobileButton
              className="flex-1"
              variant={modal?.outcome === "refund" ? "success" : "destructive"}
              onClick={submit}
              loading={resolve.isPending}
            >
              Confirm
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const StatusBadge = ({
  status,
  slaBreached,
}: {
  status: AdminDisputeStatus;
  slaBreached?: boolean;
}) => {
  const map: Record<AdminDisputeStatus, string> = {
    open: "bg-destructive/10 text-destructive",
    under_review: "bg-warning/10 text-warning",
    resolved_refunded: "bg-success/10 text-success",
    resolved_denied: "bg-muted text-muted-foreground",
  };
  return (
    <div className="mt-1">
      <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
        {status.replace(/_/g, " ")}
      </span>
      {slaBreached && (
        <p className="text-[10px] text-destructive font-bold mt-0.5">SLA BREACHED</p>
      )}
    </div>
  );
};

export default AdminDisputesScreen;
