import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Settings2,
  Car,
  Calendar,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePartnerPassHolders, usePartnerSetup } from "@/api/partner";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

const PartnerMonthlyPassScreen = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"holders" | "config">("holders");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: setup } = usePartnerSetup();
  const [monthlyRate, setMonthlyRate] = useState(1500);

  // Sync monthlyRate from DB when setup loads
  useEffect(() => {
    if (setup?.monthly_pass_price != null) {
      setMonthlyRate(Number(setup.monthly_pass_price));
    }
  }, [setup]);

  const totalPasses = setup?.total_slots ?? 0;
  const { data: passHolders, isLoading } = usePartnerPassHolders();

  const filtered = (passHolders ?? []).filter(
    (p: any) =>
      (p.vehicle_registration ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (p.pass_reference ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = (passHolders ?? []).filter(
    (p: any) => p.status === "active",
  ).length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "bg-success/10", text: "text-success", label: "Active" };
      case "expired":
        return {
          bg: "bg-destructive/10",
          text: "text-destructive",
          label: "Expired",
        };
      case "cancelled":
        return {
          bg: "bg-muted",
          text: "text-muted-foreground",
          label: "Cancelled",
        };
      default:
        return { bg: "bg-warning/10", text: "text-warning", label: status };
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate("/partner/dashboard")}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Monthly Passes
        </h1>
      </header>

      {/* Summary */}
      <div className="px-4 pt-4 flex gap-3">
        <div className="flex-1 p-3 bg-card border border-border rounded-2xl text-center">
          <p className="text-heading-sm text-success">{activeCount}</p>
          <p className="text-caption text-muted-foreground">Active</p>
        </div>
        <div className="flex-1 p-3 bg-card border border-border rounded-2xl text-center">
          <p className="text-heading-sm text-primary">{totalPasses}</p>
          <p className="text-caption text-muted-foreground">Total Slots</p>
        </div>
        <div className="flex-1 p-3 bg-card border border-border rounded-2xl text-center">
          <p className="text-heading-sm text-warning">
            {Math.max(0, totalPasses - activeCount)}
          </p>
          <p className="text-caption text-muted-foreground">Available</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-3 flex bg-secondary rounded-xl p-1">
        {(["holders", "config"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
          >
            {t === "holders" ? (
              <>
                <Users className="w-3.5 h-3.5" /> Pass Holders
              </>
            ) : (
              <>
                <Settings2 className="w-3.5 h-3.5" /> Configuration
              </>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
        {tab === "holders" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle or pass ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="mt-2 text-body-sm text-muted-foreground">
                  No pass holders found
                </p>
              </div>
            ) : (
              filtered.map((holder: any, i: number) => {
                const style = getStatusStyle(holder.status);
                return (
                  <motion.div
                    key={holder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 bg-card border border-border rounded-2xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-body-sm font-bold text-foreground">
                            {holder.vehicle_registration ?? "Vehicle"}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}
                          >
                            {style.label}
                          </span>
                        </div>
                        <p className="text-caption text-muted-foreground">
                          Slot {holder.slot_number ?? "—"}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 text-caption text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {holder.start_date
                            ? new Date(holder.start_date).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                          {" – "}
                          {holder.end_date
                            ? new Date(holder.end_date).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </div>
                      </div>
                    </div>
                    <p className="text-caption text-muted-foreground mt-1.5">
                      ID: {holder.pass_reference ?? holder.id}
                    </p>
                  </motion.div>
                );
              })
            )}
          </>
        )}

        {tab === "config" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
              <p className="text-body font-bold text-foreground">
                Pass Configuration
              </p>
              <div>
                <label className="text-body-sm font-semibold text-foreground mb-1.5 block">
                  Monthly Rate (₹/month)
                </label>
                <Input
                  type="number"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(Number(e.target.value))}
                  className="rounded-xl"
                  min={100}
                  step={100}
                />
                <p className="text-caption text-muted-foreground mt-1">
                  Price per month for a parking pass.
                </p>
              </div>
              <MobileButton
                fullWidth
                loading={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await api.put("/partner/setup", {
                      monthly_pass_price: monthlyRate,
                    });
                    qc.invalidateQueries({ queryKey: ["partner-setup"] });
                    qc.invalidateQueries({ queryKey: ["passes-available"] });
                    toast.success("Monthly pass price updated!");
                  } catch (err: any) {
                    toast.error(
                      err?.response?.data?.error?.message || "Save failed",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Save Configuration
              </MobileButton>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-body-sm font-bold text-foreground">
                Revenue Estimate
              </p>
              <p className="text-caption text-muted-foreground mt-1">
                If all {totalPasses} passes sold:{" "}
                <span className="text-primary font-bold">
                  ₹{(totalPasses * monthlyRate).toLocaleString()}/month
                </span>
              </p>
              <p className="text-caption text-muted-foreground mt-0.5">
                Platform fee (10%): ₹
                {Math.round(totalPasses * monthlyRate * 0.1).toLocaleString()} ·
                Your earnings:{" "}
                <span className="text-success font-bold">
                  ₹
                  {Math.round(totalPasses * monthlyRate * 0.9).toLocaleString()}
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PartnerMonthlyPassScreen;
