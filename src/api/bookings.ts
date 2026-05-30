import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Booking {
  id: string;
  booking_reference: string;
  qr_token: string;
  facility_id: string;
  slot_id: string;
  vehicle_id: string;
  start_time: string;
  end_time: string;
  base_amount: number;
  total_amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  created_at: string;
  facility_name?: string;
  slot_number?: string;
  vehicle_registration?: string;
}

interface CreateBookingPayload {
  facility_id: string;
  slot_id: string;
  vehicle_id: string;
  vehicle_type?: string;
  start_time: string;
  end_time: string;
}

export const useBookings = (status?: string) =>
  useQuery({
    queryKey: ["bookings", status],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Booking[] }>("/bookings", {
          params: status ? { status } : {},
        })
        .then((r) => r.data.data),
  });

export const useBookingDetail = (id: string) =>
  useQuery({
    queryKey: ["booking", id],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Booking }>(`/bookings/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) =>
      api
        .post<{ success: boolean; data: Booking }>("/bookings", payload)
        .then((r) => r.data.data),
    onSuccess: (_data, payload) => {
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "parking-slots" &&
          (q.queryKey[1] as string) === payload.facility_id,
      });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["parking"] });
    },
  });
};

export const useCancelBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/bookings/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["parking-slots"] });
      qc.invalidateQueries({ queryKey: ["parking"] });
    },
  });
};
