// Consumer SOS store (C-41, C-42) — thin adapter over `shared/lib/sos-store.ts`.
//
// The shared SOS store is the single source of truth for a rescue request.
// This adapter preserves the pre-existing consumer public API so pages/hooks
// don't need to change:
//   createSosRequest / listUserSosRequests / getSosRequest /
//   advanceSosStatus / cancelSosRequest / tickSosLifecycle / quoteSos
//
// Shape translation:
//   Consumer UI uses `origin: { lat, lng, label }` and `vehicleRegistration`.
//   Shared store uses `location: { lat, lng, address }` and `vehicleLabel`.
//   Consumer expects `timeline: SosEvent[]`; shared stores it as `events`.
//
// All writes go to the shared store — so a Consumer SOS request created here
// shows up in the Tow Operator dispatch queue (T-02) and vice versa.

import {
  acceptSosRequest as sharedAcceptSosRequest,
  cancelSosRequest as sharedCancelSosRequest,
  createSosRequest as sharedCreateSosRequest,
  getSosRequest as sharedGetSosRequest,
  listSosRequests as sharedListSosRequests,
  updateSosRequest as sharedUpdateSosRequest,
  type SosRequest as SharedSosRequest,
  type SosEvent as SharedSosEvent,
} from "@/shared/lib/sos-store";
import { SOS_COST_TABLE, type SosRequest, type SosSituation, type SosStatus } from "./types";

// ---------- Consumer↔Shared shape adapter ----------

function toConsumer(r: SharedSosRequest): SosRequest {
  return {
    id: r.id,
    userId: r.userId,
    situation: r.situation,
    notes: r.notes,
    origin: {
      lat: r.location.lat,
      lng: r.location.lng,
      label: r.location.address,
    },
    vehicleId: r.vehicleId,
    vehicleRegistration: r.vehicleLabel,
    status: r.status,
    estimatedCost:
      r.estimatedCost ?? SOS_COST_TABLE[r.situation]?.base ?? 0,
    estimatedEtaMinutes:
      r.estimatedEtaMinutes ?? SOS_COST_TABLE[r.situation]?.eta ?? 0,
    driver: r.driver,
    timeline: (r.events ?? []) as SharedSosEvent[],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt ?? r.createdAt,
  };
}

// ---------- Public API ----------

export function quoteSos(situation: SosSituation): {
  cost: number;
  etaMinutes: number;
} {
  const q = SOS_COST_TABLE[situation];
  return { cost: q.base, etaMinutes: q.eta };
}

export async function listUserSosRequests(userId: string): Promise<SosRequest[]> {
  const all = await sharedListSosRequests({ userId });
  return all
    .map(toConsumer)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getSosRequest(id: string): Promise<SosRequest | null> {
  const r = await sharedGetSosRequest(id);
  return r ? toConsumer(r) : null;
}

export async function createSosRequest(input: {
  userId: string;
  situation: SosSituation;
  notes?: string;
  origin: { lat: number; lng: number; label?: string };
  vehicleId?: string;
  vehicleRegistration?: string;
}): Promise<SosRequest> {
  const now = new Date().toISOString();
  const quote = quoteSos(input.situation);
  const shared = await sharedCreateSosRequest({
    userId: input.userId,
    userPhone: input.userId,
    situation: input.situation,
    location: {
      lat: input.origin.lat,
      lng: input.origin.lng,
      address: input.origin.label ?? "Current location",
    },
    vehicleId: input.vehicleId,
    vehicleLabel: input.vehicleRegistration,
    notes: input.notes,
    estimatedCost: quote.cost,
    estimatedEtaMinutes: quote.etaMinutes,
    events: [
      {
        at: now,
        status: "searching",
        note: "Looking for nearest available operator…",
      },
    ],
  });
  return toConsumer(shared);
}

export async function advanceSosStatus(
  id: string,
  status: SosStatus,
  patch: Partial<SharedSosRequest> = {},
  note?: string,
): Promise<SosRequest | null> {
  const updated = await sharedUpdateSosRequest(
    id,
    { ...patch, status },
    {
      appendEvent: { at: new Date().toISOString(), status, note },
    },
  );
  return updated ? toConsumer(updated) : null;
}

export async function cancelSosRequest(id: string): Promise<SosRequest | null> {
  const updated = await sharedCancelSosRequest(
    id,
    "consumer",
    "You cancelled the request",
  );
  return updated ? toConsumer(updated) : null;
}

/**
 * Simulate a lifecycle tick — called by the live-status screen every few
 * seconds so the mock has motion:
 *   searching (5s+) → assigned → en_route → arrived → completed
 * Also nudges the mock driver location toward the consumer origin.
 */
export async function tickSosLifecycle(id: string): Promise<SosRequest | null> {
  const shared = await sharedGetSosRequest(id);
  if (!shared) return null;
  const req = toConsumer(shared);
  const ageSec = (Date.now() - new Date(req.createdAt).getTime()) / 1000;

  // Terminal states: don't advance further.
  if (req.status === "completed" || req.status === "cancelled") return req;

  const seedDriver = () => ({
    name: pickName(),
    phone: "+91 98765 90210",
    rating: 4.8,
    vehicle: "Tow truck TN 66 XX 9821",
    location: driftLocation(req.origin, 0.02),
  });

  if (req.status === "searching" && ageSec > 5) {
    // If a tow operator hasn't accepted, auto-assign a mock driver so the
    // consumer live view keeps moving during a demo without a real operator.
    return advanceSosStatus(
      id,
      "assigned",
      shared.driver ? {} : { driver: seedDriver() },
      "Operator matched — heading your way",
    );
  }
  if (req.status === "assigned" && ageSec > 10) {
    const nextDriver = req.driver
      ? {
          ...req.driver,
          location: driftLocation(req.driver.location, 0.006, req.origin),
        }
      : seedDriver();
    return advanceSosStatus(id, "en_route", { driver: nextDriver }, "En route");
  }
  if (req.status === "en_route") {
    if (!req.driver) return req;
    const nextLoc = driftLocation(req.driver.location, 0.005, req.origin);
    const distanceApprox = Math.hypot(
      nextLoc.lat - req.origin.lat,
      nextLoc.lng - req.origin.lng,
    );
    if (distanceApprox < 0.0005 || ageSec > 40) {
      return advanceSosStatus(
        id,
        "arrived",
        { driver: { ...req.driver, location: { lat: req.origin.lat, lng: req.origin.lng } } },
        "Operator arrived at your location",
      );
    }
    return advanceSosStatus(id, "en_route", {
      driver: { ...req.driver, location: nextLoc },
    });
  }
  if (req.status === "arrived" && ageSec > 55) {
    return advanceSosStatus(id, "completed", {}, "Assistance complete");
  }
  return req;
}

// ---- helpers ----

function pickName(): string {
  const names = ["Ravi Kumar", "Suresh Iyer", "Praveen Das", "Anjali M."];
  return names[Math.floor(Math.random() * names.length)];
}

function driftLocation(
  from: { lat: number; lng: number },
  amount: number,
  toward?: { lat: number; lng: number },
): { lat: number; lng: number } {
  if (!toward) {
    return {
      lat: from.lat + (Math.random() - 0.5) * amount,
      lng: from.lng + (Math.random() - 0.5) * amount,
    };
  }
  // Move ~30% of the way toward `toward`, jittered.
  const lat =
    from.lat + (toward.lat - from.lat) * 0.3 + (Math.random() - 0.5) * amount * 0.4;
  const lng =
    from.lng + (toward.lng - from.lng) * 0.3 + (Math.random() - 0.5) * amount * 0.4;
  return { lat, lng };
}

// Re-export shared accept for consumer callers that want to grant operator
// access from a consumer surface (unused today but kept stable for future).
export const acceptSosRequest = sharedAcceptSosRequest;
