import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Bike,
  PlayCircle,
  Phone,
  Star,
  QrCode,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Textarea } from "@/components/ui/textarea";
import {
  getMechanicBookings,
  updateMechanicBooking,
  addReviewToShop,
  type MechanicBooking,
} from "@/lib/mechanic";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

const STEPS: { key: MechanicBooking["status"]; label: string; icon: typeof Search }[] = [
  { key: "searching", label: "Looking for a mechanic", icon: Search },
  { key: "assigned", label: "Mechanic found", icon: CheckCircle2 },
  { key: "on_the_way", label: "On the way", icon: Bike },
  { key: "in_progress", label: "Service in progress", icon: PlayCircle },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

const ConsumerMobileMechanicStatusScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [tick, setTick] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(i);
  }, []);

  const booking = useMemo(
    () => getMechanicBookings().find((b) => b.id === id) || null,
    [id, tick],
  );

  if (!booking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-body text-muted-foreground">Request not found.</p>
          <button className="mt-4 text-primary font-semibold" onClick={() => navigate("/mechanics")}>Back</button>
        </div>
      </div>
    );
  }

  const currentIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === booking.status),
  );

  const cancel = () => {
    if (!confirm("Cancel this request?")) return;
    updateMechanicBooking(booking.id, { status: "cancelled" });
    toast.message("Request cancelled");
    setTick((t) => t + 1);
  };

  const submitReview = () => {
    if (!comment.trim()) return toast.error("Add a short comment");
    addReviewToShop(booking.shopId === "mobile" ? booking.workerId || "mobile" : booking.shopId, {
      user: user?.name || "Customer",
      rating,
      comment: comment.trim(),
      workerId: booking.workerId,
      workerName: booking.workerName,
    });
    toast.success("Review posted");
    setReviewOpen(false);
    setComment("");
    setRating(5);
  };

  const upiUri = `upi://pay?pa=mobile-mechanic@upi&pn=${encodeURIComponent(
    booking.workerName || "Mechanic",
  )}&am=${booking.price}&cu=INR&tn=${encodeURIComponent(booking.service)}`;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate("/mechanics")} className="touch-target"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">Mobile Mechanic</h1>
      </header>

      <div className="px-5 py-5 space-y-4 flex-1 overflow-y-auto scrollbar-hide">
        {booking.status === "cancelled" ? (
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive font-semibold text-body-sm">
            Request cancelled.
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
            {STEPS.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.key}
                  initial={false}
                  animate={{ opacity: done || active ? 1 : 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      done || active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "animate-pulse" : ""}`} />
                  </div>
                  <p
                    className={`text-body-sm ${
                      active ? "font-bold text-foreground" : done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <p className="text-body-sm font-bold text-foreground">{booking.service}</p>
          <p className="text-caption text-muted-foreground">{booking.customerLocation?.address}</p>
          {booking.priceBreakdown && (
            <div className="text-caption text-muted-foreground space-y-0.5 mt-2">
              <p>Labour: ₹{booking.priceBreakdown.labour}</p>
              <p>Travel: ₹{booking.priceBreakdown.travel}</p>
              <p>Service: ₹{booking.priceBreakdown.service}</p>
              {booking.priceBreakdown.nightSurcharge > 0 && (
                <p>Night surcharge: ₹{booking.priceBreakdown.nightSurcharge}</p>
              )}
            </div>
          )}
          <p className="text-body font-bold text-primary mt-1">Total ₹{booking.price}</p>
        </div>

        {booking.workerName && booking.status !== "searching" && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-caption text-muted-foreground">Assigned mechanic</p>
            <p className="text-body-sm font-bold text-foreground">{booking.workerName}</p>
            {booking.contactRevealed && (
              <a href={`tel:${booking.customerPhone}`} className="text-caption text-primary flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" /> Call mechanic
              </a>
            )}
          </div>
        )}

        {(booking.status === "in_progress" || booking.status === "completed") && !booking.paid && (
          <MobileButton fullWidth onClick={() => setPayOpen(true)}>
            <QrCode className="w-4 h-4 mr-1" /> Pay ₹{booking.price} via UPI
          </MobileButton>
        )}
        {booking.paid && (
          <p className="text-caption text-success font-semibold text-center">✓ Payment sent</p>
        )}

        {booking.status === "completed" && (
          <MobileButton fullWidth variant="outline" onClick={() => setReviewOpen(true)}>
            <Star className="w-4 h-4 mr-1" /> Leave a review
          </MobileButton>
        )}

        {(booking.status === "searching" || booking.status === "assigned") && (
          <button onClick={cancel} className="w-full h-11 rounded-xl bg-destructive/10 text-destructive font-semibold text-body-sm flex items-center justify-center gap-1">
            <X className="w-4 h-4" /> Cancel request
          </button>
        )}
      </div>

      {payOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setPayOpen(false)}>
          <div className="w-full max-w-md bg-card rounded-3xl p-6 text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-body font-bold">Pay ₹{booking.price}</p>
            <div className="flex justify-center py-2">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={upiUri} size={200} />
              </div>
            </div>
            <a href={upiUri} className="block w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center">
              Open UPI app
            </a>
            <MobileButton variant="outline" fullWidth onClick={() => { updateMechanicBooking(booking.id, { paid: true }); setPayOpen(false); toast.success("Marked as paid"); }}>
              I've paid
            </MobileButton>
            <button onClick={() => setPayOpen(false)} className="w-full h-10 text-body-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {reviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setReviewOpen(false)}>
          <div className="w-full max-w-md bg-card rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-body font-bold">Rate {booking.workerName || "your mechanic"}</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={`w-9 h-9 ${n <= rating ? "text-warning fill-warning" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others about the service…" rows={4} className="rounded-xl" />
            <MobileButton fullWidth onClick={submitReview}>Submit review</MobileButton>
            <button onClick={() => setReviewOpen(false)} className="w-full h-10 text-body-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerMobileMechanicStatusScreen;