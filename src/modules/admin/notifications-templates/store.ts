// A-12 Notification Templates — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import type { NotificationTemplate } from "./types";

const KEY = "adminNotificationTemplates";

const SEED: NotificationTemplate[] = [
  {
    id: "booking_confirmed",
    name: "Booking confirmed",
    channel: "push",
    audience: "consumer",
    body: "Your reservation at {{provider}} is confirmed for {{time}}. Code: {{code}}",
    variables: ["provider", "time", "code"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "charger_offline",
    name: "Charger offline — reservation at risk",
    channel: "push",
    audience: "consumer",
    body: "The charger you reserved at {{provider}} went offline. We've refunded {{amount}} and can rebook nearby.",
    variables: ["provider", "amount"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "no_show_vendor",
    name: "Consumer no-show",
    channel: "push",
    audience: "vendor",
    body: "Reservation {{ref}} released after 30 min. Slot freed.",
    variables: ["ref"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "payout_paid_sms",
    name: "Payout paid",
    channel: "sms",
    audience: "vendor",
    body: "SmartPark: ₹{{amount}} credited to A/C ••{{last4}}. Ref {{ref}}.",
    variables: ["amount", "last4", "ref"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "welcome_consumer",
    name: "Welcome",
    channel: "email",
    audience: "consumer",
    subject: "Welcome to SmartPark, {{name}}",
    body: "Hi {{name}},\n\nWelcome! Book your first charge with code EVFIRST for a free session.\n\n— The SmartPark team",
    variables: ["name"],
    updatedAt: new Date().toISOString(),
  },
];

function load(): NotificationTemplate[] {
  const existing = readJson<NotificationTemplate[] | null>(KEY, null);
  if (existing) return existing;
  writeJson(KEY, SEED);
  return SEED;
}

function save(list: NotificationTemplate[]) {
  writeJson(KEY, list);
}

export async function listTemplates(): Promise<NotificationTemplate[]> {
  return load();
}

export async function updateTemplate(
  id: string,
  patch: Partial<NotificationTemplate>,
  updatedBy: string,
): Promise<NotificationTemplate | null> {
  const list = load();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  save(list);
  return list[idx];
}
