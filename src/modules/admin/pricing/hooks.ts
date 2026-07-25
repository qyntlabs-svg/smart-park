import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPromos,
  listSubsidies,
  listTakeRates,
  togglePromo,
  toggleSubsidy,
  updateTakeRate,
} from "./store";
import type { TakeRate } from "./types";

export const useTakeRates = () =>
  useQuery({ queryKey: ["admin-take-rates"], queryFn: listTakeRates });

export const useUpdateTakeRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      patch,
    }: {
      kind: TakeRate["kind"];
      patch: Partial<TakeRate>;
    }) => updateTakeRate(kind, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-take-rates"] }),
  });
};

export const useSubsidies = () =>
  useQuery({ queryKey: ["admin-subsidies"], queryFn: listSubsidies });

export const useToggleSubsidy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleSubsidy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-subsidies"] }),
  });
};

export const usePromos = () =>
  useQuery({ queryKey: ["admin-promos"], queryFn: listPromos });

export const useTogglePromo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: togglePromo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promos"] }),
  });
};
