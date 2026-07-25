import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listIncidents, updateIncidentStatus } from "./store";
import type { IncidentStatus } from "./types";

export const useIncidents = (status?: IncidentStatus) =>
  useQuery({
    queryKey: ["admin-incidents", status ?? "all"],
    queryFn: () => listIncidents(status),
    refetchInterval: 15_000,
  });

export const useUpdateIncidentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateIncidentStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-incidents"] }),
  });
};
