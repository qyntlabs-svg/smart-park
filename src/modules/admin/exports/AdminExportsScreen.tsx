// Screen: A-13 · Primitives: — (data / audit)
// Route: /admin/exports

import { useState } from "react";
import {
  Download,
  Loader2,
  KeyRound,
  Play,
  Trash2,
  Copy,
  FileSpreadsheet,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useApiKeys,
  useAuditLog,
  useCreateApiKey,
  useCreateExportJob,
  useExportJobs,
  useRevokeApiKey,
} from "./hooks";
import type { ExportDataset, ExportFormat } from "./types";

const DATASETS: Array<{ id: ExportDataset; label: string }> = [
  { id: "bookings", label: "Bookings" },
  { id: "payouts", label: "Payouts" },
  { id: "providers", label: "Providers" },
  { id: "consumers", label: "Consumers" },
  { id: "disputes", label: "Disputes" },
  { id: "sessions_ev", label: "EV Sessions" },
];

const AdminExportsScreen = () => {
  const requestedBy = useAuthStore((s) => s.user?.name ?? s.user?.id ?? "admin");
  const { data: jobs = [] } = useExportJobs();
  const { data: apiKeys = [] } = useApiKeys();
  const { data: auditLog = [] } = useAuditLog();
  const createJob = useCreateExportJob();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [ds, setDs] = useState<ExportDataset>("bookings");
  const [fmt, setFmt] = useState<ExportFormat>("csv");
  const [newKeyLabel, setNewKeyLabel] = useState("");

  const startExport = async () => {
    await createJob.mutateAsync({ dataset: ds, format: fmt, requestedBy });
    toast.success("Export queued — will finish shortly");
  };

  const generateKey = async () => {
    if (!newKeyLabel.trim()) {
      toast.error("Label required");
      return;
    }
    await createKey.mutateAsync({
      label: newKeyLabel.trim(),
      scopes: ["bookings:read"],
      createdBy: requestedBy,
    });
    setNewKeyLabel("");
    toast.success("API key created");
  };

  const doRevoke = async (id: string, label: string) => {
    if (!window.confirm(`Revoke "${label}"? Cannot be undone.`)) return;
    await revokeKey.mutateAsync(id);
    toast.success("Key revoked");
  };

  return (
    <AdminLayout
      title="Data Exports & Audits"
      subtitle="CSV / JSON exports, API keys, and audit history"
    >
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-body-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" /> New export
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-caption text-muted-foreground">Dataset</label>
              <select
                value={ds}
                onChange={(e) => setDs(e.target.value as ExportDataset)}
                className="w-full h-11 mt-1 rounded-xl border border-border bg-background px-3 text-body-sm"
              >
                {DATASETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-caption text-muted-foreground">Format</label>
              <select
                value={fmt}
                onChange={(e) => setFmt(e.target.value as ExportFormat)}
                className="w-full h-11 mt-1 rounded-xl border border-border bg-background px-3 text-body-sm"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
          <MobileButton
            className="mt-3 gap-1.5"
            onClick={startExport}
            loading={createJob.isPending}
          >
            <Play className="w-4 h-4" /> Start export
          </MobileButton>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-body-sm font-bold text-foreground mb-3">
            Recent exports
          </p>
          {jobs.length === 0 ? (
            <p className="text-body-sm text-muted-foreground text-center py-6">
              No exports yet
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  className="p-3 rounded-xl border border-border bg-background"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-body-sm font-bold text-foreground truncate">
                        {j.dataset} · {j.format.toUpperCase()}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        by {j.requestedBy} · {new Date(j.requestedAt).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                        {j.rows ? ` · ${j.rows.toLocaleString()} rows` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {j.status === "ready" ? (
                        <a
                          href={j.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-caption font-semibold text-primary inline-flex items-center gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            toast.success("Download link copied");
                          }}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      ) : (
                        <span
                          className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                            j.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {j.status === "running" ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> running
                            </span>
                          ) : (
                            j.status
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API keys */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-4">
        <p className="text-body-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> API keys
        </p>
        <div className="flex gap-2 mb-3 max-w-md">
          <input
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            placeholder="Key label (e.g. Analytics pipeline)"
            className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
          />
          <MobileButton
            size="sm"
            onClick={generateKey}
            loading={createKey.isPending}
          >
            Generate
          </MobileButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-secondary/60 text-caption font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Label</th>
                <th className="text-left px-3 py-2">Prefix</th>
                <th className="text-left px-3 py-2">Scopes</th>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Last used</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k) => (
                <tr key={k.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="font-bold text-foreground">{k.label}</p>
                    <p className="text-caption text-muted-foreground">
                      by {k.createdBy}
                    </p>
                  </td>
                  <td className="px-3 py-2 font-mono text-foreground">
                    <span className="inline-flex items-center gap-1">
                      {k.prefix}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(k.prefix).catch(() => {});
                          toast.success("Prefix copied");
                        }}
                        className="text-primary"
                        aria-label="Copy prefix"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-caption text-muted-foreground">
                    {k.scopes.join(", ")}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {new Date(k.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "never"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {k.revoked ? (
                      <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        revoked
                      </span>
                    ) : (
                      <MobileButton
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => doRevoke(k.id, k.label)}
                        loading={revokeKey.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                      </MobileButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit log */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-body-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" /> Audit log
        </p>
        <div className="max-h-72 overflow-y-auto scrollbar-hide">
          <table className="w-full text-body-sm">
            <thead className="bg-secondary/60 text-caption font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">When</th>
                <th className="text-left px-3 py-2">Actor</th>
                <th className="text-left px-3 py-2">Action</th>
                <th className="text-left px-3 py-2">Entity</th>
                <th className="text-left px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-3 py-2 text-caption text-muted-foreground">
                    {new Date(a.at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-foreground">{a.actor}</td>
                  <td className="px-3 py-2 text-foreground">{a.action}</td>
                  <td className="px-3 py-2 font-mono text-caption text-muted-foreground">
                    {a.entity}
                  </td>
                  <td className="px-3 py-2 font-mono text-caption text-muted-foreground">
                    {a.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminExportsScreen;
