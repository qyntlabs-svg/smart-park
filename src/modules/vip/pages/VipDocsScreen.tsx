// Screen: VIP-05 · Primitives: Vehicle, Identity
// Route: /vip/vehicles/:id/docs
// Docs vault — RC, insurance, PUC, warranties (thumbnails + download).

import { useParams } from "react-router-dom";
import { Download, FileText, AlertTriangle, CalendarClock } from "lucide-react";
import {
  VipCard,
  VipEmpty,
  VipError,
  VipLayout,
  VipLoading,
  VehicleTabs,
} from "../components/VipLayout";
import { useVipVehicle } from "../hooks";
import { DOC_LABEL, type VipDoc } from "../types";

const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const d = (new Date(iso).getTime() - Date.now()) / 86400000;
  return Math.round(d);
};

const KIND_COLOR: Record<VipDoc["kind"], string> = {
  rc: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
  insurance: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  puc: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  warranty: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
};

const VipDocsScreen = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useVipVehicle(id);

  if (isLoading) {
    return (
      <VipLayout title="Docs vault">
        <VipLoading />
      </VipLayout>
    );
  }
  if (isError || !data) {
    return (
      <VipLayout title="Docs vault">
        {isError ? (
          <VipError message="Failed to load docs." />
        ) : (
          <VipEmpty title="Vehicle not found" />
        )}
      </VipLayout>
    );
  }

  const handleDownload = (doc: VipDoc) => {
    // In mock mode: alert instead of navigating away from the SPA.
    // eslint-disable-next-line no-alert
    alert(
      `Mock download — would fetch ${DOC_LABEL[doc.kind]} from ${doc.url ?? "vault"}.`,
    );
  };

  return (
    <VipLayout
      title={`${data.plate} — Docs vault`}
      subtitle={`${data.docs.length} document${data.docs.length === 1 ? "" : "s"} on file`}
    >
      <VehicleTabs vehicleId={data.vehicleId} current="docs" />

      {data.docs.length === 0 ? (
        <VipCard>
          <VipEmpty
            title="No documents yet"
            hint="Upload RC, insurance, PUC & warranty PDFs"
          />
        </VipCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.docs.map((d) => {
            const days = daysUntil(d.expiresAt);
            const expired = days != null && days < 0;
            const expiringSoon = days != null && days >= 0 && days < 60;
            return (
              <div
                key={d.id}
                className={`rounded-lg border bg-gradient-to-br ${KIND_COLOR[d.kind]} p-4 flex flex-col gap-3 min-h-[180px]`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-300">
                      {DOC_LABEL[d.kind]}
                    </div>
                    <div className="text-[13px] font-semibold mt-1">
                      {d.issuer ?? "Issuer unknown"}
                    </div>
                  </div>
                  <div className="w-10 h-12 rounded bg-slate-900/60 border border-slate-700 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-slate-300" />
                  </div>
                </div>

                <div className="flex-1" />

                {d.expiresAt ? (
                  <div className="text-[11px] flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span className="text-slate-300">
                      Expires{" "}
                      {new Date(d.expiresAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {expired ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-rose-300">
                        <AlertTriangle className="w-3 h-3" /> expired
                      </span>
                    ) : expiringSoon ? (
                      <span className="ml-auto text-amber-300">
                        in {days}d
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    No expiry recorded
                  </div>
                )}

                <button
                  onClick={() => handleDownload(d)}
                  className="inline-flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-[11px] hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            );
          })}
        </div>
      )}
    </VipLayout>
  );
};

export default VipDocsScreen;
