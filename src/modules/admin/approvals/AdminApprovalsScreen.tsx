// Screen: A-03 · Primitives: Provider, Identity
// Route: /admin/approvals

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useApplications,
  useApproveApplication,
  useClaimApplication,
  useRejectApplication,
} from "./hooks";
import {
  KYC_STATUS_LABEL,
  PROVIDER_KIND_LABEL,
  type KycStatus,
  type ProviderKind,
} from "./types";

const AdminApprovalsScreen = () => {
  const reviewer = useAuthStore((s) => s.user?.name ?? s.user?.id ?? "admin");
  const [filter, setFilter] = useState<KycStatus>("pending");
  const [kindFilter, setKindFilter] = useState<"all" | ProviderKind>("all");
  const { data: applications = [], isLoading, isError } = useApplications(filter);
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const claim = useClaimApplication();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(
    () =>
      kindFilter === "all"
        ? applications
        : applications.filter((a) => a.kind === kindFilter),
    [applications, kindFilter],
  );

  const counts = useMemo(() => {
    const c: Record<KycStatus, number> = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
    };
    applications.forEach((a) => {
      c[a.status] += 1;
    });
    return c;
  }, [applications]);

  const doApprove = async (id: string) => {
    await approve.mutateAsync({ id, reviewer });
    toast.success("Provider approved");
  };

  const submitReject = async () => {
    if (!rejectId) return;
    if (!reason.trim()) {
      toast.error("Rejection reason required");
      return;
    }
    await reject.mutateAsync({ id: rejectId, reviewer, reason: reason.trim() });
    setRejectId(null);
    setReason("");
    toast.success("Provider rejected");
  };

  const doClaim = async (id: string) => {
    await claim.mutateAsync({ id, reviewer });
    toast.success("Application assigned to you");
  };

  return (
    <AdminLayout
      title="Provider Approvals"
      subtitle="KYC review queue for vendors, mechanics, tow operators"
    >
      {/* Status filter row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["pending", "under_review", "approved", "rejected"] as KycStatus[]).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-caption font-semibold border ${
                filter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {KYC_STATUS_LABEL[s]}{" "}
              <span className="ml-1 opacity-70">({counts[s]})</span>
            </button>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "parking", "ev", "mechanic", "tow", "rental"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={`px-3 py-1 rounded-full text-caption font-semibold border ${
              kindFilter === k
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {k === "all" ? "All types" : PROVIDER_KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-body-sm text-destructive">
          Couldn't load applications
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 text-center rounded-2xl border border-dashed border-border">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            No {KYC_STATUS_LABEL[filter].toLowerCase()} applications
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {a.businessName}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {a.ownerName} · {a.phone}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {a.city} · {a.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {PROVIDER_KIND_LABEL[a.kind]}
                  </span>
                  <p className="text-caption text-muted-foreground mt-1">
                    {new Date(a.submittedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {a.documents.map((d) => (
                  <a
                    key={d.id}
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-caption font-semibold text-primary px-2 py-1 rounded-lg bg-primary/5"
                  >
                    <FileText className="w-3 h-3" /> {d.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>

              {a.gstin && (
                <p className="mt-2 text-caption text-muted-foreground">
                  GSTIN: <span className="font-semibold text-foreground">{a.gstin}</span>
                </p>
              )}

              {a.rejectionReason && (
                <p className="mt-2 text-caption text-destructive">
                  Rejected: {a.rejectionReason}
                </p>
              )}

              {a.reviewer && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Reviewer: {a.reviewer}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {a.status === "pending" && (
                  <MobileButton
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => doClaim(a.id)}
                    loading={claim.isPending}
                  >
                    <UserCheck className="w-4 h-4" /> Claim
                  </MobileButton>
                )}
                {(a.status === "pending" || a.status === "under_review") && (
                  <>
                    <MobileButton
                      size="sm"
                      variant="success"
                      className="gap-1.5"
                      onClick={() => doApprove(a.id)}
                      loading={approve.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </MobileButton>
                    <MobileButton
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => setRejectId(a.id)}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </MobileButton>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!rejectId}
        onOpenChange={(o) => {
          if (!o) {
            setRejectId(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Reason will be sent to the applicant.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. GST certificate does not match business name"
            className="w-full h-28 rounded-xl border border-border bg-secondary p-3 text-body-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <DialogFooter className="gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setRejectId(null)}
            >
              Cancel
            </MobileButton>
            <MobileButton
              variant="destructive"
              className="flex-1"
              onClick={submitReject}
              loading={reject.isPending}
            >
              Confirm reject
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminApprovalsScreen;
