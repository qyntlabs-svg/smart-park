import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPayoutOpsAggregate,
  listPayoutBatches,
  listPayoutExceptions,
  resolveException,
  runPayoutBatch,
} from "./store";

export const usePayoutBatches = () =>
  useQuery({
    queryKey: ["admin-payout-batches"],
    queryFn: listPayoutBatches,
  });

export const usePayoutExceptions = () =>
  useQuery({
    queryKey: ["admin-payout-exceptions"],
    queryFn: listPayoutExceptions,
  });

export const usePayoutOpsAggregate = () =>
  useQuery({
    queryKey: ["admin-payout-ops-agg"],
    queryFn: getPayoutOpsAggregate,
  });

export const useRunPayoutBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runPayoutBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payout-batches"] });
      qc.invalidateQueries({ queryKey: ["admin-payout-ops-agg"] });
    },
  });
};

export const useResolvePayoutException = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveException,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payout-exceptions"] });
      qc.invalidateQueries({ queryKey: ["admin-payout-ops-agg"] });
    },
  });
};
