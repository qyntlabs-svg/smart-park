// Screen: G-07 · Primitives: Notification, Pricing
// Route: /growth/winback
// Admin-facing winback campaign builder + preview.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Save,
  Play,
  Trash2,
  Plus,
} from "lucide-react";
import {
  createWinbackCampaign,
  deleteWinbackCampaign,
  listWinbackCampaigns,
  updateWinbackCampaign,
  type WinbackCampaign,
  type WinbackChannel,
  type WinbackStatus,
} from "../store";

const CHANNEL_META: Record<
  WinbackChannel,
  { label: string; icon: any; tone: string }
> = {
  push: { label: "Push", icon: Bell, tone: "bg-cyan-500/20 text-cyan-200" },
  email: { label: "Email", icon: Mail, tone: "bg-amber-500/20 text-amber-200" },
  sms: {
    label: "SMS",
    icon: MessageSquare,
    tone: "bg-emerald-500/20 text-emerald-200",
  },
};

const STATUS_TONE: Record<WinbackStatus, string> = {
  draft: "bg-slate-800 text-slate-300 border-slate-700",
  scheduled: "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
  sent: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
};

interface Draft {
  name: string;
  audience: string;
  channel: WinbackChannel;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  incentivePct: number;
}

const EMPTY: Draft = {
  name: "",
  audience: "Inactive 30-60d",
  channel: "push",
  headline: "We miss you",
  body: "Come back this week and get 15% off your next charge.",
  ctaLabel: "Charge now",
  ctaHref: "/ev",
  incentivePct: 15,
};

const useWinbackList = () =>
  useQuery({
    queryKey: ["growth", "winback"],
    queryFn: () => listWinbackCampaigns(),
  });

const WinbackCampaignScreen = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useWinbackList();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [dirty, setDirty] = useState(false);

  const selected = useMemo(
    () => data?.find((c) => c.id === selectedId) ?? null,
    [data, selectedId],
  );

  useEffect(() => {
    if (selected) {
      setDraft({
        name: selected.name,
        audience: selected.audience,
        channel: selected.channel,
        headline: selected.headline,
        body: selected.body,
        ctaLabel: selected.ctaLabel,
        ctaHref: selected.ctaHref,
        incentivePct: selected.incentivePct,
      });
      setDirty(false);
    } else {
      setDraft(EMPTY);
      setDirty(false);
    }
  }, [selected]);

  const create = useMutation({
    mutationFn: () =>
      createWinbackCampaign({
        ...draft,
        status: "draft",
        estReachedUsers: Math.round(500 + Math.random() * 3000),
        estConversionPct: Math.round((5 + Math.random() * 15) * 10) / 10,
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["growth", "winback"] });
      setSelectedId(c.id);
    },
  });
  const update = useMutation({
    mutationFn: (patch: Partial<WinbackCampaign>) =>
      updateWinbackCampaign(selectedId!, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["growth", "winback"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteWinbackCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["growth", "winback"] });
      setSelectedId(null);
    },
  });

  const patchField = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  const save = () => {
    if (selectedId) update.mutate(draft);
    else create.mutate();
    setDirty(false);
  };

  const send = () => {
    if (!selectedId) return;
    update.mutate({ status: "sent", scheduledFor: new Date().toISOString() });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col">
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-slate-800 bg-slate-900/50">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 inline-flex items-center justify-center rounded hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="text-[13px] font-semibold">Winback campaigns</div>
          <div className="text-[11px] text-slate-400">
            Design → schedule → measure re-engagement
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedId(null);
              setDraft(EMPTY);
              setDirty(true);
            }}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] hover:bg-slate-700"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Campaign list */}
        <aside className="border-r border-slate-800 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-[12px] text-slate-400">Loading…</div>
          ) : isError ? (
            <div className="p-4 text-[12px] text-rose-300">
              Failed to load campaigns.
            </div>
          ) : !data || data.length === 0 ? (
            <div className="p-4 text-[12px] text-slate-400">
              No campaigns yet. Create one on the right.
            </div>
          ) : (
            <ul>
              {data.map((c) => {
                const active = selectedId === c.id;
                const Icon = CHANNEL_META[c.channel].icon;
                return (
                  <li
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`px-3 py-3 border-b border-slate-800 cursor-pointer ${
                      active ? "bg-slate-800/60" : "hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[13px]">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate flex-1">{c.name}</span>
                      <span
                        className={`text-[10px] rounded px-1.5 py-0.5 border ${STATUS_TONE[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {c.audience} · {c.estReachedUsers} users ·{" "}
                      {c.estConversionPct}% conv
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Editor */}
        <section className="p-6 overflow-y-auto">
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400">
                Campaign name
              </label>
              <input
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-cyan-400"
                value={draft.name}
                onChange={(e) => patchField("name", e.target.value)}
                placeholder="e.g. OMR commuter · 15% off"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400">
                  Audience
                </label>
                <input
                  className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-cyan-400"
                  value={draft.audience}
                  onChange={(e) => patchField("audience", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400">
                  Channel
                </label>
                <div className="mt-1 flex gap-1">
                  {(["push", "email", "sms"] as WinbackChannel[]).map((c) => {
                    const active = draft.channel === c;
                    const Icon = CHANNEL_META[c].icon;
                    return (
                      <button
                        key={c}
                        onClick={() => patchField("channel", c)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-[11px] border transition-colors ${
                          active
                            ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                            : "border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {CHANNEL_META[c].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400">
                Headline
              </label>
              <input
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-cyan-400"
                value={draft.headline}
                onChange={(e) => patchField("headline", e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400">
                Body
              </label>
              <textarea
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-cyan-400 min-h-[80px]"
                value={draft.body}
                onChange={(e) => patchField("body", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400">
                  CTA label
                </label>
                <input
                  className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-cyan-400"
                  value={draft.ctaLabel}
                  onChange={(e) => patchField("ctaLabel", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400">
                  CTA link
                </label>
                <input
                  className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-cyan-400 font-mono"
                  value={draft.ctaHref}
                  onChange={(e) => patchField("ctaHref", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400">
                Incentive: {draft.incentivePct}% off
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.incentivePct}
                onChange={(e) =>
                  patchField("incentivePct", Number(e.target.value))
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={save}
                disabled={!dirty || create.isPending || update.isPending}
                className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-[12px] border ${
                  dirty
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                    : "border-slate-700 text-slate-500"
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {selectedId ? "Save changes" : "Create draft"}
              </button>
              {selectedId ? (
                <>
                  <button
                    onClick={send}
                    disabled={update.isPending}
                    className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 px-3 py-1.5 text-[12px] hover:bg-emerald-500/30"
                  >
                    <Play className="w-3.5 h-3.5" /> Send now
                  </button>
                  <button
                    onClick={() => remove.mutate(selectedId)}
                    className="ml-auto inline-flex items-center gap-1 rounded border border-slate-700 text-rose-300 px-3 py-1.5 text-[12px] hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Preview */}
        <aside className="border-l border-slate-800 p-4 overflow-y-auto bg-slate-900/30">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">
            Preview · {CHANNEL_META[draft.channel].label}
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-6 h-6 rounded bg-cyan-500/30 flex items-center justify-center">
                <Bell className="w-3 h-3" />
              </span>
              SmartPark · now
            </div>
            <div className="mt-2 font-semibold text-[14px]">
              {draft.headline || "Headline"}
            </div>
            <div className="text-[12px] text-slate-300 mt-1 whitespace-pre-wrap">
              {draft.body || "Message body will appear here."}
            </div>
            <div className="mt-3">
              <span className="inline-block rounded-full bg-cyan-500 text-slate-900 px-3 py-1 text-[11px] font-semibold">
                {draft.ctaLabel || "CTA"}
              </span>
            </div>
          </div>

          {selected ? (
            <div className="mt-4 rounded border border-slate-800 bg-slate-950 p-3 text-[12px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Est. reach</span>
                <span className="tabular-nums">
                  {selected.estReachedUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. conversion</span>
                <span className="tabular-nums">
                  {selected.estConversionPct}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] border ${STATUS_TONE[selected.status]}`}
                >
                  {selected.status}
                </span>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default WinbackCampaignScreen;
