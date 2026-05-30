import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  MoreVertical,
  Car,
  Bike,
  Star,
  Pencil,
  Ban,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  useVehicles,
  useDeleteVehicle,
  useSetDefaultVehicle,
  useUpdateVehicle,
} from "@/api/vehicles";
import { useQueryClient } from "@tanstack/react-query";

const MyVehiclesScreen = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: vehicles, isLoading } = useVehicles();
  const deleteVehicle = useDeleteVehicle();
  const setDefault = useSetDefaultVehicle();
  const updateVehicle = useUpdateVehicle();

  const handleSetDefault = async (id: string) => {
    setMenuOpen(null);
    await setDefault.mutateAsync(id);
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    setMenuOpen(null);
    await updateVehicle.mutateAsync({ id, is_active: !currentlyActive } as any);
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const handleDelete = async (id: string) => {
    setMenuOpen(null);
    if (!confirm("Delete this vehicle permanently?")) return;
    await deleteVehicle.mutateAsync(id);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center -ml-2"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">
          My Vehicles
        </h1>
        <button
          onClick={() => navigate("/add-vehicle")}
          className="touch-target flex items-center justify-center"
        >
          <Plus className="w-6 h-6 text-primary" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !vehicles?.length ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="w-[200px] h-[200px] rounded-full bg-primary/5 flex items-center justify-center">
              <Car
                className="w-24 h-24 text-muted-foreground/30"
                strokeWidth={1}
              />
            </div>
            <p className="mt-6 text-heading-sm text-foreground">
              No Vehicles Added Yet
            </p>
            <MobileButton
              className="mt-6"
              onClick={() => navigate("/add-vehicle")}
            >
              Add Your First Vehicle
            </MobileButton>
          </div>
        ) : (
          vehicles.map((v) => {
            const Icon = v.vehicle_type === "two_wheeler" ? Bike : Car;
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card rounded-2xl p-5 shadow-sm border border-border relative ${!v.is_active ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-bold text-foreground">
                      {v.registration_number}
                    </p>
                    <p className="text-body-sm text-muted-foreground">
                      {v.nickname || v.model || "—"}
                    </p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {v.is_default && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-caption font-semibold text-success">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-lg text-caption font-semibold ${v.is_active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                      >
                        {v.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-secondary text-caption font-semibold text-muted-foreground capitalize">
                        {v.vehicle_type === "two_wheeler"
                          ? "2-Wheeler"
                          : "4-Wheeler"}
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

                <AnimatePresence>
                  {menuOpen === v.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-4 top-14 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden min-w-[200px]"
                    >
                      {[
                        {
                          icon: Pencil,
                          label: "Edit Vehicle",
                          action: () => navigate(`/vehicles/${v.id}/edit`),
                        },
                        ...(!v.is_default
                          ? [
                              {
                                icon: Star,
                                label: "Set as Default",
                                action: () => handleSetDefault(v.id),
                              },
                            ]
                          : []),
                        {
                          icon: v.is_active ? Ban : RefreshCw,
                          label: v.is_active
                            ? "Temporarily Disable"
                            : "Reactivate",
                          action: () => handleToggleActive(v.id, v.is_active),
                        },
                        {
                          icon: Trash2,
                          label: "Delete Permanently",
                          action: () => handleDelete(v.id),
                          destructive: true,
                        },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setMenuOpen(null);
                            item.action();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-body-sm ${(item as any).destructive ? "text-destructive" : "text-foreground"} active:bg-secondary`}
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
