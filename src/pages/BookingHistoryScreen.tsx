import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle2, Car } from "lucide-react";

const MOCK_HISTORY = [
  { id: "BK001", parking: "Phoenix Mall Parking", slot: "A-12", vehicle: "TN 01 AB 1234", date: "2026-02-20", duration: "2h 15m", amount: 90, status: "completed" },
  { id: "BK002", parking: "Grand Square Mall", slot: "B-05", vehicle: "TN 01 AB 1234", date: "2026-02-19", duration: "1h 30m", amount: 75, status: "completed" },
  { id: "BK003", parking: "Phoenix Mall Parking", slot: "A-08", vehicle: "TN 01 AB 1234", date: "2026-02-21", duration: "-", amount: 40, status: "active" },
];

const BookingHistoryScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">My Bookings</h1>
      </header>

      <div className="flex-1 p-4 space-y-3">
        {MOCK_HISTORY.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 bg-card border border-border rounded-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.status === "active" ? "bg-success/10" : "bg-secondary"}`}>
                  {b.status === "active" ? (
                    <Clock className="w-5 h-5 text-success" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-body-sm font-bold text-foreground">{b.parking}</p>
                  <p className="text-caption text-muted-foreground">Slot {b.slot} · {b.date}</p>
                </div>
              </div>
              <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${
                b.status === "active"
                  ? "bg-success/10 text-success"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {b.status === "active" ? "Active" : "Done"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-caption text-muted-foreground">{b.vehicle}</span>
              </div>
              <div className="text-right">
                <span className="text-body-sm font-bold text-foreground">₹{b.amount}</span>
                {b.status === "completed" && <span className="text-caption text-muted-foreground ml-2">{b.duration}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BookingHistoryScreen;
