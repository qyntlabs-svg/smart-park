import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDisputes, resolveDispute, respondToDispute } from "./store";

export const useDisputes = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-disputes", partnerId],
    queryFn: () => listDisputes(partnerId!),
    enabled: !!partnerId,
  });

export const useRespondToDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: respondToDispute,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-disputes", v.partnerId] }),
  });
};

export const useResolveDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveDispute,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-disputes", v.partnerId] }),
  });
};
