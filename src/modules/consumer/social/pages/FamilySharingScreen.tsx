// Screen: C-55 · Primitives: Vehicle, Identity, Payment
//
// Invite family members. Shared vehicles + shared-wallet toggle.
// Mock invite flow — no real messaging.
//
// Route: /family

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Users,
  UserPlus,
  Wallet,
  Trash2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  useFamilyState,
  useInviteFamilyMember,
  useRemoveFamilyMember,
  useSetSharedWallet,
  useToggleMemberWalletAccess,
} from "@/modules/consumer/social/hooks";
import type { FamilyMember } from "@/modules/consumer/social/types";

const FamilySharingScreen = () => {
  const navigate = useNavigate();
  const { data: state, isLoading, isError, refetch } = useFamilyState();
  const invite = useInviteFamilyMember();
  const remove = useRemoveFamilyMember();
  const setShared = useSetSharedWallet();
  const toggleWallet = useToggleMemberWalletAccess();

  const [inviteOpen, setInviteOpen] = useState(false);

  const activeMembers = state?.members.filter((m) => m.status !== "removed") ?? [];

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
          Family sharing
        </h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError || !state ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load family
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
            className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/15 to-emerald-500/10 border border-primary/25 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-body font-bold text-foreground">
                  Share vehicles & wallet
                </p>
                <p className="text-caption text-muted-foreground">
                  Up to 5 family members. You stay in control.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Shared wallet */}
          <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-body-sm font-bold text-foreground">
                Shared family wallet
              </p>
              <p className="text-caption text-muted-foreground">
                Everyone spends from your default method
              </p>
            </div>
            <Switch
              checked={state.sharedWallet}
              onCheckedChange={(v) => {
                setShared.mutate(v);
                toast.success(v ? "Shared wallet on" : "Shared wallet off");
              }}
            />
          </div>

          {/* Members */}
          <div className="mx-4 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-bold text-foreground">
                Members · {activeMembers.length}
              </p>
              <button
                onClick={() => setInviteOpen(true)}
                className="text-caption font-semibold text-primary"
              >
                + Invite
              </button>
            </div>
            {activeMembers.length === 0 ? (
              <div className="mt-2 rounded-2xl border border-dashed border-border p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <p className="mt-2 text-body-sm font-bold text-foreground">
                  No family members yet
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  Invite spouse / parents / siblings to share vehicles and pay via
                  one wallet.
                </p>
                <MobileButton
                  className="mt-4"
                  onClick={() => setInviteOpen(true)}
                >
                  Invite first member
                </MobileButton>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <AnimatePresence initial={false}>
                  {activeMembers.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      canWallet={state.sharedWallet}
                      onToggleWallet={() => toggleWallet.mutate(m.id)}
                      onRemove={async () => {
                        await remove.mutateAsync(m.id);
                        toast.success(`${m.name} removed`);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          onClick={() => setInviteOpen(true)}
          className="gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          Invite family member
        </MobileButton>
      </div>

      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        snapPoints={[0.7]}
      >
        <InviteForm
          busy={invite.isPending}
          onSubmit={async (input) => {
            try {
              await invite.mutateAsync(input);
              toast.success(`${input.name} invited`);
              setInviteOpen(false);
            } catch {
              toast.error("Could not send invite");
            }
          }}
        />
      </BottomSheet>
    </div>
  );
};

const MemberRow = ({
  member,
  canWallet,
  onToggleWallet,
  onRemove,
}: {
  member: FamilyMember;
  canWallet: boolean;
  onToggleWallet: () => void;
  onRemove: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-4 rounded-2xl border border-border bg-card"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-body-sm font-bold text-primary">
        {member.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-bold text-foreground truncate">
          {member.name}
        </p>
        <p className="text-caption text-muted-foreground truncate">
          {[member.relationship, member.phone].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span
        className={`text-caption font-bold px-2 py-0.5 rounded-full ${
          member.status === "active"
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-warning/10 text-warning"
        }`}
      >
        {member.status}
      </span>
    </div>

    <div className="mt-3 flex items-center justify-between">
      <div>
        <p className="text-body-sm font-semibold text-foreground">
          Wallet access
        </p>
        <p className="text-caption text-muted-foreground">
          {canWallet
            ? "Can pay from shared wallet"
            : "Enable shared wallet to allow"}
        </p>
      </div>
      <Switch
        checked={member.walletAccess}
        onCheckedChange={onToggleWallet}
        disabled={!canWallet}
      />
    </div>

    <button
      onClick={onRemove}
      className="mt-3 w-full h-10 rounded-xl border border-destructive/30 text-body-sm font-semibold text-destructive flex items-center justify-center gap-1.5 active:scale-[0.97]"
    >
      <Trash2 className="w-4 h-4" />
      Remove
    </button>
  </motion.div>
);

const InviteForm = ({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: {
    name: string;
    phone?: string;
    relationship?: string;
    walletAccess?: boolean;
  }) => void;
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [walletAccess, setWalletAccess] = useState(false);
  const valid = name.trim().length > 0;

  return (
    <div className="pt-2 pb-6">
      <p className="text-heading-sm text-foreground">Invite family member</p>
      <p className="text-caption text-muted-foreground mt-1">
        They'll get a link to install and join your household.
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
        <div>
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Relationship
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {["Spouse", "Parent", "Sibling", "Child", "Other"].map((r) => (
              <button
                key={r}
                onClick={() => setRelationship(r)}
                className={`h-9 px-3 rounded-full border text-body-sm ${
                  relationship === r
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
          <div>
            <p className="text-body-sm font-semibold text-foreground">
              Share wallet
            </p>
            <p className="text-caption text-muted-foreground">
              Can pay from your default method
            </p>
          </div>
          <Switch checked={walletAccess} onCheckedChange={setWalletAccess} />
        </div>
      </div>
      <MobileButton
        fullWidth
        className="mt-6 gap-1.5"
        disabled={!valid || busy}
        loading={busy}
        onClick={() =>
          onSubmit({
            name: name.trim(),
            phone: phone.trim() || undefined,
            relationship: relationship || undefined,
            walletAccess,
          })
        }
      >
        <UserPlus className="w-4 h-4" />
        Send invite
      </MobileButton>
    </div>
  );
};

export default FamilySharingScreen;
