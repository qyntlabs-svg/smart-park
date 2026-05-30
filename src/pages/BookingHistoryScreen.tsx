import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Car,
  QrCode,
  Loader2,
  XCircle,
} from "lucide-react";
import { useBookings } from "@/api/bookings";

const BookingHistoryScreen = () => {
  const navigate = useNavigate();
  const { data: bookings, isLoading } = useBookings();

  const handleViewQR = (b: any) => {
    // Only show QR for confirmed/active bookings — pending_payment QR is not valid yet
    if (b.status === "pending_payment") return;
    navigate("/booking-qr", {
      state: {
        bookingId: b.booking_reference,
        qrToken: b.qr_token,
        slot: b.slot_number,
        parking: b.facility_name,
        vehicle: b.vehicle_registration,
        duration: "-",
        price: b.total_amount,
        paidAt: b.created_at,
        paymentMethod: b.payment_status === "paid" ? "upi" : "cash",
      },
    });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          My Bookings
        </h1>
      </header>

      <div className="flex-1 p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !bookings?.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <XCircle className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-body-sm text-muted-foreground">
              No bookings yet
            </p>
          </div>
        ) : (
          bookings.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 bg-card border border-border rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.status === "active" ? "bg-success/10" : "bg-secondary"}`}
                  >
                    {b.status === "active" ? (
                      <Clock className="w-5 h-5 text-success" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-bold text-foreground">
                      {b.facility_name ?? "Parking"}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {b.slot_number ? `Slot ${b.slot_number} · ` : ""}
                      {new Date(b.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-caption font-semibold px-2 py-0.5 rounded-full ${b.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
                >
                  {b.status === "active"
                    ? "Active"
                    : b.status === "confirmed"
                      ? "Confirmed"
                      : b.status === "pending_payment"
                        ? "Awaiting Payment"
                        : b.status === "completed"
                          ? "Completed"
                          : b.status === "cancelled"
                            ? "Cancelled"
                            : b.status === "failed"
                              ? "Failed"
                              : b.status === "expired"
                                ? "Expired"
                                : b.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span className="text-caption text-muted-foreground">
                    {b.vehicle_registration ?? "Vehicle"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {b.status !== "cancelled" &&
                    b.status !== "pending_payment" && (
                      <button
                        onClick={() => handleViewQR(b)}
                        className="flex items-center gap-1 text-caption font-semibold text-primary"
                      >
                        <QrCode className="w-4 h-4" /> View QR
                      </button>
                    )}
                  <span className="text-body-sm font-bold text-foreground">
                    ₹{b.total_amount}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingHistoryScreen;
