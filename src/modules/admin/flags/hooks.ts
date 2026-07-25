import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listFlags, updateFlag } from "./store";
import type { FeatureFlag } from "./types";

export const useAdminFlags = () =>
  useQuery({ queryKey: ["admin-feature-flags"], queryFn: listFlags });

export const useUpdateAdminFlag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      patch,
      updatedBy,
    }: {
      key: string;
      patch: Partial<FeatureFlag>;
      updatedBy: string;
    }) => updateFlag(key, patch, updatedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });
};
