// Screen: V-26 · Primitives: Identity, Payment
// Route: /partner/referral

import { useState } from "react";
import {
  Gift,
  Loader2,
  Copy,
  Share2,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useInviteVendor,
  useReferralInvites,
  useReferralStats,
} from "./hooks";
import { REFERRAL_STATUS_LABEL, type ReferralStatus } from "./types";

const PartnerReferralScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: stats, isLoading: loadingStats } = useReferralStats(partnerId);
  const { data: invites = [], isLoading: loadingInvites } =
    useReferralInvites(partnerId);
  const invite = useInviteVendor();
  const [form, setForm] = useState({ name: "", phone: "" });

  const copy = async () => {
    if (!stats) return;
    await navigator.clipboard.writeText(stats.inviteLink).catch(() => {});
    toast.success("Invite link copied!");
  };

  const share = async () => {
    if (!stats) return;
    const text = `Join SmartPark as a vendor and earn ₹${stats.perActivationReward} credit. Sign up: ${stats.inviteLink}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "SmartPark for vendors", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Message copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone required");
      return;
    }
    await invite.mutateAsync({
      partnerId,
      refereeName: form.name.trim(),
      refereePhone: form.phone.trim(),
    });
    toast.success(`Invite SMS sent to ${form.phone}`);
    setForm({ name: "", phone: "" });
  };

  return (
    <PartnerScreenLayout title="Refer a vendor" icon={Gift}>
      {loadingStats || !stats ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-caption font-bold text-primary uppercase tracking-wider">
              Your reward pool
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-heading-md font-bold text-foreground">
                ₹{stats.credits.toLocaleString()}
              </p>
              <p className="text-caption text-muted-foreground">credits earned</p>
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              Get ₹{stats.perActivationReward.toLocaleString()} for every vendor who
              lists their first facility.
            </p>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-card border border-border p-2.5">
              <span className="text-body-sm font-bold tracking-wider text-primary min-w-0 truncate">
                {stats.code}
              </span>
              <div className="flex-1" />
              <button
                onClick={copy}
                className="p-2 rounded-lg text-primary active:bg-primary/10"
                aria-label="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={share}
                className="p-2 rounded-lg text-primary active:bg-primary/10"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Manual invite */}
          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-body-sm font-bold text-foreground">
              Invite someone directly
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              We'll SMS them an onboarding link tagged with your code.
            </p>
            <div className="mt-3 space-y-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Business name"
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 phone"
                type="tel"
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
              />
              <MobileButton
                fullWidth
                onClick={submit}
                loading={invite.isPending}
                className="gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Send invite
              </MobileButton>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-3">
            <StatCell label="Invited" value={stats.totalInvited} />
            <StatCell label="Activated" value={stats.totalActivated} />
          </div>

          {/* Invite log */}
          <div>
            <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Recent invites
            </p>
            {loadingInvites ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : invites.length === 0 ? (
              <p className="text-body-sm text-muted-foreground text-center py-8">
                No invites yet — share your link!
              </p>
            ) : (
              <div className="space-y-2">
                {invites.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-foreground truncate">
                          {r.refereeName}
                        </p>
                        <p className="text-caption text-muted-foreground truncate">
                          {r.refereePhone}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge status={r.status} />
                        {r.creditAwarded > 0 && (
                          <p className="text-caption text-success font-bold mt-1">
                            +₹{r.creditAwarded.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PartnerScreenLayout>
  );
};

const StatCell = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-card p-3 text-center">
    <p className="text-heading-sm font-bold text-foreground">{value}</p>
    <p className="text-caption text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const StatusBadge = ({ status }: { status: ReferralStatus }) => {
  const map: Record<ReferralStatus, string> = {
    invited: "bg-warning/10 text-warning",
    signed_up: "bg-primary/10 text-primary",
    activated: "bg-success/10 text-success",
    expired: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}
    >
      {status === "activated" ? (
        <span className="inline-flex items-center gap-0.5">
          <CheckCircle2 className="w-3 h-3" />
          {REFERRAL_STATUS_LABEL[status]}
        </span>
      ) : (
        REFERRAL_STATUS_LABEL[status]
      )}
    </span>
  );
};

export default PartnerReferralScreen;
