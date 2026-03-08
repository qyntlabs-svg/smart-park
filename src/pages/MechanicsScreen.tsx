import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Star, MapPin, Clock, Phone, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const MOCK_MECHANICS = [
  { id: "1", name: "Kumar Auto Works", specialist: "Engine & Transmission", rating: 4.7, distance: "1.2 km", price: "₹300–₹800", services: ["Engine Repair", "Oil Change", "Brake Service"], available: true, phone: "+91 98765 00001" },
  { id: "2", name: "Raj Bike Service Center", specialist: "Two-Wheeler Expert", rating: 4.5, distance: "0.8 km", price: "₹150–₹500", services: ["Tyre Change", "Chain Service", "Electrical"], available: true, phone: "+91 98765 00002" },
  { id: "3", name: "A1 Car Care", specialist: "AC & Electrical", rating: 4.8, distance: "2.5 km", price: "₹500–₹2000", services: ["AC Repair", "Battery", "Wiring"], available: false, phone: "+91 98765 00003" },
  { id: "4", name: "Speed Motors Workshop", specialist: "Denting & Painting", rating: 4.3, distance: "3.1 km", price: "₹1000–₹5000", services: ["Body Work", "Painting", "Polishing"], available: true, phone: "+91 98765 00004" },
  { id: "5", name: "Green Auto Garage", specialist: "General Service", rating: 4.6, distance: "1.8 km", price: "₹200–₹1200", services: ["Full Service", "Wheel Alignment", "Suspension"], available: true, phone: "+91 98765 00005" },
];

const MechanicsScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h1 className="text-body font-bold text-foreground">Mechanics Nearby</h1>
        </div>
      </header>

      {/* Coming Soon Banner */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-bold text-foreground">Coming Soon!</p>
            <p className="text-caption text-muted-foreground">Book mechanics directly from the app. Here's a preview of what's coming.</p>
          </div>
        </div>
      </div>

      {/* Mechanics List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24 scrollbar-hide">
        {MOCK_MECHANICS.map((mech, i) => (
          <motion.div
            key={mech.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden"
          >
            {/* Availability badge */}
            <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-md text-caption font-semibold ${
              mech.available ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            }`}>
              {mech.available ? "Available" : "Busy"}
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0 pr-16">
                <p className="text-body-sm font-bold text-foreground truncate">{mech.name}</p>
                <p className="text-caption text-primary font-semibold">{mech.specialist}</p>
                <div className="mt-1.5 flex items-center gap-3 text-caption text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-warning fill-warning" /> {mech.rating}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {mech.distance}</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mech.services.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-caption font-medium text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-body-sm font-bold text-primary">{mech.price}</span>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-caption font-semibold text-primary">
                  <Phone className="w-3 h-3" /> Call
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-caption font-semibold text-primary-foreground">
                  Book <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default MechanicsScreen;
