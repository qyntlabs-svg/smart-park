import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveApplication,
  claimApplication,
  listApplications,
  rejectApplication,
} from "./store";
import type { KycStatus } from "./types";

export const useApplications = (filter?: KycStatus) =>
  useQuery({
    queryKey: ["admin-applications", filter ?? "all"],
    queryFn: () => listApplications(filter),
  });

export const useApproveApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewer }: { id: string; reviewer: string }) =>
      approveApplication(id, reviewer),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });
};

export const useRejectApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reviewer,
      reason,
    }: {
      id: string;
      reviewer: string;
      reason: string;
    }) => rejectApplication(id, reviewer, reason),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });
};

export const useClaimApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewer }: { id: string; reviewer: string }) =>
      claimApplication(id, reviewer),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });
};
