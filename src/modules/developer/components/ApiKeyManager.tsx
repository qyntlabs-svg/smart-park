// Reusable API-key manager. Used by:
//   - DEV-02  (Developer Portal /developer/keys)
//   - F-11    (Fleet OS /fleet/api-keys) — via the `variant="fleet"` prop
//
// Data source is passed in from the parent because Fleet OS + Developer Portal
// use different underlying stores (fleet/store.ts vs developer/store.ts), but
// the UI/UX for creating, rotating, revoking, scope-picking, and revealing
// the plaintext key on creation is identical.

import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ApiKeyEnv, ApiKeyScope } from "../types";
import { SCOPE_LABEL } from "../types";

export interface ApiKeyRecord {
  id: string;
  label: string;
  env?: ApiKeyEnv;
  keyMasked: string;
  scopes: string[]; // string so both Fleet + Dev scope types slot in
  createdAt: string;
  lastUsedAt?: string;
  rotatedAt?: string;
  revoked: boolean;
}

export interface ApiKeyManagerProps {
  variant: "fleet" | "developer";
  keys: ApiKeyRecord[];
  scopeOptions: string[];
  loading?: boolean;
  onCreate: (input: {
    label: string;
    env: ApiKeyEnv;
    scopes: string[];
  }) => Promise<{ plaintext: string }>;
  onRotate: (id: string) => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
}

const ENVS: ApiKeyEnv[] = ["test", "live"];

export const ApiKeyManager = ({
  variant,
  keys,
  scopeOptions,
  loading,
  onCreate,
  onRotate,
  onRevoke,
}: ApiKeyManagerProps) => {
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [env, setEnv] = useState<ApiKeyEnv>(variant === "fleet" ? "live" : "test");
  const [scopes, setScopes] = useState<string[]>([]);
  const [plaintext, setPlaintext] = useState<{ label: string; key: string } | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const groupedKeys = useMemo(() => {
    return [...keys].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [keys]);

  const create = async () => {
    if (!label.trim()) return toast.error("Give the key a label");
    if (!scopes.length) return toast.error("Pick at least one scope");
    try {
      const { plaintext } = await onCreate({ label: label.trim(), env, scopes });
      setPlaintext({ label: label.trim(), key: plaintext });
      setVisible(true);
      setLabel("");
      setScopes([]);
      setShowCreate(false);
    } catch {
      toast.error("Could not create key");
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-slate-600">
            {variant === "fleet"
              ? "Fleet API keys grant programmatic access to Fleet OS resources — vehicles, drivers, batch reservations, and reports."
              : "Developer API keys authenticate calls to the SmartPark public API. Test-mode keys never touch real payments."}
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          New key
        </button>
      </div>

      {plaintext && visible && (
        <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-emerald-800">
                Key created — copy it now, you won't see it again.
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {plaintext.label}
              </p>
              <code className="block mt-2 text-[12px] font-mono break-all text-slate-900 bg-white rounded p-2 border border-emerald-200">
                {plaintext.key}
              </code>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => copy(plaintext.key)}
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-white border border-emerald-300 text-[11px] font-semibold text-emerald-700"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button
                onClick={() => setVisible(false)}
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-white border border-emerald-300 text-[11px] font-semibold text-emerald-700"
              >
                <EyeOff className="w-3 h-3" /> Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h4 className="text-[13px] font-bold text-slate-900">
            Create a new API key
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Label
              </span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Payroll ETL"
                className="mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-[13px]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Environment
              </span>
              <div className="mt-1 flex gap-1.5">
                {ENVS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEnv(e)}
                    className={cn(
                      "h-9 px-3 rounded-md text-[12px] font-semibold border",
                      env === e
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200",
                    )}
                  >
                    {e === "test" ? "Test mode" : "Live"}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">
              Scopes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scopeOptions.map((s) => {
                const on = scopes.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() =>
                      setScopes((prev) =>
                        on ? prev.filter((x) => x !== s) : [...prev, s],
                      )
                    }
                    className={cn(
                      "h-7 px-2 rounded-md text-[11px] font-mono border",
                      on
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200",
                    )}
                  >
                    {(SCOPE_LABEL as Record<string, string>)[s] ?? s}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={create}
              className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold"
            >
              Create key
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        {loading ? (
          <div className="p-6 text-[12px] text-slate-500">Loading keys…</div>
        ) : groupedKeys.length === 0 ? (
          <div className="text-center py-12 px-6">
            <KeyRound className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-2 text-[13px] font-semibold text-slate-800">
              No API keys yet
            </p>
            <p className="text-[12px] text-slate-500">
              Create one to start hitting the SmartPark API.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Label</TableHead>
                <TableHead className="text-[11px]">Env</TableHead>
                <TableHead className="text-[11px]">Key</TableHead>
                <TableHead className="text-[11px]">Scopes</TableHead>
                <TableHead className="text-[11px]">Last used</TableHead>
                <TableHead className="text-[11px]">Created</TableHead>
                <TableHead className="text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedKeys.map((k) => (
                <TableRow key={k.id} className="text-[12px]">
                  <TableCell className="py-2 font-semibold">
                    {k.label}
                    {k.revoked && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-red-700 bg-red-50 rounded px-1.5 py-0.5">
                        Revoked
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        k.env === "live"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {k.env ?? "live"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      {k.keyMasked}
                      <button
                        onClick={() => copy(k.keyMasked)}
                        title="Copy masked"
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {k.scopes.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono bg-slate-100 text-slate-700 rounded px-1.5 py-0.5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-slate-500">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="py-2 text-slate-500">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={async () => {
                          setBusyId(k.id);
                          await onRotate(k.id);
                          setBusyId(null);
                          toast.success("Rotated — old secret invalidated");
                        }}
                        disabled={k.revoked || busyId === k.id}
                        title="Rotate"
                        className="h-7 w-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          const ok = window.confirm(
                            `Revoke "${k.label}"? Any traffic using it will start returning 401.`,
                          );
                          if (!ok) return;
                          setBusyId(k.id);
                          await onRevoke(k.id);
                          setBusyId(null);
                          toast.success("Revoked");
                        }}
                        disabled={k.revoked || busyId === k.id}
                        title="Revoke"
                        className="h-7 w-7 rounded-md border border-slate-200 flex items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-40"
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
      </div>
    </div>
  );
};

export default ApiKeyManager;
