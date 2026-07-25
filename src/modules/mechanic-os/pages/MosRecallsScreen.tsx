// Screen: MOS-10 · Primitives: Vehicle, Notification
// Route: /mechanic-os/recalls

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Send,
} from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import { MobileButton } from "@/components/ui/mobile-button";
import { RECALL_CATALOGUE, type RecallEntry } from "@/modules/mechanic-os/lib/mos-store";
import { toast } from "sonner";

const SEVERITY_TONE: Record<RecallEntry["severity"], string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-secondary text-muted-foreground",
};

const MosRecallsScreen = () => {
  const [vin, setVin] = useState("");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let l = RECALL_CATALOGUE;
    if (vin.trim()) {
      const n = vin.toLowerCase();
      l = l.filter((r) => r.vin.toLowerCase().includes(n));
    }
    if (q.trim()) {
      const n = q.toLowerCase();
      l = l.filter(
        (r) =>
          r.make.toLowerCase().includes(n) ||
          r.model.toLowerCase().includes(n) ||
          r.campaign.toLowerCase().includes(n),
      );
    }
    return l;
  }, [vin, q]);

  const notify = (r: RecallEntry) => {
    toast.success(`Notified owner of ${r.make} ${r.model} · ${r.campaign}`);
  };

  return (
    <MechanicOsLayout
      title="Warranty & recall tracker"
      subtitle="Match VIN to open recall campaigns (mock catalogue)"
    >
      <div className="p-4 rounded-2xl bg-card border border-border mb-4">
        <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" /> Lookup
        </p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Enter VIN (17-char)"
            className="h-11 px-3 rounded-xl bg-secondary text-body-sm font-mono uppercase"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="or search make / model / campaign"
            className="h-11 px-3 rounded-xl bg-secondary text-body-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Kpi label="Open recalls" value={String(RECALL_CATALOGUE.length)} tone="warning" icon={AlertTriangle} />
        <Kpi
          label="High severity"
          value={String(RECALL_CATALOGUE.filter((r) => r.severity === "high").length)}
          tone="destructive"
          icon={ShieldAlert}
        />
        <Kpi
          label="Fixed this year"
          value={String(RECALL_CATALOGUE.length * 3)}
          tone="success"
          icon={ShieldCheck}
        />
      </div>

      {list.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border text-center">
          <ShieldCheck className="w-6 h-6 mx-auto text-success" />
          <p className="text-body-sm text-muted-foreground mt-2">
            No matching recalls. Vehicle appears clean.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${SEVERITY_TONE[r.severity]}`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground">
                    {r.make} {r.model} · {r.year}
                  </p>
                  <p className="text-caption text-muted-foreground font-mono">
                    VIN {r.vin}
                  </p>
                  <p className="text-caption text-primary font-semibold mt-1">
                    Campaign {r.campaign}
                  </p>
                  <p className="text-body-sm text-foreground mt-2">
                    {r.description}
                  </p>
                  <p className="text-caption text-muted-foreground mt-1">
                    Opened {new Date(r.openedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-caption font-semibold uppercase ${SEVERITY_TONE[r.severity]}`}
                >
                  {r.severity}
                </span>
              </div>
              <div className="mt-3 flex justify-end">
                <MobileButton size="sm" variant="outline" onClick={() => notify(r)}>
                  <Send className="w-4 h-4" /> Notify owner
                </MobileButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </MechanicOsLayout>
  );
};

const Kpi = ({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "warning" | "destructive" | "success";
  icon: typeof AlertTriangle;
}) => {
  const toneCls =
    tone === "warning"
      ? "text-warning"
      : tone === "destructive"
        ? "text-destructive"
        : "text-success";
  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`w-4 h-4 ${toneCls}`} />
        <span className="text-caption">{label}</span>
      </div>
      <p className={`text-xl font-bold mt-2 ${toneCls}`}>{value}</p>
    </div>
  );
};

export default MosRecallsScreen;
