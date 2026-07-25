// Preferences mock store: roaming networks (C-53) + notification matrix (C-54).

import { readJson, writeJson } from "@/shared/lib/storage";
import type {
  NotifChannel,
  NotifMatrix,
  NotifTopic,
  RoamingNetwork,
} from "./types";

// ---- Roaming ----

const ROAMING_KEY = "consumerRoamingNetworks";

const SEED_NETWORKS: RoamingNetwork[] = [
  {
    id: "net-tata-power",
    name: "Tata Power EZ Charge",
    bridged: true,
    stationsCount: 1240,
    billsThroughUs: true,
    lastChargeAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    lastChargeKwh: 22,
    lastChargeAmount: 396,
  },
  {
    id: "net-static",
    name: "Statiq",
    bridged: true,
    stationsCount: 860,
    billsThroughUs: true,
    lastChargeAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastChargeKwh: 12,
    lastChargeAmount: 240,
  },
  {
    id: "net-relux",
    name: "Relux Electric",
    bridged: true,
    stationsCount: 320,
    billsThroughUs: true,
  },
  {
    id: "net-cptl",
    name: "ChargePoint",
    bridged: false,
    stationsCount: 90,
    billsThroughUs: false,
  },
];

export async function listRoamingNetworks(): Promise<RoamingNetwork[]> {
  const existing = readJson<RoamingNetwork[] | null>(ROAMING_KEY, null);
  if (existing) return existing;
  writeJson(ROAMING_KEY, SEED_NETWORKS);
  return SEED_NETWORKS;
}

// ---- Notification preferences ----

const NOTIF_KEY = "consumerNotifPreferences";

const DEFAULT_MATRIX: NotifMatrix = {
  charging:   { push: true,  email: true,  sms: true  },
  parking:    { push: true,  email: false, sms: true  },
  sos:        { push: true,  email: true,  sms: true  },
  promotions: { push: false, email: true,  sms: false },
  billing:    { push: false, email: true,  sms: true  },
  family:     { push: true,  email: false, sms: false },
};

export async function getNotifPreferences(): Promise<NotifMatrix> {
  return readJson<NotifMatrix>(NOTIF_KEY, DEFAULT_MATRIX);
}

export async function setNotifPreference(
  topic: NotifTopic,
  channel: NotifChannel,
  enabled: boolean,
): Promise<NotifMatrix> {
  const cur = await getNotifPreferences();
  const next: NotifMatrix = {
    ...cur,
    [topic]: { ...cur[topic], [channel]: enabled },
  };
  writeJson(NOTIF_KEY, next);
  return next;
}

export async function resetNotifPreferences(): Promise<NotifMatrix> {
  writeJson(NOTIF_KEY, DEFAULT_MATRIX);
  return DEFAULT_MATRIX;
}
