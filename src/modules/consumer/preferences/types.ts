// Preferences types (C-53 roaming, C-54 notification preferences).

// ---- Roaming (C-53) ----

export interface RoamingNetwork {
  id: string;
  name: string;
  logo?: string;                 // future — CDN url
  bridged: boolean;
  stationsCount: number;
  billsThroughUs: boolean;
  lastChargeAt?: string;
  lastChargeKwh?: number;
  lastChargeAmount?: number;
}

// ---- Notification preferences (C-54) ----

export type NotifChannel = "push" | "email" | "sms";
export type NotifTopic =
  | "charging"
  | "parking"
  | "sos"
  | "promotions"
  | "billing"
  | "family";

export const NOTIF_TOPIC_LABEL: Record<NotifTopic, string> = {
  charging: "Charging sessions",
  parking: "Parking sessions",
  sos: "SOS & safety",
  promotions: "Offers & promotions",
  billing: "Payments & receipts",
  family: "Family activity",
};

export const NOTIF_CHANNEL_LABEL: Record<NotifChannel, string> = {
  push: "Push",
  email: "Email",
  sms: "SMS",
};

export type NotifMatrix = Record<NotifTopic, Record<NotifChannel, boolean>>;
