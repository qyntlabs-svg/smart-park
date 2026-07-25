// Screen: M-10 · Primitives: Reservation, Vehicle, Review, Payment
// Route: /mechanic/bookings/:id

import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  MapPin,
  Phone,
  Trash2,
  User,
  Users,
  X,
  Bike,
  Store,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  getMechanicShop,
  getShopBookings,
  updateMechanicBooking,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";
import {
  getWorkersForShop,
  type MechanicWorker,
} from "@/modules/worker/lib/workers";
import { pushNotification } from "@/shared/lib/notifications";

const inferJobType = (b: MechanicBooking) =>
  b.jobType || (b.serviceType === "doorstep" ? "mobile" : "in_shop");

const MechanicJobDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shop = getMechanicShop();
  const [tick, setTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const booking = useMemo(() => {
    if (!shop) return null;
    return getShopBookings(shop.id).find((b) => b.id === id) ?? null;
  }, [shop, id, tick]);

  const workers = useMemo(
    () => (shop ? getWorkersForShop(shop.id) : []),
    [shop, tick],
  );
  const [assignOpen, setAssignOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  if (!shop) {
    return (
      <Wrapper title="Job">
        <div className="p-8 text-center text-muted-foreground">
          Sign in as a mechanic first.
        </div>
      </Wrapper>
    );
  }

  if (!booking) {
    return (
      <Wrapper title="Job not found">
        <div className="p-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            This booking no longer exists.
          </p>
          <button
            onClick={() => navigate("/mechanic/bookings")}
            className="mt-4 text-primary font-semibold text-body-sm"
          >
            Back to bookings
          </button>
        </div>
      </Wrapper>
    );
  }

  const accept = () => {
    updateMechanicBooking(booking.id, {
      status: "accepted",
      contactRevealed: true,
    });
    toast.success("Booking accepted");
    setTick((t) => t + 1);
  };
  const reject = () => {
    updateMechanicBooking(booking.id, { status: "rejected" });
    toast.message("Booking rejected");
    setTick((t) => t + 1);
  };
  const markComplete = () => {
    updateMechanicBooking(booking.id, { status: "completed", paid: true });
    toast.success("Marked complete & paid");
    setTick((t) => t + 1);
  };
  const assignWorker = (w: MechanicWorker) => {
    updateMechanicBooking(booking.id, {
      workerId: w.id,
      workerName: w.name,
      status: booking.status === "pending" ? "assigned" : booking.status,
    });
    pushNotification({
      audience: "worker",
      audienceId: w.id,
      title: "New job assigned",
      body: `${booking.service} · ${booking.customerName}`,
    });
    setAssignOpen(false);
    setTick((t) => t + 1);
    toast.success(`Assigned to ${w.name}`);
  };

  const addPhoto = (file: File | undefined) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setPhotos((p) => [...p, r.result as string]);
    r.readAsDataURL(file);
  };

  return (
    <Wrapper title="Job detail">
      <div className="px-5 py-4 space-y-4">
        {/* Header card */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold text-foreground">
                {booking.customerName}
              </p>
              <p className="text-caption text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {booking.contactRevealed
                  ? booking.customerPhone
                  : "Accept to reveal"}
              </p>
              {booking.workerName && (
                <p className="text-caption text-muted-foreground">
                  Assigned: <span className="font-semibold text-foreground">{booking.workerName}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <span
                className={`px-2 py-0.5 rounded-md text-caption font-semibold ${
                  booking.status === "pending"
                    ? "bg-warning/10 text-warning"
                    : booking.status === "completed"
                      ? "bg-success/10 text-success"
                      : booking.status === "rejected" ||
                          booking.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                }`}
              >
                {booking.status}
              </span>
              <p className="text-caption text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                {inferJobType(booking) === "mobile" ? (
                  <>
                    <Bike className="w-3 h-3" /> Mobile
                  </>
                ) : (
                  <>
                    <Store className="w-3 h-3" /> In-shop
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Service card */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-caption text-muted-foreground">Service</p>
          <p className="text-body font-bold text-foreground">
            {booking.service}
          </p>
          {booking.services && booking.services.length > 1 && (
            <p className="text-caption text-muted-foreground">
              {booking.services.join(", ")}
            </p>
          )}
          <p className="text-primary text-body font-bold mt-2">
            ₹{booking.price.toLocaleString("en-IN")}
          </p>
          {booking.priceBreakdown && (
            <div className="mt-3 pt-3 border-t border-border grid gap-1 text-caption text-muted-foreground">
              <Line label="Labour" value={booking.priceBreakdown.labour} />
              <Line label="Travel" value={booking.priceBreakdown.travel} />
              <Line label="Service fee" value={booking.priceBreakdown.service} />
              {booking.priceBreakdown.nightSurcharge > 0 && (
                <Line
                  label="Night surcharge"
                  value={booking.priceBreakdown.nightSurcharge}
                />
              )}
            </div>
          )}
        </div>

        {/* Location */}
        {booking.customerLocation && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-caption text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Customer location
            </p>
            <p className="text-body-sm text-foreground mt-1">
              {booking.customerLocation.address}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${booking.customerLocation.lat},${booking.customerLocation.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-caption font-semibold text-primary"
            >
              Open in Google Maps →
            </a>
          </div>
        )}

        {/* Assign worker */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Worker
            </p>
            <button
              onClick={() => setAssignOpen((o) => !o)}
              className="text-caption text-primary font-semibold"
            >
              {booking.workerId ? "Reassign" : "Assign"}
            </button>
          </div>
          {booking.workerName ? (
            <p className="text-body-sm text-foreground mt-2">
              {booking.workerName}
            </p>
          ) : (
            <p className="text-caption text-muted-foreground mt-2">
              No worker assigned yet.
            </p>
          )}
          {assignOpen && (
            <div className="mt-3 space-y-2">
              {workers.length === 0 ? (
                <p className="text-caption text-muted-foreground">
                  No workers registered. Invite from the Workers page.
                </p>
              ) : (
                workers.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => assignWorker(w)}
                    className="w-full flex items-center gap-2 p-3 rounded-xl bg-secondary text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body-sm font-semibold text-foreground">
                        {w.name}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {w.phone} · {w.status}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4" /> Job photos
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-caption text-primary font-semibold flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Add
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/*"
              capture="environment"
              onChange={(e) => addPhoto(e.target.files?.[0])}
            />
          </div>
          {photos.length === 0 ? (
            <p className="mt-2 text-caption text-muted-foreground">
              Capture before/after photos to attach to this job.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
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
            </div>
          )}
        </div>

        {/* Actions */}
        {booking.status === "pending" &&
          inferJobType(booking) === "in_shop" && (
            <div className="grid grid-cols-2 gap-2">
              <MobileButton variant="outline" fullWidth onClick={reject}>
                <X className="w-4 h-4" /> Reject
              </MobileButton>
              <MobileButton fullWidth onClick={accept}>
                <Check className="w-4 h-4" /> Accept
              </MobileButton>
            </div>
          )}

        {(booking.status === "accepted" ||
          booking.status === "assigned" ||
          booking.status === "in_progress" ||
          booking.status === "on_the_way") && (
          <MobileButton fullWidth variant="success" onClick={markComplete}>
            <CheckCircle2 className="w-4 h-4" /> Mark complete & paid
          </MobileButton>
        )}
      </div>
    </Wrapper>
  );
};

const Wrapper = ({
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

const Line = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span>₹{value}</span>
  </div>
);

export default MechanicJobDetailScreen;
