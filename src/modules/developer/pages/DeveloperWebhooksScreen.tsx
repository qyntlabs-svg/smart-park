// Screen: DEV-05 · Primitives: Notification, Provider
// Webhooks — subscribe to events; recent delivery attempts.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Power, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DevEmpty,
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import {
  useCreateWebhook,
  useDeleteWebhook,
  useDevWebhookDeliveries,
  useDevWebhooks,
  useToggleWebhook,
} from "@/modules/developer/hooks";
import { EVENT_LABEL, type WebhookEvent } from "@/modules/developer/types";
import { cn } from "@/lib/utils";

const EVENT_OPTIONS = Object.keys(EVENT_LABEL) as WebhookEvent[];

const DeveloperWebhooksScreen = () => {
  const webhooks = useDevWebhooks();
  const deliveries = useDevWebhookDeliveries();
  const create = useCreateWebhook();
  const toggle = useToggleWebhook();
  const remove = useDeleteWebhook();

  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>([]);

  const submit = async () => {
    try {
      new URL(url);
    } catch {
      return toast.error("Enter a valid https URL");
    }
    if (events.length === 0) return toast.error("Pick at least one event");
    try {
      await create.mutateAsync({ url, events });
      toast.success("Webhook created");
      setUrl("");
      setEvents([]);
      setShowForm(false);
    } catch {
      toast.error("Could not create webhook");
    }
  };

  const recent = useMemo(
    () =>
      (deliveries.data ?? [])
        .slice()
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 25),
    [deliveries.data],
  );

  return (
    <DeveloperLayout
      title="Webhooks"
      screenId="DEV-05"
      primitives={["Notification", "Provider"]}
      actions={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> New webhook
        </button>
      }
    >
      {webhooks.isLoading || deliveries.isLoading ? (
        <DevLoading />
      ) : (
        <DevPageBody>
          {showForm && (
            <DevSection title="Subscribe endpoint">
              <div className="p-4 space-y-3">
                <label className="block">
                  <span className="text-[11px] uppercase text-slate-500 font-semibold">
                    Endpoint URL
                  </span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ops.example.com/hooks/smartpark"
                    className="mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-[13px]"
                  />
                </label>
                <div>
                  <p className="text-[11px] uppercase text-slate-500 font-semibold mb-1.5">
                    Events
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {EVENT_OPTIONS.map((e) => {
                      const on = events.includes(e);
                      return (
                        <button
                          key={e}
                          onClick={() =>
                            setEvents((prev) =>
                              on ? prev.filter((x) => x !== e) : [...prev, e],
                            )
                          }
                          className={cn(
                            "h-7 px-2 rounded-md text-[11px] font-mono border",
                            on
                              ? "bg-violet-600 text-white border-violet-600"
                              : "bg-white text-slate-600 border-slate-200",
                          )}
                        >
                          {e}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </DevSection>
          )}

          <DevSection
            title="Endpoints"
            subtitle="HMAC-SHA256 signed. 5 retries with exponential backoff."
          >
            {(webhooks.data ?? []).length === 0 ? (
              <DevEmpty
                title="No webhooks subscribed"
                body="Push lifecycle events into your ops tools without polling."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">URL</TableHead>
                    <TableHead className="text-[11px]">Events</TableHead>
                    <TableHead className="text-[11px]">Secret</TableHead>
                    <TableHead className="text-[11px]">Last</TableHead>
                    <TableHead className="text-[11px]">Active</TableHead>
                    <TableHead className="text-[11px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.data!.map((w) => (
                    <TableRow key={w.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono truncate max-w-[240px]">
                        {w.url}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {w.events.map((e) => (
                            <span
                              key={e}
                              className="text-[10px] font-mono bg-slate-100 text-slate-700 rounded px-1.5 py-0.5"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 font-mono">
                        {w.secretMasked}
                      </TableCell>
                      <TableCell className="py-2 text-slate-500">
                        {w.lastDeliveryAt ? (
                          <>
                            <span
                              className={cn(
                                "mr-1 font-semibold",
                                (w.lastStatusCode ?? 0) >= 500
                                  ? "text-red-600"
                                  : (w.lastStatusCode ?? 0) >= 400
                                    ? "text-amber-600"
                                    : "text-emerald-600",
                              )}
                            >
                              {w.lastStatusCode ?? "—"}
                            </span>
                            {new Date(w.lastDeliveryAt).toLocaleDateString()}
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                            w.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {w.active ? "Enabled" : "Disabled"}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={async () => {
                              await toggle.mutateAsync(w.id);
                              toast.success(
                                w.active ? "Disabled" : "Re-enabled",
                              );
                            }}
                            title={w.active ? "Disable" : "Enable"}
                            className="h-7 w-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete webhook to ${w.url}?`)) return;
                              await remove.mutateAsync(w.id);
                              toast.success("Deleted");
                            }}
                            title="Delete"
                            className="h-7 w-7 rounded-md border border-slate-200 flex items-center justify-center text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DevSection>

          <DevSection title="Recent deliveries" subtitle="Last 25 attempts">
            {recent.length === 0 ? (
              <DevEmpty title="No deliveries yet" body="Trigger an event to see it here." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Event</TableHead>
                    <TableHead className="text-[11px]">Endpoint</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px]">Attempts</TableHead>
                    <TableHead className="text-[11px]">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((d) => (
                    <TableRow key={d.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono">{d.event}</TableCell>
                      <TableCell className="py-2 font-mono">
                        {d.webhookId}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={cn(
                            "font-semibold",
                            d.statusCode >= 500
                              ? "text-red-600"
                              : d.statusCode >= 400
                                ? "text-amber-600"
                                : "text-emerald-600",
                          )}
                        >
                          {d.statusCode}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">{d.attempts}</TableCell>
                      <TableCell className="py-2 text-slate-500">
                        {new Date(d.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DevSection>
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperWebhooksScreen;
