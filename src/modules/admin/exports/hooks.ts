import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApiKey,
  createExportJob,
  listApiKeys,
  listAuditLog,
  listExportJobs,
  revokeApiKey,
} from "./store";

export const useExportJobs = () =>
  useQuery({
    queryKey: ["admin-exports"],
    queryFn: listExportJobs,
    refetchInterval: 2000,
  });

export const useApiKeys = () =>
  useQuery({ queryKey: ["admin-api-keys"], queryFn: listApiKeys });

export const useAuditLog = () =>
  useQuery({ queryKey: ["admin-audit"], queryFn: listAuditLog });

export const useCreateExportJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExportJob,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exports"] });
      qc.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });
};

export const useCreateApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
      qc.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });
};

export const useRevokeApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
      qc.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });
};
