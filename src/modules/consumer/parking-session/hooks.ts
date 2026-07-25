// React-query wrappers over the parking-session mock store.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  endParkingSession,
  extendParkingSession,
  getActiveParkingSession,
  getParkingSession,
  listUserParkingSessions,
  tickParkingSession,
} from "./store";
import type { ExtendParkingInput } from "./types";

const KEYS = {
  all: ["parking-session"] as const,
  detail: (id: string) => ["parking-session", "detail", id] as const,
  user: (userId: string) => ["parking-session", "user", userId] as const,
  active: (userId: string) => ["parking-session", "active", userId] as const,
};

export const useParkingSession = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => getParkingSession(id!),
    enabled: !!id,
  });

export const useUserParkingSessions = (userId: string | undefined) =>
  useQuery({
    queryKey: KEYS.user(userId ?? ""),
    queryFn: () => listUserParkingSessions(userId!),
    enabled: !!userId,
  });

export const useActiveParkingSession = (userId: string | undefined) =>
  useQuery({
    queryKey: KEYS.active(userId ?? ""),
    queryFn: () => getActiveParkingSession(userId!),
    enabled: !!userId,
  });

export const useTickParkingSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tickParkingSession(id),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

export const useExtendParkingSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExtendParkingInput) => extendParkingSession(input),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.sessionId) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

export const useEndParkingSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endParkingSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};
