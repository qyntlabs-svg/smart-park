// Vendor-side: list of parking-rental listings owned by the current partner.
// Route: /partner/rentals

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Warehouse,
  MapPin,
  Loader2,
  PauseCircle,
  PlayCircle,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { useAuthStore } from "@/store/auth.store";
import {
  useDeleteRentalListing,
  useRentalListingsByPartner,
  useToggleRentalListingStatus,
} from "@/modules/rental/hooks";
import {
  PERIOD_LABEL,
  SLOT_TYPE_LABEL,
  VEHICLE_LABEL,
} from "@/modules/rental/types";

const PartnerRentalsScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const partnerId = user?.id ?? "partner-demo";

  const { data: listings = [], isLoading } =
    useRentalListingsByPartner(partnerId);
  const toggle = useToggleRentalListingStatus();
  const remove = useDeleteRentalListing();

  const activeCount = useMemo(
    () => listings.filter((l) => l.status === "active").length,
    [listings],
  );
  const availableSpots = useMemo(
    () => listings.reduce((n, l) => n + l.availableSpots, 0),
    [listings],
  );

  const onToggle = async (id: string) => {
    await toggle.mutateAsync(id);
  };

  const onDelete = async (id: string, title: string) => {
    const ok = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!ok) return;
    await remove.mutateAsync(id);
    toast.success("Listing removed");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Warehouse className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">
            Parking Rentals
          </span>
        </div>
        <MobileButton
          size="sm"
          onClick={() => navigate("/partner/rentals/new")}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add
        </MobileButton>
      </header>

      {/* Info banner: rental is optional and separate from hourly */}
      <div className="mx-4 mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-caption text-foreground leading-relaxed">
          Rentals are optional and run alongside your hourly parking. Each
          listing has its own day / week / month pricing.
        </p>
      </div>

      {/* Summary strip */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        <SummaryTile label="Listings" value={listings.length.toString()} />
        <SummaryTile label="Active" value={activeCount.toString()} accent />
        <SummaryTile label="Spots free" value={availableSpots.toString()} />
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <EmptyState onCreate={() => navigate("/partner/rentals/new")} />
        ) : (
          listings.map((l) => (
            <motion.div
              key={l.id}
              layout
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-bold text-foreground truncate">
                      {l.title}
                    </p>
                    <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {l.address}
                    </p>
                  </div>
                  <StatusPill status={l.status} />
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Tag>{SLOT_TYPE_LABEL[l.slotType]}</Tag>
                  {l.vehicleTypes.map((v) => (
                    <Tag key={v}>{VEHICLE_LABEL[v]}</Tag>
                  ))}
                  <Tag muted>
                    Min: {PERIOD_LABEL[l.minPeriod]}
                  </Tag>
                </div>

                {/* Price rows */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <PriceCell
                    label="/ day"
                    amount={l.pricing.dailyRate}
                  />
                  <PriceCell
                    label="/ wk"
                    amount={l.pricing.weeklyRate}
                  />
                  <PriceCell
                    label="/ mo"
                    amount={l.pricing.monthlyRate}
                  />
                </div>

                {/* Availability */}
                <div className="mt-3 flex items-center justify-between text-caption">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-bold text-foreground">
                    {l.availableSpots} / {l.totalSpots} spots free
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border flex divide-x divide-border">
                <button
                  onClick={() => navigate(`/partner/rentals/${l.id}/edit`)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5 text-body-sm font-semibold text-foreground active:bg-secondary"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => onToggle(l.id)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5 text-body-sm font-semibold text-foreground active:bg-secondary"
                >
                  {l.status === "active" ? (
                    <>
                      <PauseCircle className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" /> Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDelete(l.id, l.title)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5 text-body-sm font-semibold text-destructive active:bg-secondary"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const SummaryTile = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="rounded-2xl border border-border bg-card p-3 text-center">
    <p className="text-caption text-muted-foreground">{label}</p>
    <p
      className={`text-heading-sm mt-0.5 ${accent ? "text-primary" : "text-foreground"}`}
    >
      {value}
    </p>
  </div>
);

const StatusPill = ({ status }: { status: "draft" | "active" | "paused" }) => {
  const map = {
    active: "bg-emerald-500/10 text-emerald-600",
    paused: "bg-amber-500/10 text-amber-600",
    draft: "bg-muted text-muted-foreground",
  } as const;
  return (
    <span
      className={`text-caption font-bold px-2 py-1 rounded-lg ${map[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
};

const Tag = ({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) => (
  <span
    className={`text-caption px-2 py-1 rounded-lg font-semibold ${
      muted ? "bg-muted text-muted-foreground" : "bg-primary/5 text-primary"
    }`}
  >
    {children}
  </span>
);

const PriceCell = ({
  label,
  amount,
}: {
  label: string;
  amount: number | undefined;
}) => (
  <div className="rounded-xl bg-secondary/50 p-2 text-center">
    <p className="text-body-sm font-bold text-foreground">
      {typeof amount === "number" ? `₹${amount}` : "—"}
    </p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="mt-8 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
      <Warehouse className="w-7 h-7 text-primary" />
    </div>
    <p className="mt-4 text-body font-bold text-foreground">
      No rental listings yet
    </p>
    <p className="mt-1 text-body-sm text-muted-foreground">
      Rent out spots for a day, a week, or a month — completely optional and
      independent of your hourly parking.
    </p>
    <MobileButton onClick={onCreate} className="mt-5 w-full gap-1.5">
      <Plus className="w-4 h-4" /> Add Rental Listing
    </MobileButton>
  </div>
);

export default PartnerRentalsScreen;
