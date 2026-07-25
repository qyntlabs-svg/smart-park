// React-query wrappers over the Rental mock store. Symmetric with modules/ev/hooks.ts.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  RentalListing,
  RentalPeriod,
  RentalSearchFilters,
} from "./types";
import {
  createListing,
  deleteListing,
  getListing,
  listBookingsByConsumer,
  listBookingsByPartner,
  listListings,
  listListingsByPartner,
  quoteRental,
  requestBooking,
  toggleListingStatus,
  updateListing,
} from "./store";

const KEYS = {
  all: ["rental-listings"] as const,
  list: (f: RentalSearchFilters, origin?: { lat: number; lng: number }) =>
    ["rental-listings", "list", f, origin] as const,
  byPartner: (partnerId: string) =>
    ["rental-listings", "partner", partnerId] as const,
  detail: (id: string) => ["rental-listings", "detail", id] as const,
  bookings: {
    partner: (partnerId: string) =>
      ["rental-bookings", "partner", partnerId] as const,
    consumer: (phone: string) =>
      ["rental-bookings", "consumer", phone] as const,
  },
};

export const useRentalListings = (
  filters: RentalSearchFilters = {},
  origin?: { lat: number; lng: number },
) =>
  useQuery({
    queryKey: KEYS.list(filters, origin),
    queryFn: () => listListings(filters, origin),
    staleTime: 30_000,
  });

export const useRentalListingsByPartner = (partnerId: string | undefined) =>
  useQuery({
    queryKey: KEYS.byPartner(partnerId ?? ""),
    queryFn: () => listListingsByPartner(partnerId!),
    enabled: !!partnerId,
  });

export const useRentalListing = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => getListing(id!),
    enabled: !!id,
  });

export const useCreateRentalListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useUpdateRentalListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<RentalListing>;
    }) => updateListing(id, patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
};

export const useDeleteRentalListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useToggleRentalListingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleListingStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

// ---------- Bookings ----------

export const useRequestRentalBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestBooking,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental-bookings"] }),
  });
};

export const usePartnerRentalBookings = (partnerId: string | undefined) =>
  useQuery({
    queryKey: KEYS.bookings.partner(partnerId ?? ""),
    queryFn: () => listBookingsByPartner(partnerId!),
    enabled: !!partnerId,
  });

export const useConsumerRentalBookings = (phone: string | undefined) =>
  useQuery({
    queryKey: KEYS.bookings.consumer(phone ?? ""),
    queryFn: () => listBookingsByConsumer(phone!),
    enabled: !!phone,
  });

/** Non-hook helper for on-the-fly quoting inside forms. */
export { quoteRental };
export type { RentalPeriod };
