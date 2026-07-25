// Screen: A-12 · Primitives: Notification
// Route: /admin/notifications-templates

import { useMemo, useState } from "react";
import {
  MessageSquare,
  Loader2,
  Save,
  Bell,
  Mail,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useNotificationTemplates,
  useUpdateNotificationTemplate,
} from "./hooks";
import type { Channel, NotificationTemplate } from "./types";

const CHANNEL_ICON: Record<Channel, typeof Bell> = {
  push: Bell,
  sms: MessageCircle,
  email: Mail,
};

const renderPreview = (
  body: string,
  vars: string[],
): string => {
  return vars.reduce(
    (s, v) => s.replace(new RegExp(`{{${v}}}`, "g"), `«${v}»`),
    body,
  );
};

const AdminNotificationTemplatesScreen = () => {
  const updatedBy = useAuthStore((s) => s.user?.name ?? s.user?.id ?? "admin");
  const { data: templates = [], isLoading, isError } = useNotificationTemplates();
  const update = useUpdateNotificationTemplate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NotificationTemplate | null>(null);
  const [channelFilter, setChannelFilter] = useState<"all" | Channel>("all");

  const filtered = useMemo(
    () =>
      channelFilter === "all"
        ? templates
        : templates.filter((t) => t.channel === channelFilter),
    [templates, channelFilter],
  );

  const active =
    templates.find((t) => t.id === (selectedId ?? templates[0]?.id)) ??
    templates[0];
  const editing = draft?.id === active?.id ? draft : active;
  const dirty = draft != null && active != null && draft.id === active.id;

  const save = async () => {
    if (!editing || !active) return;
    await update.mutateAsync({
      id: active.id,
      patch: {
        body: editing.body,
        subject: editing.subject,
      },
      updatedBy,
    });
    toast.success("Template saved");
    setDraft(null);
  };

  return (
    <AdminLayout
      title="Notification Templates"
      subtitle="System-wide push / SMS / email copy"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "push", "sms", "email"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChannelFilter(c)}
            className={`px-3 py-1.5 rounded-full text-caption font-semibold border capitalize ${
              channelFilter === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : isError ? (
            <p className="text-body-sm text-destructive p-4">
              Couldn't load templates
            </p>
          ) : (
            filtered.map((t) => {
              const Icon = CHANNEL_ICON[t.channel];
              const isActive = active?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedId(t.id);
                    setDraft(null);
                  }}
                  className={`w-full text-left p-3 border-b border-border last:border-b-0 ${
                    isActive
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-body-sm font-bold text-foreground truncate">
                        {t.name}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {t.channel.toUpperCase()} · {t.audience}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {!editing ? (
            <div className="flex flex-col items-center py-14 gap-2 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-body-sm text-muted-foreground">
                Select a template
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-body font-bold text-foreground">
                    {editing.name}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {editing.channel.toUpperCase()} · audience {editing.audience}
                  </p>
                </div>
                <MobileButton
                  size="sm"
                  onClick={save}
                  loading={update.isPending}
                  disabled={!dirty}
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </MobileButton>
              </div>

              {editing.channel === "email" && (
                <div className="mb-3">
                  <label className="text-caption text-muted-foreground">
                    Subject
                  </label>
                  <input
                    value={editing.subject ?? ""}
                    onChange={(e) =>
                      setDraft({ ...editing, subject: e.target.value })
                    }
                    className="w-full h-11 mt-1 rounded-xl border border-border bg-background px-3 text-body-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-caption text-muted-foreground">
                  Body
                </label>
                <textarea
                  value={editing.body}
                  onChange={(e) => setDraft({ ...editing, body: e.target.value })}
                  className="w-full h-40 mt-1 rounded-xl border border-border bg-background p-3 text-body-sm font-mono"
                />
              </div>

              <div className="mt-3">
                <p className="text-caption text-muted-foreground mb-1">
                  Variables
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {editing.variables.map((v) => (
                    <span
                      key={v}
                      className="text-caption font-mono px-2 py-0.5 rounded bg-primary/10 text-primary"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Preview
                </p>
                {editing.subject && (
                  <p className="text-body-sm font-bold text-foreground">
                    {renderPreview(editing.subject, editing.variables)}
                  </p>
                )}
                <p className="text-body-sm text-foreground whitespace-pre-wrap">
                  {renderPreview(editing.body, editing.variables)}
                </p>
              </div>

              <p className="text-[10px] text-muted-foreground mt-2">
                Last updated{" "}
                {new Date(editing.updatedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {editing.updatedBy ? ` by ${editing.updatedBy}` : ""}
              </p>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationTemplatesScreen;
