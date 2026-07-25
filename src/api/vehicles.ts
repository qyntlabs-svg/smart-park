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

// Mock vehicles used when the backend is unreachable (Phase-2 demo mode).
// Covers the three vehicle scenarios: 2-wheeler, 4-wheeler, and an EV.
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "mock-veh-4w",
    registration_number: "TN 22 CA 4321",
    nickname: "Family Car",
    model: "Hyundai Creta",
    color_hsl: "220 70% 45%",
    vehicle_type: "four_wheeler",
    is_default: true,
    is_active: true,
  },
  {
    id: "mock-veh-2w",
    registration_number: "TN 22 BK 8890",
    nickname: "Daily Ride",
    model: "Honda Activa 6G",
    color_hsl: "0 0% 20%",
    vehicle_type: "two_wheeler",
    is_default: false,
    is_active: true,
  },
  {
    id: "mock-veh-ev",
    registration_number: "TN 22 EV 0007",
    nickname: "EV",
    model: "Tata Nexon EV",
    color_hsl: "150 65% 40%",
    vehicle_type: "four_wheeler",
    is_default: false,
    is_active: true,
  },
];

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
        .then((r) => r.data.data)
        .catch(() => MOCK_VEHICLES)
        .then((list) => (list && list.length ? list : MOCK_VEHICLES)),
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
