import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata?: string;
}

const QUERY_KEY = ["notifications"];

export const useNotifications = (unreadOnly = false) =>
  useQuery({
    queryKey: [...QUERY_KEY, unreadOnly],
    queryFn: () =>
      api
        .get<{ success: boolean; data: AppNotification[] }>("/notifications", {
          params: unreadOnly ? { unread_only: "true" } : {},
        })
        .then((r) => r.data.data),
    // Always fetch fresh when screen is visited — no stale cache
    staleTime: 0,
    // Keep polling every 15s so new notifications appear without logout/login
    refetchInterval: 15000,
    // Also refetch when the window/app regains focus
    refetchOnWindowFocus: true,
  });

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    // Optimistic update — mark all as read instantly in cache
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueriesData<AppNotification[]>({
        queryKey: QUERY_KEY,
      });
      qc.setQueriesData<AppNotification[]>(
        { queryKey: QUERY_KEY },
        (old) => old?.map((n) => ({ ...n, is_read: true })) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back on error
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useMarkOneRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    // Optimistic update — mark single notification as read instantly
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueriesData<AppNotification[]>({
        queryKey: QUERY_KEY,
      });
      qc.setQueriesData<AppNotification[]>(
        { queryKey: QUERY_KEY },
        (old) =>
          old?.map((n) => (n.id === id ? { ...n, is_read: true } : n)) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    // Optimistic update — remove from list instantly
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueriesData<AppNotification[]>({
        queryKey: QUERY_KEY,
      });
      qc.setQueriesData<AppNotification[]>(
        { queryKey: QUERY_KEY },
        (old) => old?.filter((n) => n.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
