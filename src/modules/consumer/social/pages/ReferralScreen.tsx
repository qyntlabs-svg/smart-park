// Screen: C-51 · Primitives: Identity, Payment
//
// Share code + track invited-friend credits (mock).
//
// Route: /referral

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Share2,
  Gift,
  Copy,
  Check,
  Users,
  Plus,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { toast } from "sonner";
import {
  useAddInvitedFriend,
  useReferralState,
} from "@/modules/consumer/social/hooks";

const REWARD_TEXT = "Give ₹150, get ₹150";

const ReferralScreen = () => {
  const navigate = useNavigate();
  const { data: state, isLoading, isError, refetch } = useReferralState();
  const [copied, setCopied] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const add = useAddInvitedFriend();

  const handleCopy = async () => {
    if (!state) return;
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy code");
    }
  };

  const handleShare = async () => {
    if (!state) return;
    const link = `https://autodoc.in/join?ref=${state.code}`;
    const text = `Try SmartPark — use my code ${state.code} for ₹150 off your first booking.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join me on SmartPark", text, url: link });
      } else {
        await navigator.clipboard.writeText(`${text} ${link}`);
        toast.success("Referral link copied");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-24">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Refer friends
        </h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError || !state ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load referral state
          </p>
          <MobileButton
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Retry
          </MobileButton>
        </div>
      ) : (
        <>
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/15 border-2 border-primary/30 p-5 text-center"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            <p className="mt-3 text-heading-md text-foreground leading-tight">
              {REWARD_TEXT}
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Credited once they finish their first paid booking.
            </p>

            <div className="mt-4 rounded-2xl bg-card border border-border p-3 flex items-center gap-2">
              <p className="flex-1 font-mono text-heading-sm text-foreground tracking-widest text-center">
                {state.code}
              </p>
              <button
                onClick={handleCopy}
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center active:scale-[0.95]"
                aria-label="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>

            <MobileButton fullWidth className="mt-4 gap-1.5" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Share code
            </MobileButton>
          </motion.div>

          {/* Credit tiles */}
          <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
            <CreditTile
              label="Credits earned"
              value={`₹${state.totalCredits}`}
              tone="primary"
            />
            <CreditTile
              label="Pending"
              value={`₹${state.pendingCredits}`}
              tone="warning"
            />
          </div>

          {/* Invited list */}
          <div className="mx-4 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-bold text-foreground">
                Invited friends
              </p>
              <button
                onClick={() => setInviteOpen(true)}
                className="text-caption font-semibold text-primary"
              >
                + Add manually
              </button>
            </div>
            {state.invitedFriends.length === 0 ? (
              <div className="mt-2 rounded-2xl border border-dashed border-border p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <p className="mt-2 text-body-sm font-bold text-foreground">
                  Nobody yet
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  Share your code to see friends here.
                </p>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {state.invitedFriends.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-body-sm font-bold text-primary">
                      {f.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-foreground truncate">
                        {f.name}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {f.status === "credited"
                          ? `Joined & booked · +₹${f.creditsEarned}`
                          : f.status === "joined"
                            ? "Joined — pending first booking"
                            : "Invited"}
                      </p>
                    </div>
                    <span
                      className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                        f.status === "credited"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : f.status === "joined"
                            ? "bg-warning/10 text-warning"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {f.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        snapPoints={[0.6]}
      >
        <ManualInviteForm
          onSubmit={async (name, phone) => {
            try {
              await add.mutateAsync({ name, phone });
              toast.success("Invite tracked");
              setInviteOpen(false);
            } catch {
              toast.error("Could not save invite");
            }
          }}
          busy={add.isPending}
        />
      </BottomSheet>
    </div>
  );
};

const CreditTile = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "warning";
}) => (
  <div className="p-4 rounded-2xl border border-border bg-card">
    <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
    <p
      className={`mt-1 text-heading-md ${
        tone === "primary" ? "text-primary" : "text-warning"
      }`}
    >
      {value}
    </p>
  </div>
);

const ManualInviteForm = ({
  onSubmit,
  busy,
}: {
  onSubmit: (name: string, phone?: string) => void;
  busy: boolean;
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const valid = name.trim().length > 0;
  return (
    <div className="pt-2 pb-6">
      <p className="text-heading-sm text-foreground">Track an invite</p>
      <p className="text-caption text-muted-foreground mt-1">
        We'll list them here so you can follow up on the credit.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Name
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </div>
        <div>
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Phone (optional)
          </p>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            className="mt-1 w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </div>
      </div>
      <MobileButton
        fullWidth
        className="mt-6 gap-1.5"
        disabled={!valid || busy}
        loading={busy}
        onClick={() => onSubmit(name.trim(), phone.trim() || undefined)}
      >
        <Plus className="w-4 h-4" />
        Save invite
      </MobileButton>
    </div>
  );
};

export default ReferralScreen;
