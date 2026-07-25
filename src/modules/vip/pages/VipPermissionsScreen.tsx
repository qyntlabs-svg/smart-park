// Screen: VIP-08 · Primitives: Identity, Vehicle
// Route: /vip/vehicles/:id/permissions
// Data-sharing permissions — audit view. Toggle scopes, revoke, add.

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { KeyRound, Trash2, Plus, Save } from "lucide-react";
import {
  VipCard,
  VipEmpty,
  VipError,
  VipLayout,
  VipLoading,
  VehicleTabs,
} from "../components/VipLayout";
import { useUpdateVipPermissions, useVipVehicle } from "../hooks";
import {
  AUDIENCE_LABEL,
  type VipAudience,
  type VipPermission,
} from "../types";

const ALL_SCOPES = [
  "read:service_history",
  "read:tow_events",
  "read:ownership",
  "read:recalls",
  "read:telematics_summary",
  "read:docs_metadata",
];

const fmt = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const VipPermissionsScreen = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useVipVehicle(id);
  const mutate = useUpdateVipPermissions();

  const [draft, setDraft] = useState<VipPermission[]>([]);
  const [dirty, setDirty] = useState(false);
  const [newAudience, setNewAudience] = useState<VipAudience>("buyer");

  useEffect(() => {
    if (data) setDraft(data.permissions);
  }, [data]);

  const toggleScope = (rowIdx: number, scope: string) => {
    setDraft((rows) => {
      const next = rows.map((r, i) => {
        if (i !== rowIdx) return r;
        const has = r.scopes.includes(scope);
        return {
          ...r,
          scopes: has
            ? r.scopes.filter((s) => s !== scope)
            : [...r.scopes, scope],
        };
      });
      return next;
    });
    setDirty(true);
  };

  const revoke = (rowIdx: number) => {
    setDraft((rows) => rows.filter((_, i) => i !== rowIdx));
    setDirty(true);
  };

  const addRow = () => {
    setDraft((rows) => [
      ...rows,
      {
        audience: newAudience,
        scopes: [],
        grantedAt: new Date().toISOString(),
      },
    ]);
    setDirty(true);
  };

  const save = async () => {
    if (!data) return;
    await mutate.mutateAsync({
      vehicleId: data.vehicleId,
      permissions: draft,
    });
    setDirty(false);
  };

  const openScopeCount = useMemo(
    () => draft.reduce((n, r) => n + r.scopes.length, 0),
    [draft],
  );

  if (isLoading) {
    return (
      <VipLayout title="Data sharing permissions">
        <VipLoading />
      </VipLayout>
    );
  }
  if (isError || !data) {
    return (
      <VipLayout title="Data sharing permissions">
        {isError ? (
          <VipError message="Failed to load permissions." />
        ) : (
          <VipEmpty title="Vehicle not found" />
        )}
      </VipLayout>
    );
  }

  return (
    <VipLayout
      title={`${data.plate} — Data sharing`}
      subtitle="Trust-critical: audit + revoke access grants (admin audit view)"
      right={
        <button
          onClick={save}
          disabled={!dirty || mutate.isPending}
          className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] border ${
            dirty
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
              : "border-slate-700 text-slate-500"
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {mutate.isPending ? "Saving…" : "Save changes"}
        </button>
      }
    >
      <VehicleTabs vehicleId={data.vehicleId} current="permissions" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Grants
          </div>
          <div className="text-2xl font-semibold mt-1">{draft.length}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Total scopes
          </div>
          <div className="text-2xl font-semibold mt-1">{openScopeCount}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Expired
          </div>
          <div className="text-2xl font-semibold mt-1 text-rose-300">
            {
              draft.filter(
                (r) => r.expiresAt && new Date(r.expiresAt) < new Date(),
              ).length
            }
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Unsaved edits
          </div>
          <div
            className={`text-2xl font-semibold mt-1 ${dirty ? "text-amber-300" : "text-slate-300"}`}
          >
            {dirty ? "yes" : "no"}
          </div>
        </div>
      </div>

      <VipCard
        title="Grants"
        action={
          <div className="flex items-center gap-1">
            <select
              value={newAudience}
              onChange={(e) =>
                setNewAudience(e.target.value as VipAudience)
              }
              className="rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[11px]"
            >
              {(["insurer", "oem", "buyer", "mechanic"] as VipAudience[]).map(
                (a) => (
                  <option key={a} value={a}>
                    {AUDIENCE_LABEL[a]}
                  </option>
                ),
              )}
            </select>
            <button
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] hover:bg-slate-700"
            >
              <Plus className="w-3 h-3" /> Add grant
            </button>
          </div>
        }
      >
        {draft.length === 0 ? (
          <VipEmpty
            title="No grants configured"
            hint="Add insurer / OEM / buyer / mechanic access above"
            icon={KeyRound}
          />
        ) : (
          <ul className="space-y-3">
            {draft.map((row, i) => {
              const expired =
                row.expiresAt && new Date(row.expiresAt) < new Date();
              return (
                <li
                  key={`${row.audience}-${i}`}
                  className="rounded border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold">
                        {AUDIENCE_LABEL[row.audience]}
                      </span>
                      {expired ? (
                        <span className="rounded bg-rose-500/20 text-rose-200 text-[10px] px-1.5 py-0.5">
                          expired
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={() => revoke(i)}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200"
                    >
                      <Trash2 className="w-3 h-3" /> Revoke
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">
                    Granted {fmt(row.grantedAt)}
                    {row.expiresAt ? ` · expires ${fmt(row.expiresAt)}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ALL_SCOPES.map((s) => {
                      const on = row.scopes.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleScope(i, s)}
                          className={`text-[10px] font-mono rounded px-1.5 py-1 border transition-colors ${
                            on
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-100"
                              : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </VipCard>
    </VipLayout>
  );
};

export default VipPermissionsScreen;
