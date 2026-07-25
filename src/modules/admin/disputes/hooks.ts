import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminDisputes, resolveAdminDispute } from "./store";
import type { AdminDisputeStatus } from "./types";

export const useAdminDisputes = (status?: AdminDisputeStatus) =>
  useQuery({
    queryKey: ["admin-disputes", status ?? "all"],
    queryFn: () => listAdminDisputes(status),
  });

export const useResolveAdminDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveAdminDispute,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-disputes"] }),
  });
};
