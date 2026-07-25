// Screen: VIP-07 · Primitives: Vehicle
// Route: /vip/integrations/oem
// OEM data feeds — recalls in, telematics in (mock).

import { useMemo, useState } from "react";
import { Radio, Zap, Wrench, Play, Pause } from "lucide-react";
import {
  VipCard,
  VipError,
  VipLayout,
  VipLoading,
} from "../components/VipLayout";
import { useVipVehicles } from "../hooks";

interface OemFeed {
  id: string;
  oem: string;
  logo: string;
  feedTypes: Array<"recall" | "telematics" | "software">;
  eventsToday: number;
  paused: boolean;
  lastEventAt: string;
}

const SEED_FEEDS: OemFeed[] = [
  {
    id: "oem-mg",
    oem: "MG Motor India",
    logo: "🏁",
    feedTypes: ["recall", "software"],
    eventsToday: 4,
    paused: false,
    lastEventAt: new Date(Date.now() - 900_000).toISOString(),
  },
  {
    id: "oem-tata",
    oem: "Tata Motors",
    logo: "🚙",
    feedTypes: ["recall", "telematics", "software"],
    eventsToday: 27,
    paused: false,
    lastEventAt: new Date(Date.now() - 210_000).toISOString(),
  },
  {
    id: "oem-hyundai",
    oem: "Hyundai",
    logo: "🚗",
    feedTypes: ["recall", "telematics"],
    eventsToday: 12,
    paused: false,
    lastEventAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: "oem-mahindra",
    oem: "Mahindra Electric",
    logo: "🚐",
    feedTypes: ["recall"],
    eventsToday: 0,
    paused: true,
    lastEventAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
  },
];

const FEED_TONE = {
  recall: "bg-amber-500/15 text-amber-200",
  telematics: "bg-cyan-500/15 text-cyan-200",
  software: "bg-violet-500/15 text-violet-200",
} as const;

const relTime = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const VipOemFeedsScreen = () => {
  const { data: vehicles, isLoading, isError } = useVipVehicles();
  const [feeds, setFeeds] = useState(SEED_FEEDS);

  const recallEvents = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.flatMap((v) =>
      v.recalls.map((r) => ({ ...r, plate: v.plate, vehicleId: v.vehicleId })),
    );
  }, [vehicles]);

  const toggleFeed = (id: string) =>
    setFeeds((list) =>
      list.map((f) => (f.id === id ? { ...f, paused: !f.paused } : f)),
    );

  if (isLoading) {
    return (
      <VipLayout title="OEM data feeds">
        <VipLoading />
      </VipLayout>
    );
  }

  return (
    <VipLayout
      title="OEM data feeds"
      subtitle="Inbound recall + telematics streams from manufacturers"
    >
      {isError ? (
        <VipError message="Failed to load OEM feeds." />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <VipCard title="Feed status" className="lg:col-span-2">
              <table className="w-full text-[13px]">
                <thead className="text-slate-400 text-left text-[11px] uppercase tracking-wider">
                  <tr className="border-b border-slate-800">
                    <th className="py-2 font-medium">OEM</th>
                    <th className="py-2 font-medium">Feeds</th>
                    <th className="py-2 font-medium text-right">Events today</th>
                    <th className="py-2 font-medium text-right">Last event</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {feeds.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center">
                            {f.logo}
                          </div>
                          <div>
                            <div className="font-medium">{f.oem}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {f.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {f.feedTypes.map((t) => (
                            <span
                              key={t}
                              className={`text-[10px] rounded px-1.5 py-0.5 ${FEED_TONE[t]}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {f.eventsToday}
                      </td>
                      <td className="py-3 text-right text-slate-400 text-[12px]">
                        {relTime(f.lastEventAt)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => toggleFeed(f.id)}
                          className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[11px] hover:bg-slate-800"
                        >
                          {f.paused ? (
                            <>
                              <Play className="w-3 h-3" /> Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3" /> Pause
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </VipCard>

            <VipCard title="Recall inbox" className="lg:col-span-1">
              {recallEvents.length === 0 ? (
                <div className="text-[12px] text-slate-400 py-6 text-center">
                  No recall events ingested.
                </div>
              ) : (
                <ul className="space-y-2">
                  {recallEvents.slice(0, 6).map((r) => (
                    <li
                      key={`${r.vehicleId}-${r.id}`}
                      className="rounded border border-slate-800 bg-slate-950/40 p-2 text-[12px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${r.status === "open" ? "bg-amber-400" : "bg-emerald-500"}`}
                        />
                        <span className="font-mono text-cyan-200 text-[11px]">
                          {r.plate}
                        </span>
                        <span className="text-slate-500 text-[10px] ml-auto">
                          {r.oem}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-300">{r.summary}</div>
                    </li>
                  ))}
                </ul>
              )}
            </VipCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-3">
              <Zap className="w-5 h-5 text-cyan-300" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Telematics events / min
                </div>
                <div className="text-xl font-semibold">1,284</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-3">
              <Wrench className="w-5 h-5 text-emerald-300" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Open recalls (network)
                </div>
                <div className="text-xl font-semibold">
                  {recallEvents.filter((r) => r.status === "open").length}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-3">
              <Radio className="w-5 h-5 text-violet-300" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Active OEM streams
                </div>
                <div className="text-xl font-semibold">
                  {feeds.filter((f) => !f.paused).length} / {feeds.length}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </VipLayout>
  );
};

export default VipOemFeedsScreen;
