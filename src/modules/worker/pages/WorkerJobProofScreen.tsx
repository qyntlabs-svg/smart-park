// Screen: W-07 · Primitives: Reservation, Review
// Route: /worker/jobs/:id/proof

import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  KeyRound,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import {
  getMechanicBookings,
  updateMechanicBooking,
} from "@/modules/mechanic/lib/shops";
import {
  getWorkerAuth,
  getWorkerById,
} from "@/modules/worker/lib/workers";
import { pushNotification } from "@/shared/lib/notifications";

interface ChecklistItem {
  id: string;
  label: string;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "arrival", label: "Confirmed customer identity on arrival" },
  { id: "diagnose", label: "Diagnosed the reported issue" },
  { id: "authorized", label: "Received customer authorisation for work" },
  { id: "completed", label: "Completed the service to customer's satisfaction" },
  { id: "cleanup", label: "Cleaned work area & handed over receipts" },
];

const WorkerJobProofScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const worker = auth ? getWorkerById(auth.workerId) : null;
  const [tick, setTick] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [otp, setOtp] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const booking = useMemo(
    () => getMechanicBookings().find((b) => b.id === id) ?? null,
    [id, tick],
  );

  if (!worker) {
    navigate("/", { replace: true });
    return null;
  }

  if (!booking) {
    return (
      <Shell title="Job proof">
        <div className="p-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            This job no longer exists.
          </p>
        </div>
      </Shell>
    );
  }

  const addPhoto = (file: File | undefined) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setPhotos((p) => [...p, r.result as string]);
    r.readAsDataURL(file);
  };

  const allDone = DEFAULT_CHECKLIST.every((c) => checked[c.id]);

  const finish = () => {
    if (booking.otp && booking.otp !== otp.trim()) {
      return toast.error("Wrong OTP · ask the customer");
    }
    if (!allDone) return toast.error("Tick every checklist item");
    if (photos.length === 0) return toast.error("Attach at least one photo");
    setSaving(true);
    updateMechanicBooking(booking.id, {
      status: "completed",
      paid: true,
    });
    pushNotification({
      audience: "consumer",
      audienceId: booking.customerPhone,
      title: "Service complete",
      body: `${worker.name} finished ${booking.service}.`,
    });
    pushNotification({
      audience: "owner",
      audienceId: booking.shopId,
      title: "Worker completed job",
      body: `${worker.name} · ${booking.service} · ₹${booking.price}`,
    });
    setSaving(false);
    toast.success("Job completed 🎉");
    navigate("/worker/dashboard", { replace: true });
    setTick((t) => t + 1);
  };

  return (
    <Shell title="Complete job">
      <div className="px-5 py-4 space-y-5">
        {/* Booking summary */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-body-sm font-bold text-foreground">
            {booking.service}
          </p>
          <p className="text-caption text-muted-foreground">
            {booking.customerName} · ₹{booking.price}
          </p>
        </div>

        {/* Checklist */}
        <section>
          <p className="text-body-sm font-bold text-foreground">Checklist</p>
          <div className="mt-2 space-y-2">
            {DEFAULT_CHECKLIST.map((c) => (
              <label
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <input
                  type="checkbox"
                  checked={!!checked[c.id]}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [c.id]: e.target.checked }))
                  }
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <span className="text-body-sm text-foreground flex-1">
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Photos */}
        <section>
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-bold text-foreground">
              Proof photos ({photos.length})
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-caption text-primary font-semibold flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Add
            </button>
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => addPhoto(e.target.files?.[0])}
            />
          </div>
          {photos.length === 0 ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              <Camera className="w-6 h-6" />
              <span className="text-caption">Capture before & after</span>
            </button>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden bg-secondary"
                >
                  <img src={p} className="w-full h-full object-cover" />
                  <button
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>

        {/* OTP */}
        {booking.otp && (
          <section>
            <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> Customer OTP
            </p>
            <p className="text-caption text-muted-foreground">
              Ask {booking.customerName} for the 4-digit code shown in their app.
            </p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              inputMode="numeric"
              className="mt-2 h-14 rounded-xl text-center text-2xl font-bold tracking-[0.5em]"
            />
          </section>
        )}

        <MobileButton fullWidth variant="success" loading={saving} onClick={finish}>
          <CheckCircle2 className="w-4 h-4" /> Submit & complete
        </MobileButton>
      </div>
    </Shell>
  );
};

const Shell = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          {title}
        </h1>
      </header>
      {children}
    </div>
  );
};

export default WorkerJobProofScreen;
