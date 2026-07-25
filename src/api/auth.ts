import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: () => api.post("/auth/logout").then((r) => r.data),
    onSettled: () => {
      clearAuth();
    },
  });
};
