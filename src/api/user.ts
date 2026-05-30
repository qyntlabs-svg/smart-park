import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  city: string | null;
  role: string;
  created_at: string;
}

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: UserProfile }>("/user/profile")
        .then((r) => r.data.data),
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; email?: string; city?: string }) =>
      api.put("/user/profile", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
