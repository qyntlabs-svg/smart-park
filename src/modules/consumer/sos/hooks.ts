// Hooks over the SOS mock store.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSosRequest,
  createSosRequest,
  getSosRequest,
  listUserSosRequests,
  tickSosLifecycle,
} from "./store";
import type { SosSituation } from "./types";

const KEYS = {
  all: ["sos"] as const,
  detail: (id: string) => ["sos", "detail", id] as const,
  user: (userId: string) => ["sos", "user", userId] as const,
};

export const useSosRequest = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => getSosRequest(id!),
    enabled: !!id,
  });

export const useUserSosRequests = (userId: string | undefined) =>
  useQuery({
    queryKey: KEYS.user(userId ?? ""),
    queryFn: () => listUserSosRequests(userId!),
    enabled: !!userId,
  });

export const useCreateSosRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      situation: SosSituation;
      notes?: string;
      origin: { lat: number; lng: number; label?: string };
      vehicleId?: string;
      vehicleRegistration?: string;
    }) => createSosRequest(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useCancelSosRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSosRequest(id),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

export const useTickSosLifecycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tickSosLifecycle(id),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};
