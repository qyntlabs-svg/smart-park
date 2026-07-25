import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Vehicle {
  id: string;
  registration_number: string;
  nickname: string;
  model: string;
  color_hsl: string;
  vehicle_type: "two_wheeler" | "four_wheeler";
  is_default: boolean;
  is_active: boolean;
}

interface AddVehiclePayload {
  registration_number: string;
  vehicle_type: "two_wheeler" | "four_wheeler";
  nickname?: string;
  model?: string;
  color_hsl?: string;
  is_default?: boolean;
}

export const useVehicles = () =>
  useQuery({
    queryKey: ["vehicles"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Vehicle[] }>("/vehicles")
        .then((r) => r.data.data),
  });

export const useAddVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddVehiclePayload) =>
      api
        .post<{ success: boolean; data: Vehicle }>("/vehicles", payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};

export const useUpdateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      nickname?: string;
      model?: string;
      color_hsl?: string;
    }) => api.put(`/vehicles/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};

export const useDeleteVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/vehicles/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};

export const useSetDefaultVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/vehicles/${id}/set-default`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};
