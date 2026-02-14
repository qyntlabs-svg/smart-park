import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Plus, MoreVertical, Car, Bike, Star,
  Pencil, Ban, Trash2, RefreshCw
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

interface Vehicle {
  id: string;
  number: string;
  nickname: string;
  type: "two_wheeler" | "four_wheeler";
  isDefault: boolean;
  status: "active" | "inactive";
}

const MOCK_VEHICLES: Vehicle[] = [
  { id: "1", number: "TN 01 AB 1234", nickname: "My Car", type: "four_wheeler", isDefault: true, status: "active" },
  { id: "2", number: "TN 12 XY 5678", nickname: "Office Bike", type: "two_wheeler", isDefault: false, status: "active" },
];

const MyVehiclesScreen = () => {
  const navigate = useNavigate();
  const [vehicles] = useState(MOCK_VEHICLES);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">My Vehicles</h1>
        <button onClick={() => navigate("/add-vehicle")} className="touch-target flex items-center justify-center">
          <Plus className="w-6 h-6 text-primary" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="w-[200px] h-[200px] rounded-full bg-primary/5 flex items-center justify-center">
              <Car className="w-24 h-24 text-muted-foreground/30" strokeWidth={1} />
            </div>
            <p className="mt-6 text-heading-sm text-foreground">No Vehicles Added Yet</p>
            <MobileButton className="mt-6" onClick={() => navigate("/add-vehicle")}>
              Add Your First Vehicle
            </MobileButton>
          </div>
        ) : (
          vehicles.map((v) => {
            const Icon = v.type === "two_wheeler" ? Bike : Car;
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card rounded-2xl p-5 shadow-sm border border-border relative ${
                  v.status === "inactive" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-bold text-foreground">{v.number}</p>
                    <p className="text-body-sm text-muted-foreground">{v.nickname}</p>
                    <div className="mt-2 flex gap-2">
                      {v.isDefault && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-caption font-semibold text-success">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-lg text-caption font-semibold ${
                        v.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {v.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMenuOpen(menuOpen === v.id ? null : v.id)}
                    className="touch-target flex items-center justify-center -mr-2"
                  >
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Action menu */}
                <AnimatePresence>
                  {menuOpen === v.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-4 top-14 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden"
                    >
                      {[
                        { icon: Pencil, label: "Edit Vehicle", action: () => navigate(`/vehicles/${v.id}/edit`) },
                        ...(!v.isDefault ? [{ icon: Star, label: "Set as Default", action: () => {} }] : []),
                        ...(v.status === "active"
                          ? [{ icon: Ban, label: "Temporarily Disable", action: () => {} }]
                          : [{ icon: RefreshCw, label: "Reactivate", action: () => {} }]),
                        { icon: Trash2, label: "Delete Permanently", action: () => {}, destructive: true },
                      ].map((item: any, i) => (
                        <button
                          key={i}
                          onClick={() => { setMenuOpen(null); item.action(); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-body-sm ${
                            item.destructive ? "text-destructive" : "text-foreground"
                          } active:bg-secondary`}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyVehiclesScreen;
