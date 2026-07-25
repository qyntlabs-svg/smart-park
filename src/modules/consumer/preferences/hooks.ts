// Hooks for the preferences module.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifPreferences,
  listRoamingNetworks,
  resetNotifPreferences,
  setNotifPreference,
} from "./store";
import type { NotifChannel, NotifTopic } from "./types";

const KEYS = {
  roaming: ["roaming-networks"] as const,
  notif: ["notif-prefs"] as const,
};

export const useRoamingNetworks = () =>
  useQuery({ queryKey: KEYS.roaming, queryFn: () => listRoamingNetworks() });

export const useNotifPreferences = () =>
  useQuery({ queryKey: KEYS.notif, queryFn: () => getNotifPreferences() });

export const useSetNotifPreference = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      topic: NotifTopic;
      channel: NotifChannel;
      enabled: boolean;
    }) => setNotifPreference(input.topic, input.channel, input.enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.notif }),
  });
};

export const useResetNotifPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetNotifPreferences(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.notif }),
  });
};
