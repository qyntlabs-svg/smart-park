import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inviteStaff,
  listStaff,
  revokeStaff,
  updateStaffStatus,
} from "./store";
import type { StaffStatus } from "./types";

export const useStaff = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-staff", partnerId],
    queryFn: () => listStaff(partnerId!),
    enabled: !!partnerId,
  });

export const useInviteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteStaff,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-staff", v.partnerId] }),
  });
};

export const useUpdateStaffStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      partnerId,
      staffId,
      status,
    }: {
      partnerId: string;
      staffId: string;
      status: StaffStatus;
    }) => updateStaffStatus(partnerId, staffId, status),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-staff", v.partnerId] }),
  });
};

export const useRevokeStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      partnerId,
      staffId,
    }: {
      partnerId: string;
      staffId: string;
    }) => revokeStaff(partnerId, staffId),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-staff", v.partnerId] }),
  });
};
