// Screen: C-53 · Primitives: Provider, Payment, Reservation
//
// List of networks bridged (mock). "Your last charge on Network X was billed
// via us." Trust surface — the Visa-pattern neutrality made visible.
//
// Route: /roaming

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Globe2,
  ShieldCheck,
  Radio,
  Ban,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { useRoamingNetworks } from "@/modules/consumer/preferences/hooks";

const RoamingStatusScreen = () => {
  const navigate = useNavigate();
  const { data: networks = [], isLoading, isError, refetch } = useRoamingNetworks();

  const bridged = networks.filter((n) => n.bridged);
  const notBridged = networks.filter((n) => !n.bridged);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-16">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Roaming
        </h1>
      </header>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/15 to-emerald-500/10 border border-primary/25 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Globe2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-body font-bold text-foreground">
              One app, {bridged.length}+ networks
            </p>
            <p className="text-caption text-muted-foreground">
              We route your charge through partner networks and settle billing
              on your behalf.
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load roaming networks
          </p>
          <MobileButton
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Retry
          </MobileButton>
        </div>
      ) : networks.length === 0 ? (
        <div className="mx-4 mt-6 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-body-sm font-bold text-foreground">
            No networks yet
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Roaming partners will appear here as we onboard them.
          </p>
        </div>
      ) : (
        <>
          {/* Bridged */}
          <div className="mx-4 mt-6">
            <p className="text-body-sm font-bold text-foreground">
              Bridged networks · {bridged.length}
            </p>
            <div className="mt-2 space-y-2">
              {bridged.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 rounded-2xl border border-border bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Radio className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-body-sm font-bold text-foreground truncate">
                          {n.name}
                        </p>
                        {n.billsThroughUs && (
                          <span className="text-caption font-bold text-emerald-600 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10">
                            <ShieldCheck className="w-3 h-3" /> One-bill
                          </span>
                        )}
                      </div>
                      <p className="text-caption text-muted-foreground">
                        {n.stationsCount.toLocaleString()} stations bridged
                      </p>
                      {n.lastChargeAt && (
                        <p className="mt-2 text-caption text-primary font-semibold">
                          Last charge on {n.name} —{" "}
                          {n.lastChargeKwh?.toFixed(0)} kWh · ₹
                          {n.lastChargeAmount} · billed via us
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Not bridged */}
          {notBridged.length > 0 && (
            <div className="mx-4 mt-6">
              <p className="text-body-sm font-bold text-foreground">
                Not yet bridged
              </p>
              <div className="mt-2 space-y-2">
                {notBridged.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl border border-dashed border-border bg-card opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Ban className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-body-sm font-bold text-foreground">
                          {n.name}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          We're working on adding this network
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoamingStatusScreen;
