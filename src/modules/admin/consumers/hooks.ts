import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConsumerBookings,
  searchConsumers,
  toggleConsumerSuspension,
} from "./store";

export const useConsumerSearch = (query: string) =>
  useQuery({
    queryKey: ["admin-consumers", query],
    queryFn: () => searchConsumers(query),
  });

export const useConsumerBookings = (id: string | undefined) =>
  useQuery({
    queryKey: ["admin-consumer-bookings", id],
    queryFn: () => getConsumerBookings(id!),
    enabled: !!id,
  });

export const useToggleConsumerSuspension = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleConsumerSuspension(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-consumers"] }),
  });
};
