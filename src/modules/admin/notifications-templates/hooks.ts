import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listTemplates, updateTemplate } from "./store";
import type { NotificationTemplate } from "./types";

export const useNotificationTemplates = () =>
  useQuery({
    queryKey: ["admin-notification-templates"],
    queryFn: listTemplates,
  });

export const useUpdateNotificationTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
      updatedBy,
    }: {
      id: string;
      patch: Partial<NotificationTemplate>;
      updatedBy: string;
    }) => updateTemplate(id, patch, updatedBy),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-notification-templates"] }),
  });
};
