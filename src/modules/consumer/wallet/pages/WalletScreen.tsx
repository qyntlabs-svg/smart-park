// Screen: C-24 · Primitives: Payment, Identity
//
// Consumer wallet: saved UPI IDs + cards (mock). Add / remove / set default.
// Empty state prompts new users to add their first method.
//
// Route: /wallet

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Smartphone,
  Star,
  Trash2,
  Loader2,
  Wallet as WalletIcon,
  ShieldCheck,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { toast } from "sonner";
import {
  useAddCardMethod,
  useAddUpiMethod,
  usePaymentMethods,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
} from "@/modules/consumer/wallet/hooks";
import type { PaymentMethod } from "@/modules/consumer/wallet/types";

const WalletScreen = () => {
  const navigate = useNavigate();
  const { data: methods = [], isLoading, isError, refetch } = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const remove = useRemovePaymentMethod();

  const [addSheet, setAddSheet] = useState<"upi" | "card" | null>(null);

  const handleSetDefault = async (id: string) => {
    await setDefault.mutateAsync(id);
    toast.success("Default payment method updated");
  };

  const handleRemove = async (m: PaymentMethod) => {
    if (m.isDefault && methods.length === 1) {
      toast.error("Add another method before removing your only one");
      return;
    }
    await remove.mutateAsync(m.id);
    toast.success("Payment method removed");
  };

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
          Wallet
        </h1>
      </header>

      {/* Trust banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-bold text-foreground">
              We never store your full card number
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              UPI + tokenised cards only. Refunds go back to source instantly.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Section header */}
      <div className="mx-4 mt-4 flex items-center justify-between">
        <p className="text-body-sm font-bold text-foreground">
          Saved methods {methods.length ? `· ${methods.length}` : ""}
        </p>
        <button
          onClick={() => refetch()}
          className="text-caption text-primary font-semibold"
        >
          Refresh
        </button>
      </div>

      {/* List / loading / empty / error */}
      <div className="mx-4 mt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-body-sm font-semibold text-destructive">
              Couldn't load payment methods
            </p>
            <MobileButton
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try again
            </MobileButton>
          </div>
        ) : methods.length === 0 ? (
          <EmptyState onAdd={() => setAddSheet("upi")} />
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {methods.map((m) => (
                <MethodRow
                  key={m.id}
                  method={m}
                  onSetDefault={() => handleSetDefault(m.id)}
                  onRemove={() => handleRemove(m)}
                  busy={setDefault.isPending || remove.isPending}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quick actions grid */}
      <div className="mx-4 mt-6 grid grid-cols-2 gap-3">
        <QuickAction
          icon={Smartphone}
          label="Add UPI"
          onClick={() => setAddSheet("upi")}
        />
        <QuickAction
          icon={CreditCard}
          label="Add Card"
          onClick={() => setAddSheet("card")}
        />
      </div>

      {/* Refunds link */}
      <button
        onClick={() => navigate("/refunds")}
        className="mx-4 mt-3 flex items-center justify-between rounded-2xl border border-border bg-card p-4 active:bg-secondary"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <WalletIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-body-sm font-bold text-foreground">
              Refunds & disputes
            </p>
            <p className="text-caption text-muted-foreground">
              Track past requests, raise a new one
            </p>
          </div>
        </div>
        <span className="text-caption text-primary font-semibold">Open</span>
      </button>

      {/* Sticky add CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          onClick={() => setAddSheet("upi")}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add payment method
        </MobileButton>
      </div>

      {/* Add sheets */}
      <BottomSheet
        open={addSheet === "upi"}
        onClose={() => setAddSheet(null)}
        snapPoints={[0.75]}
      >
        <AddUpiForm onClose={() => setAddSheet(null)} />
      </BottomSheet>
      <BottomSheet
        open={addSheet === "card"}
        onClose={() => setAddSheet(null)}
        snapPoints={[0.85]}
      >
        <AddCardForm onClose={() => setAddSheet(null)} />
      </BottomSheet>
    </div>
  );
};

// ---------- Sub-components ----------

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-dashed border-border p-6 text-center"
  >
    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
      <WalletIcon className="w-7 h-7 text-primary" />
    </div>
    <p className="mt-3 text-body font-bold text-foreground">
      No payment method yet
    </p>
    <p className="mt-1 text-body-sm text-muted-foreground">
      Add UPI or a card to reserve chargers and parking in one tap.
    </p>
    <MobileButton className="mt-4" onClick={onAdd}>
      Add your first method
    </MobileButton>
  </motion.div>
);

const MethodRow = ({
  method,
  onSetDefault,
  onRemove,
  busy,
}: {
  method: PaymentMethod;
  onSetDefault: () => void;
  onRemove: () => void;
  busy: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-4 rounded-2xl border bg-card ${
        method.isDefault ? "border-primary/40" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            method.isDefault ? "bg-primary/15" : "bg-secondary"
          }`}
        >
          {method.type === "upi" ? (
            <Smartphone
              className={`w-5 h-5 ${method.isDefault ? "text-primary" : "text-muted-foreground"}`}
            />
          ) : (
            <CreditCard
              className={`w-5 h-5 ${method.isDefault ? "text-primary" : "text-muted-foreground"}`}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-body-sm font-bold text-foreground truncate">
              {method.type === "upi"
                ? method.vpa
                : `${method.brand.toUpperCase()} •••• ${method.last4}`}
            </p>
            {method.isDefault && (
              <span className="text-caption font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                Default
              </span>
            )}
          </div>
          <p className="text-caption text-muted-foreground mt-0.5">
            {method.label ??
              (method.type === "card"
                ? `${method.holderName} · Exp ${String(method.expMonth).padStart(2, "0")}/${method.expYear}`
                : "Saved for one-tap pay")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!method.isDefault && (
          <button
            onClick={onSetDefault}
            disabled={busy}
            className="flex-1 h-10 rounded-xl border border-border text-body-sm font-semibold text-primary flex items-center justify-center gap-1.5 active:scale-[0.97]"
          >
            <Star className="w-4 h-4" />
            Set default
          </button>
        )}
        <button
          onClick={onRemove}
          disabled={busy}
          className="flex-1 h-10 rounded-xl border border-destructive/30 text-body-sm font-semibold text-destructive flex items-center justify-center gap-1.5 active:scale-[0.97]"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
      </div>
    </motion.div>
  );
};

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card"
  >
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <span className="text-body-sm font-bold text-foreground">{label}</span>
  </motion.button>
);

// ---------- Add forms ----------

const AddUpiForm = ({ onClose }: { onClose: () => void }) => {
  const [vpa, setVpa] = useState("");
  const [label, setLabel] = useState("");
  const add = useAddUpiMethod();

  const valid = /^[\w.\-]{2,}@[\w.\-]{2,}$/.test(vpa.trim());

  const submit = async () => {
    if (!valid) return;
    try {
      await add.mutateAsync({ vpa, label });
      toast.success("UPI added");
      onClose();
    } catch {
      toast.error("Could not add UPI");
    }
  };

  return (
    <div className="pt-2 pb-6">
      <p className="text-heading-sm text-foreground">Add UPI ID</p>
      <p className="text-caption text-muted-foreground mt-1">
        Used only for reservation holds and refunds. No auto-debit.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="UPI ID">
          <input
            value={vpa}
            onChange={(e) => setVpa(e.target.value)}
            placeholder="name@bank"
            autoComplete="off"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
        <Field label="Nickname (optional)">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Personal, Work…"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
      </div>

      <MobileButton
        fullWidth
        className="mt-6"
        disabled={!valid}
        loading={add.isPending}
        onClick={submit}
      >
        Save UPI
      </MobileButton>
    </div>
  );
};

const AddCardForm = ({ onClose }: { onClose: () => void }) => {
  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const add = useAddCardMethod();

  const digits = number.replace(/\s/g, "");
  const brand: "visa" | "mastercard" | "rupay" | "amex" | "other" =
    digits.startsWith("4")
      ? "visa"
      : digits.startsWith("5")
        ? "mastercard"
        : digits.startsWith("6")
          ? "rupay"
          : digits.startsWith("3")
            ? "amex"
            : "other";

  const expMonth = parseInt(exp.slice(0, 2), 10);
  const expYear = parseInt(`20${exp.slice(-2)}`, 10);
  const validExp = expMonth >= 1 && expMonth <= 12 && expYear >= 2024;
  const valid = digits.length >= 13 && holderName.trim().length > 1 && validExp;

  const submit = async () => {
    if (!valid) return;
    try {
      await add.mutateAsync({
        last4: digits,
        brand,
        expMonth,
        expYear,
        holderName,
      });
      toast.success("Card added");
      onClose();
    } catch {
      toast.error("Could not add card");
    }
  };

  return (
    <div className="pt-2 pb-6">
      <p className="text-heading-sm text-foreground">Add card</p>
      <p className="text-caption text-muted-foreground mt-1">
        Card is tokenised on save — only the last 4 digits stay on device.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="Cardholder name">
          <input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="Name on card"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
        <Field label="Card number">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
        <Field label="Expiry (MM/YY)">
          <input
            value={exp}
            onChange={(e) => setExp(e.target.value)}
            inputMode="numeric"
            placeholder="12/28"
            className="w-full h-12 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
        </Field>
      </div>

      <MobileButton
        fullWidth
        className="mt-6"
        disabled={!valid}
        loading={add.isPending}
        onClick={submit}
      >
        Save card
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

export default WalletScreen;
