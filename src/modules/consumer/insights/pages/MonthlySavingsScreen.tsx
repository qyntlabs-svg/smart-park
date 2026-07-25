// Screen: C-49 · Primitives: Payment, Reservation
//
// "You saved ₹1,240 this month vs petrol". Shareable card + recharts bar for
// the last 6 months.
//
// Route: /insights/savings

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Loader2, Share2, Sparkles } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { useSavingsMonths } from "@/modules/consumer/insights/hooks";

const MonthlySavingsScreen = () => {
  const navigate = useNavigate();
  const { data: months = [], isLoading, isError, refetch } = useSavingsMonths();

  const current = months[months.length - 1];
  const total = useMemo(() => months.reduce((n, m) => n + m.saved, 0), [months]);

  const handleShare = async () => {
    const text = `I saved ₹${current?.saved ?? 0} this month vs petrol using SmartPark 🎉`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My SmartPark savings",
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to share");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-24">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Monthly savings
        </h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load savings
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
      ) : months.length === 0 ? (
        <div className="mx-4 mt-6 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-body-sm font-bold text-foreground">
            No savings yet
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Charge or drive with SmartPark to start tracking.
          </p>
        </div>
      ) : (
        <>
          {/* Big shareable card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/15 border-2 border-primary/25 p-6 text-center overflow-hidden relative"
          >
            <div className="absolute top-2 right-2">
              <Sparkles className="w-4 h-4 text-primary/60" />
            </div>
            <p className="text-caption font-bold uppercase tracking-wider text-primary">
              This month
            </p>
            <p className="mt-1 text-[54px] font-extrabold text-foreground leading-none">
              ₹{current?.saved ?? 0}
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              saved vs petrol · at ₹6/km baseline
            </p>
            <MobileButton
              className="mt-4 gap-1.5"
              onClick={handleShare}
              variant="secondary"
            >
              <Share2 className="w-4 h-4" />
              Share
            </MobileButton>
          </motion.div>

          {/* 6-month chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-baseline justify-between">
              <p className="text-body-sm font-bold text-foreground">
                Last 6 months
              </p>
              <p className="text-caption text-muted-foreground">
                Total ₹{total.toLocaleString()}
              </p>
            </div>
            <div className="mt-3" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  />
                  <Bar dataKey="saved" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Method */}
          <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-body-sm font-bold text-foreground">
              How we compute this
            </p>
            <p className="text-caption text-muted-foreground mt-1 leading-relaxed">
              We compare your actual EV energy cost to the equivalent petrol cost at
              ₹6/km (ICE baseline for city driving). Petrol prices change monthly, so
              this is directional.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlySavingsScreen;
