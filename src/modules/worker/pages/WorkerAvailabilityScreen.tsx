// Screen: W-09 · Primitives: Identity, Availability
// Route: /worker/availability

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Coffee, Power } from "lucide-react";
import { toast } from "sonner";
import {
  getWorkerAuth,
  getWorkerById,
  updateWorker,
  type MechanicWorker,
} from "@/modules/worker/lib/workers";

type Availability = "online" | "on_break" | "offline";

const OPTIONS: {
  key: Availability;
  label: string;
  hint: string;
  icon: typeof CheckCircle2;
  tone: string;
}[] = [
  {
    key: "online",
    label: "Online",
    hint: "You'll show up in dispatch and can accept mobile jobs.",
    icon: CheckCircle2,
    tone: "success",
  },
  {
    key: "on_break",
    label: "On break",
    hint: "Temporarily invisible to dispatch — assigned jobs stay yours.",
    icon: Coffee,
    tone: "warning",
  },
  {
    key: "offline",
    label: "Offline",
    hint: "Signed in but not receiving new jobs.",
    icon: Power,
    tone: "muted",
  },
];

// Map worker.status → Availability (worker.status only holds approval state,
// so we store the transient availability toggle on the same field via
// "approved" (online) vs "self_suspended" (offline). We keep "on_break" in
// a lightweight localStorage key.

const BREAK_KEY = "workerAvailabilityBreak";

function readAvailability(w: MechanicWorker): Availability {
  const onBreak = localStorage.getItem(`${BREAK_KEY}:${w.id}`) === "1";
  if (onBreak) return "on_break";
  if (w.status === "approved") return "online";
  return "offline";
}

function writeAvailability(w: MechanicWorker, next: Availability) {
  if (next === "on_break") {
    localStorage.setItem(`${BREAK_KEY}:${w.id}`, "1");
    if (w.status !== "approved") updateWorker(w.id, { status: "approved" });
    return;
  }
  localStorage.removeItem(`${BREAK_KEY}:${w.id}`);
  if (next === "offline") {
    updateWorker(w.id, { status: "self_suspended" });
  } else {
    updateWorker(w.id, { status: "approved" });
  }
}

const WorkerAvailabilityScreen = () => {
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const [worker, setWorker] = useState(
    auth ? getWorkerById(auth.workerId) : null,
  );
  const [availability, setAvailability] = useState<Availability>(
    worker ? readAvailability(worker) : "offline",
  );

  useEffect(() => {
    if (!worker) navigate("/", { replace: true });
  }, [worker, navigate]);

  if (!worker) return null;

  const set = (next: Availability) => {
    writeAvailability(worker, next);
    const w = getWorkerById(worker.id);
    if (w) setWorker(w);
    setAvailability(next);
    toast.success(
      next === "online"
        ? "You're online"
        : next === "on_break"
          ? "On break"
          : "You're offline",
    );
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          Availability
        </h1>
      </header>

      <div className="px-4 py-4 space-y-3">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-caption text-muted-foreground">Current</p>
          <p className="text-body font-bold text-foreground capitalize">
            {availability.replace("_", " ")}
          </p>
        </div>

        {OPTIONS.map((o) => {
          const active = availability === o.key;
          const Icon = o.icon;
          const toneClass =
            o.tone === "success"
              ? "text-success"
              : o.tone === "warning"
                ? "text-warning"
                : "text-muted-foreground";
          return (
            <button
              key={o.key}
              onClick={() => set(o.key)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left ${
                active ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${toneClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-bold text-foreground">
                  {o.label}
                </p>
                <p className="text-caption text-muted-foreground">{o.hint}</p>
              </div>
              {active && (
                <span className="text-caption font-semibold text-primary">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WorkerAvailabilityScreen;
