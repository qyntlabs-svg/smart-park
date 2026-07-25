// Consumer-side: single EV station detail with directions + call.
// Route: /ev/:id

import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  MapPin,
  Star,
  Loader2,
  Phone,
  Navigation,
  Sparkles,
  Clock,
  Plug,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  useEvReviews,
  useEvStation,
  useUserEvSessions,
} from "@/modules/ev/hooks";
import {
  AMENITY_LABEL,
  CONNECTOR_LABEL,
  type EvAmenity,
} from "@/modules/ev/types";
import { useAuthStore } from "@/store/auth.store";

const ConsumerEvStationDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: station, isLoading } = useEvStation(id);
  const { data: reviews = [] } = useEvReviews(id);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";
  const { data: userSessions = [] } = useUserEvSessions(userId);
  const hasCompletedHere =
    !!id &&
    userSessions.some(
      (s) => s.stationId === id && s.status === "completed",
    );
  // Fresh reviews first, only surface the most recent 3.
  const recentReviews = [...reviews]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 3);
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;
  const latestCompletedSession = hasCompletedHere
    ? [...userSessions]
        .filter((s) => s.stationId === id && s.status === "completed")
        .sort((a, b) => ((a.endedAt ?? "") < (b.endedAt ?? "") ? 1 : -1))[0]
    : undefined;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-[100dvh] max-w-md mx-auto px-6 flex flex-col items-center justify-center">
        <Zap className="w-8 h-8 text-muted-foreground" />
        <p className="mt-3 text-body-sm text-muted-foreground">
          Station not found.
        </p>
        <MobileButton className="mt-4" onClick={() => navigate("/ev")}>
          Back to stations
        </MobileButton>
      </div>
    );
  }

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-40">
      {/* Header */}
      <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-body font-bold text-foreground truncate">
          {station.name}
        </span>
      </header>

      {/* Hero */}
      <div className="px-4 py-4">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-border h-40 flex items-center justify-center">
          <Zap className="w-16 h-16 text-primary/50" />
        </div>

        <div className="mt-4">
          <p className="text-heading-md text-foreground">{station.name}</p>
          <p className="text-body-sm text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 shrink-0" />
            {station.address}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 text-body-sm font-bold text-foreground">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {station.rating.toFixed(1)}
              <span className="text-caption text-muted-foreground font-normal">
                ({station.reviewCount})
              </span>
            </span>
            <span className="text-caption text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {station.isOpen24x7
                ? "Open 24×7"
                : `${station.openTime} – ${station.closeTime}`}
            </span>
          </div>
        </div>
      </div>

      {/* Connectors */}
      <Section title="Connectors" icon={Plug}>
        <div className="grid grid-cols-1 gap-2">
          {station.connectors.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
            >
              <div>
                <p className="text-body-sm font-bold text-foreground">
                  {CONNECTOR_LABEL[c.type]}
                </p>
                <p className="text-caption text-muted-foreground">
                  {c.powerKw} kW · {c.count} gun{c.count === 1 ? "" : "s"}
                </p>
              </div>
              <span
                className={`text-caption font-bold px-2 py-1 rounded-lg ${
                  c.available > 0
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.available} free
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-body-sm text-muted-foreground">Rate</span>
            <span className="text-heading-sm text-foreground">
              ₹{station.pricing.amount}
              <span className="text-body-sm text-muted-foreground font-normal ml-1">
                /{station.pricing.unit === "per_kwh" ? "kWh" : "hr"}
              </span>
            </span>
          </div>
          {station.pricing.idleFeePerMinute ? (
            <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-border">
              <span className="text-caption text-muted-foreground">
                Idle fee (after charge complete)
              </span>
              <span className="text-body-sm text-foreground">
                ₹{station.pricing.idleFeePerMinute}/min
              </span>
            </div>
          ) : null}
          {station.pricing.taxPct ? (
            <p className="text-caption text-muted-foreground mt-2">
              + {station.pricing.taxPct}% GST
            </p>
          ) : null}
        </div>
      </Section>

      {/* Amenities */}
      {station.amenities.length > 0 && (
        <Section title="Amenities" icon={Sparkles}>
          <div className="flex flex-wrap gap-1.5">
            {station.amenities.map((a: EvAmenity) => (
              <span
                key={a}
                className="text-caption px-2.5 py-1 rounded-full bg-secondary text-foreground font-semibold"
              >
                {AMENITY_LABEL[a]}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Reviews */}
      <Section title="Reviews" icon={Star}>
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-body-sm text-muted-foreground">
              No reviews yet — be the first to rate this station.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-heading-sm text-foreground leading-none">
                  {avgRating?.toFixed(1) ?? "—"}
                </p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  {reviews.length} rating{reviews.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {recentReviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-caption text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-body-sm text-foreground mt-1.5">
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {hasCompletedHere && latestCompletedSession && (
          <button
            onClick={() =>
              navigate(`/ev/session/${latestCompletedSession.id}/receipt`)
            }
            className="mt-2 w-full text-caption font-semibold text-primary py-2 rounded-lg border border-primary/20 active:bg-primary/5"
          >
            Rate this station
          </button>
        )}
      </Section>

      {/* Sticky actions */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe space-y-2">
        <MobileButton
          fullWidth
          onClick={() => navigate(`/ev/stations/${station.id}/reserve`)}
          className="gap-1.5"
        >
          <Zap className="w-4 h-4" /> Reserve a charger
        </MobileButton>
        <div className="flex gap-2">
          {station.supportPhone && (
            <MobileButton
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${station.supportPhone}`)}
              className="flex-1 gap-1.5"
            >
              <Phone className="w-4 h-4" /> Call
            </MobileButton>
          )}
          <MobileButton
            variant="outline"
            size="sm"
            onClick={openDirections}
            className="flex-1 gap-1.5"
          >
            <Navigation className="w-4 h-4" /> Directions
          </MobileButton>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <section className="px-4 mt-4">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      <h3 className="text-body-sm font-bold text-foreground">{title}</h3>
    </div>
    {children}
  </section>
);

export default ConsumerEvStationDetailScreen;
