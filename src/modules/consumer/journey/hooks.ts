// Hooks for journey planner (C-45) + one-tap (C-46).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmJourney,
  getJourney,
  listJourneys,
  rebookJourney,
  saveJourney,
} from "./store";
import type { Journey } from "./types";

const KEYS = {
  all: ["journeys"] as const,
  user: (userId: string) => ["journeys", "user", userId] as const,
  detail: (id: string) => ["journeys", "detail", id] as const,
};

export const useJourneys = (userId: string | undefined) =>
  useQuery({
    queryKey: KEYS.user(userId ?? ""),
    queryFn: () => listJourneys(userId!),
    enabled: !!userId,
  });

export const useJourney = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => getJourney(id!),
    enabled: !!id,
  });

export const useSaveJourney = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (j: Journey) => saveJourney(j),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useConfirmJourney = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmJourney(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useRebookJourney = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rebookJourney(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};
