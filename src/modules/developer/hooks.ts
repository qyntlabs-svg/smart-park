// React-query wrappers over the Developer Portal mock store.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiKeyEnv,
  ApiKeyScope,
  DevPlan,
  Webhook,
  WebhookEvent,
} from "./types";
import {
  createDevApiKey,
  createSandboxReservation,
  createWebhook,
  deleteWebhook,
  getActivePlan,
  listDevApiKeys,
  listDevInvoices,
  listDevRequestLogs,
  listDevUsage,
  listPartnerApps,
  listSandboxPayments,
  listSandboxReservations,
  listWebhookDeliveries,
  listWebhooks,
  revokeDevApiKey,
  rotateDevApiKey,
  setActivePlan,
  toggleWebhook,
  upsertWebhook,
} from "./store";

const K = {
  keys: ["dev-api-keys"] as const,
  webhooks: ["dev-webhooks"] as const,
  webhookDeliveries: ["dev-webhook-deliveries"] as const,
  sandboxReservations: ["dev-sandbox-reservations"] as const,
  sandboxPayments: ["dev-sandbox-payments"] as const,
  logs: ["dev-logs"] as const,
  usage: ["dev-usage"] as const,
  invoices: ["dev-invoices"] as const,
  apps: ["dev-apps"] as const,
  plan: ["dev-plan"] as const,
};

export const useDevApiKeys = () =>
  useQuery({ queryKey: K.keys, queryFn: listDevApiKeys });
export const useDevWebhooks = () =>
  useQuery({ queryKey: K.webhooks, queryFn: listWebhooks });
export const useDevWebhookDeliveries = () =>
  useQuery({ queryKey: K.webhookDeliveries, queryFn: listWebhookDeliveries });
export const useDevSandboxReservations = () =>
  useQuery({ queryKey: K.sandboxReservations, queryFn: listSandboxReservations });
export const useDevSandboxPayments = () =>
  useQuery({ queryKey: K.sandboxPayments, queryFn: listSandboxPayments });
export const useDevRequestLogs = () =>
  useQuery({ queryKey: K.logs, queryFn: listDevRequestLogs });
export const useDevUsage = () =>
  useQuery({ queryKey: K.usage, queryFn: listDevUsage });
export const useDevInvoices = () =>
  useQuery({ queryKey: K.invoices, queryFn: listDevInvoices });
export const useDevPartnerApps = () =>
  useQuery({ queryKey: K.apps, queryFn: listPartnerApps });
export const useDevActivePlan = () =>
  useQuery({ queryKey: K.plan, queryFn: getActivePlan });

// --- mutations ---

export const useCreateDevApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      label: string;
      env: ApiKeyEnv;
      scopes: ApiKeyScope[];
    }) => createDevApiKey(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.keys }),
  });
};

export const useRotateDevApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rotateDevApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.keys }),
  });
};

export const useRevokeDevApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeDevApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.keys }),
  });
};

export const useCreateWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { url: string; events: WebhookEvent[] }) =>
      createWebhook(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.webhooks }),
  });
};

export const useUpsertWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (w: Webhook) => upsertWebhook(w),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.webhooks }),
  });
};

export const useToggleWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleWebhook,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.webhooks }),
  });
};

export const useDeleteWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.webhooks }),
  });
};

export const useCreateSandboxReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { stationId: string; chargerType: string; amount: number }) =>
      createSandboxReservation(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.sandboxReservations }),
  });
};

export const useSetActivePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: DevPlan["id"]) => setActivePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.plan }),
  });
};
