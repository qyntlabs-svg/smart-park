// Role-specific route guards for mechanic / worker / tow.
//
// Cursor guidance: don't touch `src/store/auth.store.ts` — mechanic, worker,
// and tow all self-manage their session in their own localStorage bucket
// (mechanicAuth / workerAuth / towOperatorAuth). These guards read those
// buckets directly and redirect to the correct entry screen when missing.
//
// Placement: mount around routes in `App.tsx`. Each guard is intentionally
// small so the layout / redirect story stays visible.

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Read `localStorage` synchronously with graceful JSON parse. Returns null
 * when the key is missing or the payload is unparseable — either way the
 * guard treats that as "not logged in" and redirects.
 */
function readSession<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

interface GuardProps {
  children: ReactNode;
}

/**
 * MechanicGuard — protects `/mechanic/*` and `/mechanic-os/*`.
 * Redirects to `/mechanic/login` if no local mechanic session is present.
 */
export const MechanicGuard = ({ children }: GuardProps) => {
  const location = useLocation();
  // `mechanicAuth` in localStorage is written by `setMechanicAuth` in
  // `src/lib/mechanic.ts` and uses `id` (see `MechanicAuth`), not `mechanicId`.
  const session = readSession<{ id?: string }>("mechanicAuth");
  if (!session?.id) {
    return (
      <Navigate to="/mechanic/login" state={{ from: location }} replace />
    );
  }
  return <>{children}</>;
};

/**
 * WorkerGuard — protects `/worker/*` except the invite entry
 * (`/worker/register/:token`). Workers are onboarded via mechanic invite
 * links so there's no standalone worker login page today; fall back to the
 * role picker if the session is missing.
 */
export const WorkerGuard = ({ children }: GuardProps) => {
  const location = useLocation();
  const session = readSession<{ workerId?: string }>("workerAuth");
  if (!session?.workerId) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

/**
 * TowGuard — protects `/tow/*` except `/tow/login` and `/tow/register`.
 * Reads the tow module's session (see `src/modules/tow/lib/tow.ts` →
 * `towOperatorAuth`) and redirects to `/tow/login` if absent.
 */
export const TowGuard = ({ children }: GuardProps) => {
  const location = useLocation();
  const session = readSession<{ operatorId?: string }>("towOperatorAuth");
  if (!session?.operatorId) {
    return <Navigate to="/tow/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
