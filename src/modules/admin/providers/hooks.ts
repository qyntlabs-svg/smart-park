import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProviders, setProviderState } from "./store";
import type { ProviderState, ProviderTab } from "./types";

export const useProviders = (tab: ProviderTab, query?: string) =>
  useQuery({
    queryKey: ["admin-providers", tab, query ?? ""],
    queryFn: () => listProviders(tab, query),
  });

export const useSetProviderState = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      state,
      note,
    }: {
      id: string;
      state: ProviderState;
      note?: string;
    }) => setProviderState(id, state, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-providers"] }),
  });
};
