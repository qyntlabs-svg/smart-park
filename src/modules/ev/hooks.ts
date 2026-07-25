// React-query wrappers over the EV mock store. Consumers should always use
// these hooks rather than importing from ./store directly, so that when we
// swap the mock for real fetch calls the components don't need to change.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChargerStatus,
  EvReview,
  EvSearchFilters,
  EvStation,
  EvVehicleProfile,
} from "./types";
import {
  cancelReservation,
  confirmReservation,
  createReservation,
  createReview,
  createStation,
  deleteStation,
  endSession,
  getReservation,
  getReviewsForStation,
  getSession,
  getSessionByReservation,
  getStation,
  getStationSessions,
  getUserReservations,
  getUserSessions,
  getVehicleProfile,
  listStations,
  listStationsByPartner,
  listVehicleProfiles,
  markAtRisk,
  markNoShow,
  setChargerStatus,
  startSession,
  tickTelemetry,
  toggleStationStatus,
  updateStation,
  upsertVehicleProfile,
} from "./store";

const KEYS = {
  all: ["ev-stations"] as const,
  list: (f: EvSearchFilters, origin?: { lat: number; lng: number }) =>
    ["ev-stations", "list", f, origin] as const,
  byPartner: (partnerId: string) =>
    ["ev-stations", "partner", partnerId] as const,
  detail: (id: string) => ["ev-stations", "detail", id] as const,
  reservation: (id: string) => ["ev-reservation", id] as const,
  userReservations: (userId: string) => ["ev-reservations", "user", userId] as const,
  session: (id: string) => ["ev-session", id] as const,
  sessionByReservation: (rid: string) =>
    ["ev-session", "reservation", rid] as const,
  userSessions: (userId: string) => ["ev-sessions", "user", userId] as const,
  stationSessions: (stationId: string) =>
    ["ev-sessions", "station", stationId] as const,
  reviews: (stationId: string) => ["ev-reviews", stationId] as const,
  vehicleProfile: (vid: string) => ["ev-vehicle-profile", vid] as const,
  allVehicleProfiles: ["ev-vehicle-profiles"] as const,
};

// ---------- Stations ----------

export const useEvStations = (
  filters: EvSearchFilters = {},
  origin?: { lat: number; lng: number },
) =>
  useQuery({
    queryKey: KEYS.list(filters, origin),
    queryFn: () => listStations(filters, origin),
    staleTime: 30_000,
  });

export const useEvStationsByPartner = (partnerId: string | undefined) =>
  useQuery({
    queryKey: KEYS.byPartner(partnerId ?? ""),
    queryFn: () => listStationsByPartner(partnerId!),
    enabled: !!partnerId,
  });

export const useEvStation = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => getStation(id!),
    enabled: !!id,
  });

export const useCreateEvStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStation,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useUpdateEvStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EvStation> }) =>
      updateStation(id, patch),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
};

export const useDeleteEvStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteStation,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useToggleEvStationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleStationStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

// ---------- Chargers ----------

export const useSetChargerStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      stationId: string;
      connectorId: string;
      gunIndex: number;
      status: ChargerStatus;
    }) =>
      setChargerStatus(
        input.stationId,
        input.connectorId,
        input.gunIndex,
        input.status,
      ),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.stationId) });
    },
  });
};

// ---------- Reservations ----------

export const useEvReservation = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.reservation(id ?? ""),
    queryFn: () => getReservation(id!),
    enabled: !!id,
  });

export const useUserEvReservations = (userId: string | undefined) =>
  useQuery({
    queryKey: KEYS.userReservations(userId ?? ""),
    queryFn: () => getUserReservations(userId!),
    enabled: !!userId,
  });

export const useCreateEvReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-reservation"] });
      qc.invalidateQueries({ queryKey: ["ev-reservations"] });
    },
  });
};

export const useConfirmEvReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId?: string }) =>
      confirmReservation(id, paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-reservation"] });
      qc.invalidateQueries({ queryKey: ["ev-reservations"] });
      qc.invalidateQueries({ queryKey: ["ev-session"] });
      qc.invalidateQueries({ queryKey: ["ev-sessions"] });
    },
  });
};

export const useCancelEvReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-reservation"] });
      qc.invalidateQueries({ queryKey: ["ev-reservations"] });
    },
  });
};

export const useMarkNoShow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNoShow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-reservation"] });
      qc.invalidateQueries({ queryKey: ["ev-reservations"] });
    },
  });
};

export const useMarkAtRisk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      reason: "charger_offline" | "no_show" | "user_cancelled" | "vendor_cancelled";
      message: string;
    }) => markAtRisk(input.id, input.reason, input.message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-reservation"] });
      qc.invalidateQueries({ queryKey: ["ev-reservations"] });
    },
  });
};

// ---------- Sessions ----------

export const useEvSession = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.session(id ?? ""),
    queryFn: () => getSession(id!),
    enabled: !!id,
  });

export const useSessionByReservation = (reservationId: string | undefined) =>
  useQuery({
    queryKey: KEYS.sessionByReservation(reservationId ?? ""),
    queryFn: () => getSessionByReservation(reservationId!),
    enabled: !!reservationId,
  });

export const useUserEvSessions = (userId: string | undefined) =>
  useQuery({
    queryKey: KEYS.userSessions(userId ?? ""),
    queryFn: () => getUserSessions(userId!),
    enabled: !!userId,
  });

export const useStationEvSessions = (stationId: string | undefined) =>
  useQuery({
    queryKey: KEYS.stationSessions(stationId ?? ""),
    queryFn: () => getStationSessions(stationId!),
    enabled: !!stationId,
  });

export const useStartEvSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => startSession(reservationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-session"] });
      qc.invalidateQueries({ queryKey: ["ev-sessions"] });
      qc.invalidateQueries({ queryKey: ["ev-reservation"] });
      qc.invalidateQueries({ queryKey: ["ev-reservations"] });
    },
  });
};

export const useEndEvSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-session"] });
      qc.invalidateQueries({ queryKey: ["ev-sessions"] });
      qc.invalidateQueries({ queryKey: ["ev-reservation"] });
      qc.invalidateQueries({ queryKey: ["ev-reservations"] });
    },
  });
};

/** Manual telemetry tick (used by the polling UI). */
export const useTickTelemetry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => tickTelemetry(sessionId),
    onSuccess: (_r, sessionId) => {
      qc.invalidateQueries({ queryKey: KEYS.session(sessionId) });
    },
  });
};

// ---------- Reviews ----------

export const useEvReviews = (stationId: string | undefined) =>
  useQuery({
    queryKey: KEYS.reviews(stationId ?? ""),
    queryFn: () => getReviewsForStation(stationId!),
    enabled: !!stationId,
  });

export const useCreateEvReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<EvReview, "id" | "createdAt">) =>
      createReview(input),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.reviews(vars.stationId) });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.stationId) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

// ---------- Vehicle profiles ----------

export const useEvVehicleProfile = (vehicleId: string | undefined) =>
  useQuery({
    queryKey: KEYS.vehicleProfile(vehicleId ?? ""),
    queryFn: () => getVehicleProfile(vehicleId!),
    enabled: !!vehicleId,
  });

export const useEvVehicleProfiles = () =>
  useQuery({
    queryKey: KEYS.allVehicleProfiles,
    queryFn: () => listVehicleProfiles(),
  });

export const useUpsertEvVehicleProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: EvVehicleProfile) => upsertVehicleProfile(profile),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ev-vehicle-profile"] });
      qc.invalidateQueries({ queryKey: KEYS.allVehicleProfiles });
    },
  });
};
