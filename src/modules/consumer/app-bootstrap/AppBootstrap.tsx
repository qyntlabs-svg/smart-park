// Consumer app boot sweep.
//
// Some lifecycle rules can only be enforced after-the-fact (e.g. once the app
// starts back up after being closed for hours). This tiny mount-only
// component fires those sweeps once on boot and every time the tab regains
// focus.
//
// Currently swept:
//   - EV reservation hold expiry (`confirmed` past hold window → cancelled)
//   - EV reservation no-show grace expiry (30 min past requestedStart →
//     no_show)
//
// Both live in `modules/ev/store.ts` behind `sweepReservationLifecycle`.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sweepReservationLifecycle } from "@/modules/ev/store";

export const AppBootstrap = () => {
  const qc = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const runSweep = async () => {
      try {
        const changed = await sweepReservationLifecycle();
        if (cancelled) return;
        if (changed > 0) {
          // Invalidate any EV reservation-related query so screens re-fetch.
          qc.invalidateQueries({ queryKey: ["ev"] });
          qc.invalidateQueries({ queryKey: ["evReservations"] });
          qc.invalidateQueries({ predicate: (q) => {
            const k = q.queryKey?.[0];
            return typeof k === "string" && k.toLowerCase().includes("reserv");
          } });
        }
      } catch {
        /* best-effort — never crash the app because of a sweep */
      }
    };

    // Run on mount.
    runSweep();

    // Run again whenever the tab regains focus. Guarantees stale timers get
    // rechecked even if the user leaves the app for hours.
    const onFocus = () => runSweep();
    const onVisibility = () => {
      if (document.visibilityState === "visible") runSweep();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // qc is stable per QueryClientProvider; safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
