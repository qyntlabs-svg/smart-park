import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPhoto,
  listFacilityMedia,
  removePhoto,
  setAmenities,
  setCoverPhoto,
} from "./store";

export const useFacilityMedia = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-facility-media", partnerId],
    queryFn: () => listFacilityMedia(partnerId!),
    enabled: !!partnerId,
  });

export const useAddPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPhoto,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-facility-media", v.partnerId] }),
  });
};

export const useRemovePhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removePhoto,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-facility-media", v.partnerId] }),
  });
};

export const useSetCoverPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setCoverPhoto,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-facility-media", v.partnerId] }),
  });
};

export const useSetAmenities = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setAmenities,
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["partner-facility-media", v.partnerId] }),
  });
};
