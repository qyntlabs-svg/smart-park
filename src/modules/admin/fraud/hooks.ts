import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFraudTrend, listFlags, updateFlagStatus } from "./store";
import type { FlaggedAccount } from "./types";

export const useFraudFlags = () =>
  useQuery({
    queryKey: ["admin-fraud-flags"],
    queryFn: listFlags,
  });

export const useFraudTrend = () =>
  useQuery({
    queryKey: ["admin-fraud-trend"],
    queryFn: getFraudTrend,
  });

export const useUpdateFlagStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FlaggedAccount["status"] }) =>
      updateFlagStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fraud-flags"] }),
  });
};
