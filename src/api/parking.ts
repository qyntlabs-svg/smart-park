import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface ParkingFacility {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  available_slots: number;
  total_slots: number;
  hourly_rate: number;
  parking_type: "open" | "covered";
}

export interface ParkingFacilityDetail extends ParkingFacility {
  daily_rate: number;
  overstay_penalty_per_hour: number;
  monthly_pass_price: number;
  accepts_two_wheeler: boolean;
  accepts_four_wheeler: boolean;
  photos: string[];
}

export interface ParkingSlot {
  id: string;
  slot_number: string;
  floor: number;
  slot_type: "regular" | "covered";
  vehicle_type: "two_wheeler" | "four_wheeler";
  status: "available" | "occupied" | "blocked";
  price: number;
}

interface ListParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  vehicle_type?: string;
  available?: boolean;
}

export const useParkingFacilities = (params: ListParams = {}) =>
  useQuery({
    queryKey: ["parking", params],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: ParkingFacility[];
        }>("/parking", { params })
        .then((r) => r.data.data),
    staleTime: 1000 * 30, // 30 seconds — keeps slot counts reasonably fresh
  });

export const useParkingDetail = (id: string) =>
  useQuery({
    queryKey: ["parking", id],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: ParkingFacilityDetail;
        }>(`/parking/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });

export const useParkingSlots = (
  facilityId: string,
  params: {
    vehicle_type?: string;
    floor?: number;
    start_time?: string;
    end_time?: string;
  } = {},
) =>
  useQuery({
    queryKey: ["parking-slots", facilityId, params],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: ParkingSlot[];
        }>(`/parking/${facilityId}/slots`, { params })
        .then((r) => r.data.data),
    enabled:
      !!facilityId && !!(params.start_time && params.end_time ? true : true),
  });
