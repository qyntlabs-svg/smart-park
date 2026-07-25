// React-query hooks over the shared SOS store.
// Both the Consumer SOS screens (C-41 /sos, C-42 /sos/:id) and the Tow
// Operator screens (T-02 dispatch, T-03 active, T-04 proof) consume these.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptSosRequest,
  cancelSosRequest,
  createSosRequest,
  getSosRequest,
  listSosRequests,
  updateSosRequest,
  type CreateSosInput,
  type SosListFilter,
  type SosRequest,
} from "./sos-store";

const KEYS = {
  all: ["sos"] as const,
  list: (filter: SosListFilter) => ["sos", "list", filter] as const,
  detail: (id: string) => ["sos", "detail", id] as const,
};

/** Poll the SOS list — used by the Tow dispatch queue. */
export const useSosRequests = (
  filter: SosListFilter = {},
  opts: { pollMs?: number } = {},
) =>
  useQuery({
    queryKey: KEYS.list(filter),
    queryFn: () => listSosRequests(filter),
    refetchInterval: opts.pollMs ?? 3000,
    staleTime: 0,
  });

export const useSosRequest = (
  id: string | undefined,
  opts: { pollMs?: number } = {},
) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => getSosRequest(id!),
    enabled: !!id,
    refetchInterval: opts.pollMs ?? 3000,
    staleTime: 0,
  });

export const useCreateSosRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSosInput) => createSosRequest(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useAcceptSosRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      operator,
    }: {
      id: string;
      operator: { id: string; name: string; plate: string };
    }) => acceptSosRequest(id, operator),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
};

export const useUpdateSosRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<SosRequest>;
    }) => updateSosRequest(id, patch),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
};

export const useCancelSosRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      by,
      reason,
    }: {
      id: string;
      by: "consumer" | "operator";
      reason?: string;
    }) => cancelSosRequest(id, by, reason),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
};
