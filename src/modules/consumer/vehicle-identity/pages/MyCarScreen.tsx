// Screen: C-52 · Primitives: Vehicle, Identity, Review, Provider
//
// Consumer face of the Vehicle Identity Platform. Full service history
// timeline (mock), docs vault (RC / insurance / PUC / warranty tiles),
// ownership chain, share-permissions.
//
// Route: /my-car  (and /my-car/:vehicleId)

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Car,
  ChevronDown,
  FileText,
  ShieldCheck,
  Sparkles,
  History,
  Users,
  UploadCloud,
  Loader2,
  Trash2,
  ChevronRight,
  Wrench,
  Zap,
  Droplets,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { toast } from "sonner";
import { useVehicles } from "@/api/vehicles";
import {
  useAddVehicleShare,
  useReplaceVehicleDoc,
  useRevokeVehicleShare,
  useServiceHistory,
  useVehicleDocs,
  useVehicleOwnership,
  useVehicleShares,
} from "@/modules/consumer/vehicle-identity/hooks";
import {
  DOC_LABEL,
  SCOPE_LABEL,
  type DocType,
  type ServiceEvent,
  type SharePermissionScope,
} from "@/modules/consumer/vehicle-identity/types";

const MyCarScreen = () => {
  const navigate = useNavigate();
  const params = useParams<{ vehicleId?: string }>();
  const { data: vehicles = [], isLoading: vLoading } = useVehicles();
  const [selectedId, setSelectedId] = useState<string | null>(
    params.vehicleId ?? null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<"history" | "docs" | "ownership" | "sharing">(
    "history",
  );

  const selected =
    vehicles.find((v) => v.id === selectedId) ??
    vehicles.find((v) => v.is_default) ??
    vehicles[0];
  const vehicleId = selected?.id;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-16">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          My Car
        </h1>
      </header>

      {/* Vehicle picker */}
      <button
        onClick={() => setPickerOpen(true)}
        className="mx-4 mt-4 flex items-center gap-3 p-4 rounded-2xl border border-border bg-card"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          {vLoading ? (
            <p className="text-body-sm text-muted-foreground">Loading…</p>
          ) : selected ? (
            <>
              <p className="text-body-sm font-bold text-foreground truncate">
                {selected.registration_number}
              </p>
              <p className="text-caption text-muted-foreground truncate">
                {selected.nickname || selected.model || "Vehicle"}
              </p>
            </>
          ) : (
            <p className="text-body-sm font-bold text-foreground">
              No vehicles yet
            </p>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {!vehicleId ? (
        <div className="mx-4 mt-6 rounded-2xl border border-dashed border-border p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Car className="w-7 h-7 text-primary" />
          </div>
          <p className="mt-3 text-body font-bold text-foreground">
            Add a vehicle to see its history
          </p>
          <MobileButton className="mt-4" onClick={() => navigate("/add-vehicle")}>
            Add vehicle
          </MobileButton>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="mx-4 mt-4 inline-flex bg-secondary rounded-xl p-1 w-full">
            {(
              [
                { key: "history", label: "History", icon: History },
                { key: "docs", label: "Docs", icon: FileText },
                { key: "ownership", label: "Owners", icon: Users },
                { key: "sharing", label: "Sharing", icon: ShieldCheck },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-caption font-semibold transition-all ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "history" && <HistoryPanel vehicleId={vehicleId} />}
          {tab === "docs" && <DocsPanel vehicleId={vehicleId} />}
          {tab === "ownership" && <OwnershipPanel vehicleId={vehicleId} />}
          {tab === "sharing" && <SharingPanel vehicleId={vehicleId} />}
        </>
      )}

      {/* Vehicle picker sheet */}
      <BottomSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        snapPoints={[0.6]}
      >
        <p className="text-heading-sm text-foreground">Choose vehicle</p>
        <div className="mt-4 space-y-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setSelectedId(v.id);
                setPickerOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl ${
                selected?.id === v.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <Car className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-body-sm font-bold text-foreground">
                  {v.registration_number}
                </p>
                <p className="text-caption text-muted-foreground">
                  {v.nickname || v.model || "Vehicle"}
                </p>
              </div>
            </button>
          ))}
          {vehicles.length === 0 && (
            <p className="text-body-sm text-muted-foreground text-center py-6">
              No vehicles
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};

// ---------- History panel ----------

const HistoryPanel = ({ vehicleId }: { vehicleId: string }) => {
  const { data: events = [], isLoading, isError, refetch } =
    useServiceHistory(vehicleId);

  if (isLoading) return <Loading />;
  if (isError) return <Retry onRetry={refetch} />;
  if (events.length === 0)
    return (
      <EmptyBlock
        title="No history yet"
        body="Service records will appear here as you book with partner shops."
      />
    );

  return (
    <div className="mx-4 mt-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        {events.map((e, i) => (
          <TimelineItem
            key={e.id}
            event={e}
            isLast={i === events.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

const TimelineItem = ({
  event,
  isLast,
}: {
  event: ServiceEvent;
  isLast: boolean;
}) => {
  const Icon =
    event.kind === "charge"
      ? Zap
      : event.kind === "wash"
        ? Droplets
        : Wrench;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-body-sm font-bold text-foreground truncate">
            {event.title}
          </p>
          {typeof event.costRupees === "number" && (
            <p className="text-body-sm font-bold text-foreground shrink-0">
              ₹{event.costRupees}
            </p>
          )}
        </div>
        <p className="text-caption text-muted-foreground">
          {event.providerName ?? "—"}
          {typeof event.km === "number" ? ` · ${event.km.toLocaleString()} km` : ""}
        </p>
        <p className="text-caption text-muted-foreground/70 mt-0.5">
          {new Date(event.at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

// ---------- Docs panel ----------

const DocsPanel = ({ vehicleId }: { vehicleId: string }) => {
  const { data: docs = [], isLoading, isError, refetch } = useVehicleDocs(vehicleId);
  const replace = useReplaceVehicleDoc();

  const upload = async (type: DocType) => {
    try {
      await replace.mutateAsync({
        vehicleId,
        type,
        fileName: `${type}-${Date.now()}.pdf`,
      });
      toast.success(`${DOC_LABEL[type]} updated`);
    } catch {
      toast.error("Could not update document");
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <Retry onRetry={refetch} />;

  const grid: DocType[] = ["rc", "insurance", "puc", "warranty"];

  return (
    <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
      {grid.map((type) => {
        const doc = docs.find((d) => d.type === type);
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-border bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="mt-2 text-body-sm font-bold text-foreground">
              {DOC_LABEL[type]}
            </p>
            {doc?.expiresAt && (
              <p
                className={`text-caption font-semibold ${
                  new Date(doc.expiresAt).getTime() < Date.now() + 86400000 * 30
                    ? "text-warning"
                    : "text-muted-foreground"
                }`}
              >
                Exp{" "}
                {new Date(doc.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                })}
              </p>
            )}
            {doc?.fileName && (
              <p className="text-caption text-muted-foreground truncate mt-0.5">
                {doc.fileName}
              </p>
            )}
            <button
              onClick={() => upload(type)}
              className="mt-3 w-full h-9 rounded-xl border border-primary/30 text-body-sm font-semibold text-primary flex items-center justify-center gap-1 active:scale-[0.97]"
            >
              <UploadCloud className="w-4 h-4" />
              {doc?.fileName ? "Replace" : "Upload"}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

// ---------- Ownership panel ----------

const OwnershipPanel = ({ vehicleId }: { vehicleId: string }) => {
  const { data: chain = [], isLoading, isError, refetch } =
    useVehicleOwnership(vehicleId);

  if (isLoading) return <Loading />;
  if (isError) return <Retry onRetry={refetch} />;
  if (chain.length === 0)
    return (
      <EmptyBlock
        title="No ownership record"
        body="This will populate once ownership data syncs."
      />
    );

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4">
      {chain.map((entry, i) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                !entry.to ? "bg-primary/15" : "bg-secondary"
              }`}
            >
              <Users
                className={`w-4 h-4 ${!entry.to ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            {i < chain.length - 1 && (
              <div className="w-0.5 flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-body-sm font-bold text-foreground">
              {entry.ownerName}{" "}
              {!entry.to && (
                <span className="ml-1 text-caption text-primary font-bold">
                  Current
                </span>
              )}
            </p>
            <p className="text-caption text-muted-foreground">
              {new Date(entry.from).toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
              })}
              {entry.to
                ? ` – ${new Date(entry.to).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                : " – present"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------- Sharing panel ----------

const SharingPanel = ({ vehicleId }: { vehicleId: string }) => {
  const { data: shares = [], isLoading, isError, refetch } = useVehicleShares(vehicleId);
  const revoke = useRevokeVehicleShare();
  const add = useAddVehicleShare();
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) return <Loading />;
  if (isError) return <Retry onRetry={refetch} />;

  return (
    <div className="mx-4 mt-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/25 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-bold text-foreground">
              You control what others see
            </p>
            <p className="text-caption text-muted-foreground">
              Grant read-only or write-back access. Revoke anytime.
            </p>
          </div>
        </div>
      </div>

      {shares.length === 0 ? (
        <EmptyBlock
          title="No shares yet"
          body="Grant a mechanic access to view service history for faster diagnostics."
        />
      ) : (
        <div className="mt-4 space-y-2">
          {shares.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-body-sm font-bold text-primary">
                  {s.granteeName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {s.granteeName}
                  </p>
                  <p className="text-caption text-muted-foreground capitalize">
                    {s.granteeType} · added{" "}
                    {new Date(s.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await revoke.mutateAsync({ vehicleId, id: s.id });
                    toast.success("Access revoked");
                  }}
                  className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center active:scale-[0.95]"
                  aria-label="Revoke"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.scopes.map((sc) => (
                  <span
                    key={sc}
                    className="text-caption text-primary px-2 py-0.5 rounded-full bg-primary/10 font-semibold"
                  >
                    {SCOPE_LABEL[sc]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MobileButton
        fullWidth
        className="mt-4 gap-1.5"
        onClick={() => setAddOpen(true)}
      >
        <ShieldCheck className="w-4 h-4" />
        Grant access
      </MobileButton>

      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        snapPoints={[0.7]}
      >
        <AddShareForm
          busy={add.isPending}
          onSubmit={async (input) => {
            try {
              await add.mutateAsync({ vehicleId, ...input });
              toast.success("Access granted");
              setAddOpen(false);
            } catch {
              toast.error("Could not grant access");
            }
          }}
        />
      </BottomSheet>
    </div>
  );
};

const AddShareForm = ({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: {
    granteeName: string;
    granteeType: "mechanic" | "family" | "insurer" | "other";
    scopes: SharePermissionScope[];
  }) => void;
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"mechanic" | "family" | "insurer" | "other">(
    "mechanic",
  );
  const [scopes, setScopes] = useState<SharePermissionScope[]>(["read_history"]);
  const valid = name.trim().length > 0 && scopes.length > 0;

  const toggle = (s: SharePermissionScope) =>
    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <div className="pt-2 pb-6">
      <p className="text-heading-sm text-foreground">Grant access</p>
      <p className="text-caption text-muted-foreground mt-1">
        Who should be able to see this vehicle's data?
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
            Type
          </p>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {(["mechanic", "family", "insurer", "other"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`h-10 rounded-xl border text-caption font-semibold capitalize ${
                  type === t
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Scopes
          </p>
          <div className="mt-1 space-y-2">
            {(Object.keys(SCOPE_LABEL) as SharePermissionScope[]).map((s) => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-body-sm ${
                  scopes.includes(s)
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <span>{SCOPE_LABEL[s]}</span>
                {scopes.includes(s) && (
                  <ChevronRight className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MobileButton
        fullWidth
        className="mt-6"
        disabled={!valid || busy}
        loading={busy}
        onClick={() =>
          onSubmit({
            granteeName: name.trim(),
            granteeType: type,
            scopes,
          })
        }
      >
        Grant access
      </MobileButton>
    </div>
  );
};

// ---------- Shared bits ----------

const Loading = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-6 h-6 text-primary animate-spin" />
  </div>
);

const Retry = ({ onRetry }: { onRetry: () => void }) => (
  <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
    <p className="text-body-sm font-semibold text-destructive">
      Couldn't load data
    </p>
    <MobileButton
      variant="outline"
      size="sm"
      className="mt-3"
      onClick={onRetry}
    >
      Retry
    </MobileButton>
  </div>
);

const EmptyBlock = ({ title, body }: { title: string; body: string }) => (
  <div className="mx-4 mt-4 rounded-2xl border border-dashed border-border p-6 text-center">
    <p className="text-body-sm font-bold text-foreground">{title}</p>
    <p className="mt-1 text-caption text-muted-foreground">{body}</p>
  </div>
);

export default MyCarScreen;
