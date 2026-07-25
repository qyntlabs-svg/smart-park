// Screen: W-05 · Primitives: Reservation, Vehicle, Location
// Route: /worker/jobs/:id

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bike,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  PlayCircle,
  Store,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMechanicBookings,
  updateMechanicBooking,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";
import {
  getWorkerAuth,
  getWorkerById,
} from "@/modules/worker/lib/workers";
import { haversineKm } from "@/shared/lib/geo";
import { pushNotification } from "@/shared/lib/notifications";

const inferJobType = (b: MechanicBooking) =>
  b.jobType || (b.serviceType === "doorstep" ? "mobile" : "in_shop");

const WorkerJobDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const worker = auth ? getWorkerById(auth.workerId) : null;
  const [tick, setTick] = useState(0);

  const booking = useMemo(
    () => getMechanicBookings().find((b) => b.id === id) ?? null,
    [id, tick],
  );

  useEffect(() => {
    if (!worker) navigate("/", { replace: true });
  }, [worker, navigate]);

  if (!worker) return null;

  if (!booking) {
    return (
      <Shell title="Job not found">
        <div className="p-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            This job no longer exists or was reassigned.
          </p>
          <button
            onClick={() => navigate("/worker/dashboard")}
            className="mt-4 text-primary font-semibold text-body-sm"
          >
            Back to dashboard
          </button>
        </div>
      </Shell>
    );
  }

  const distKm =
    worker.lat && worker.lng && booking.customerLocation
      ? haversineKm(
          { lat: worker.lat, lng: worker.lng },
          {
            lat: booking.customerLocation.lat,
            lng: booking.customerLocation.lng,
          },
        )
      : null;

  const setStatus = (status: MechanicBooking["status"]) => {
    updateMechanicBooking(booking.id, { status });
    pushNotification({
      audience: "consumer",
      audienceId: booking.customerPhone,
      title: `Service ${status.replace("_", " ")}`,
      body: `${worker.name} updated your job.`,
    });
    if (status === "completed") {
      pushNotification({
        audience: "owner",
        audienceId: booking.shopId,
        title: "Job completed",
        body: `${worker.name} completed ${booking.service}.`,
      });
    }
    toast.success(`Marked ${status.replace("_", " ")}`);
    setTick((t) => t + 1);
  };

  return (
    <Shell title="Job detail">
      <div className="px-5 py-4 space-y-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold text-foreground">
                {booking.customerName}
              </p>
              {booking.contactRevealed ? (
                <a
                  href={`tel:${booking.customerPhone.replace(/\s/g, "")}`}
                  className="text-caption text-primary font-semibold flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> {booking.customerPhone}
                </a>
              ) : (
                <p className="text-caption text-muted-foreground">
                  Contact hidden — accept to reveal.
                </p>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-md text-caption font-semibold bg-primary/10 text-primary capitalize">
              {booking.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-caption text-muted-foreground flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Service
          </p>
          <p className="text-body font-bold text-foreground mt-1">
            {booking.service}
          </p>
          <p className="text-primary font-bold mt-1">
            ₹{booking.price.toLocaleString("en-IN")}
          </p>
          {booking.vehicleCategory && (
            <p className="text-caption text-muted-foreground mt-1 flex items-center gap-1">
              <Car className="w-3 h-3" /> {booking.vehicleCategory}
            </p>
          )}
        </div>

        {booking.customerLocation && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-caption text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Job address
            </p>
            <p className="text-body-sm text-foreground mt-1">
              {booking.customerLocation.address}
            </p>
            {distKm !== null && (
              <p className="text-caption text-muted-foreground mt-1 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> {distKm.toFixed(1)} km from
                you
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/worker/jobs/${booking.id}/nav`)}
                className="h-10 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" /> In-app map
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.customerLocation.lat},${booking.customerLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                className="h-10 rounded-xl bg-secondary text-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" /> Google Maps
              </a>
            </div>
          </div>
        )}

        {/* Checklist preview link */}
        <button
          onClick={() => navigate(`/worker/jobs/${booking.id}/proof`)}
          className="w-full p-4 rounded-2xl bg-card border border-border flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-body-sm font-bold text-foreground">
              Open checklist & proof
            </p>
            <p className="text-caption text-muted-foreground">
              Complete tasks, upload photos, capture OTP.
            </p>
          </div>
        </button>

        {/* Actions */}
        {booking.status === "assigned" && (
          <button
            onClick={() => setStatus("on_the_way")}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
          >
            <PlayCircle className="w-4 h-4" /> Start · On the way
          </button>
        )}
        {booking.status === "on_the_way" && (
          <button
            onClick={() => navigate(`/worker/jobs/${booking.id}/proof`)}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
          >
            <PlayCircle className="w-4 h-4" /> Arrived · Verify OTP
          </button>
        )}
        {booking.status === "in_progress" && (
          <button
            onClick={() => navigate(`/worker/jobs/${booking.id}/proof`)}
            className="w-full h-11 rounded-xl bg-success text-white text-body-sm font-semibold flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-4 h-4" /> Finish & get customer signoff
          </button>
        )}

        <p className="text-caption text-muted-foreground text-center flex items-center justify-center gap-1">
          {inferJobType(booking) === "mobile" ? (
            <Bike className="w-3 h-3" />
          ) : (
            <Store className="w-3 h-3" />
          )}{" "}
          <Clock className="w-3 h-3" />{" "}
          {new Date(booking.date).toLocaleString("en-IN")}
        </p>
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

export default WorkerJobDetailScreen;
