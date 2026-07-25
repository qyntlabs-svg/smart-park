// Screen: VIP-01 · Primitives: Vehicle, Identity
// Route: /vip
// Admin/OEM/insurer entry point: search vehicles by VIN, plate, make, model.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Car, ExternalLink } from "lucide-react";
import {
  VipCard,
  VipEmpty,
  VipError,
  VipLayout,
  VipLoading,
} from "../components/VipLayout";
import { useVipVehicleSearch } from "../hooks";

const VipVehicleSearchScreen = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data, isLoading, isError } = useVipVehicleSearch(query);

  const results = useMemo(() => data ?? [], [data]);

  return (
    <VipLayout
      title="Vehicle search"
      subtitle="Search the identity graph by plate, VIN, make, or model"
    >
      <VipCard>
        <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-500"
            placeholder="e.g. TN 07 CX 4421 or MG"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          ) : null}
        </div>
      </VipCard>

      <div className="mt-4">
        <VipCard title={`Results · ${results.length}`}>
          {isLoading ? (
            <VipLoading />
          ) : isError ? (
            <VipError message="Failed to search vehicles." />
          ) : results.length === 0 ? (
            <VipEmpty
              title="No vehicles matched"
              hint="Try a partial plate or make (e.g. 'MG')"
              icon={Car}
            />
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-[13px]">
                <thead className="text-slate-400 text-left text-[11px] uppercase tracking-wider">
                  <tr className="border-b border-slate-800">
                    <th className="py-2 font-medium">Plate</th>
                    <th className="py-2 font-medium">VIN</th>
                    <th className="py-2 font-medium">Vehicle</th>
                    <th className="py-2 font-medium">Owner (current)</th>
                    <th className="py-2 font-medium text-right">Events</th>
                    <th className="py-2 font-medium text-right">Recalls</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {results.map((v) => {
                    const owner =
                      v.ownershipChain.find((o) => !o.to)?.owner ??
                      v.ownershipChain.at(-1)?.owner ??
                      "—";
                    const openRecalls = v.recalls.filter(
                      (r) => r.status === "open",
                    ).length;
                    return (
                      <tr
                        key={v.vehicleId}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40 cursor-pointer"
                        onClick={() =>
                          navigate(`/vip/vehicles/${v.vehicleId}`)
                        }
                      >
                        <td className="py-3 font-mono text-cyan-200">
                          {v.plate}
                        </td>
                        <td className="py-3 font-mono text-slate-400 text-[12px]">
                          {v.vin ?? "—"}
                        </td>
                        <td className="py-3">
                          {v.year} {v.make} {v.model}
                        </td>
                        <td className="py-3 text-slate-300">{owner}</td>
                        <td className="py-3 text-right tabular-nums">
                          {v.serviceHistory.length}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {openRecalls > 0 ? (
                            <span className="rounded px-1.5 py-0.5 bg-amber-500/20 text-amber-200 text-[11px]">
                              {openRecalls} open
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3 text-right pr-1">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </VipCard>
      </div>
    </VipLayout>
  );
};

export default VipVehicleSearchScreen;
