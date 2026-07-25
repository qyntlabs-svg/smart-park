import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inviteAdmin,
  listAdminUsers,
  removeAdmin,
  setAdminStatus,
  updateAdminRole,
} from "./store";
import type { AdminRole, AdminUser } from "./types";

export const useAdminUsers = () =>
  useQuery({ queryKey: ["admin-users"], queryFn: listAdminUsers });

export const useInviteAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteAdmin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useUpdateAdminRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminRole }) =>
      updateAdminRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useSetAdminStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminUser["status"] }) =>
      setAdminStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useRemoveAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeAdmin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};
