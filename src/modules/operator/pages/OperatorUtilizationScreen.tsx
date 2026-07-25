// Screen: CO-07 · Primitives: Reservation, Availability
// Utilization Analytics — heatmap day×hour, sessions per station.

import { Fragment, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  OperatorLayout,
  OperatorLoading,
  OperatorPageBody,
  OperatorSection,
} from "@/modules/operator/components/OperatorLayout";
import {
  useStationSummaries,
  useUtilizationHeat,
} from "@/modules/operator/hooks";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const OperatorUtilizationScreen = () => {
  const heat = useUtilizationHeat();
  const summaries = useStationSummaries();
  const [hover, setHover] = useState<{ day: string; hour: number; value: number } | null>(
    null,
  );

  const grid = useMemo(() => {
    const m = new Map<string, number>();
    (heat.data ?? []).forEach((c) => m.set(`${c.dayLabel}-${c.hour}`, c.value));
    return m;
  }, [heat.data]);

  const max = useMemo(() => {
    let m = 1;
    (heat.data ?? []).forEach((c) => {
      if (c.value > m) m = c.value;
    });
    return m;
  }, [heat.data]);

  const perStation = useMemo(() => {
    return [...(summaries.data ?? [])]
      .sort((a, b) => b.utilizationPct - a.utilizationPct)
      .map((s) => ({ name: s.name.split(" — ").pop() ?? s.name, util: s.utilizationPct }));
  }, [summaries.data]);

  if (heat.isLoading || summaries.isLoading)
    return (
      <OperatorLayout title="Utilization" screenId="CO-07" primitives={["Reservation", "Availability"]}>
        <OperatorLoading />
      </OperatorLayout>
    );

  return (
    <OperatorLayout
      title="Utilization"
      screenId="CO-07"
      primitives={["Reservation", "Availability"]}
    >
      <OperatorPageBody>
        <OperatorSection
          title="Session heatmap (day × hour)"
          subtitle="Darker cells = more sessions started in that hour of week"
        >
          <div className="p-4 overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-[52px_repeat(24,1fr)] gap-0.5">
                <div />
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="text-[9px] text-slate-500 text-center py-1 font-mono"
                  >
                    {h}
                  </div>
                ))}
                {DAYS.map((d) => (
                  <Fragment key={`row-${d}`}>
                    <div
                      className="text-[10px] text-slate-500 font-semibold flex items-center pr-1"
                    >
                      {d}
                    </div>
                    {HOURS.map((h) => {
                      const v = grid.get(`${d}-${h}`) ?? 0;
                      const intensity = v / max;
                      const bg =
                        intensity === 0
                          ? "#f1f5f9"
                          : intensity < 0.25
                            ? "#d1fae5"
                            : intensity < 0.5
                              ? "#6ee7b7"
                              : intensity < 0.75
                                ? "#10b981"
                                : "#047857";
                      return (
                        <div
                          key={`${d}-${h}`}
                          className="h-6 rounded-sm cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: bg }}
                          title={`${d} ${h}:00 · ${v} sessions`}
                          onMouseEnter={() => setHover({ day: d, hour: h, value: v })}
                          onMouseLeave={() => setHover(null)}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span>Peak sessions in a cell: {max}</span>
                {hover && (
                  <span>
                    <span className="font-semibold">{hover.day} {hover.hour}:00</span> · {hover.value}
                    {" sessions"}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <span>Low</span>
                  <div className="flex">
                    {["#f1f5f9", "#d1fae5", "#6ee7b7", "#10b981", "#047857"].map((c) => (
                      <div key={c} className="w-4 h-3" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>
        </OperatorSection>

        <OperatorSection title="Utilization per station" subtitle="Today, % of connector-hours in use">
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perStation} layout="vertical">
                <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="util" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OperatorSection>

        <OperatorSection
          title="Reading the heatmap"
          subtitle="Recommended pricing hooks based on your traffic curve"
        >
          <ul className="p-4 space-y-2 text-[12px] text-slate-600 list-disc list-inside">
            <li>
              Cells above 75% intensity are prime <span className={cn("font-semibold text-slate-900")}>surge candidates</span>.
              Wire a rule in Pricing to +₹2/kWh during those windows.
            </li>
            <li>
              Cells at 0% between 01:00–05:00 could go negative-priced to attract
              overnight fleet charging — see the Fleet OS batch reservation flow.
            </li>
            <li>
              Widen weekday morning peak windows if session count sustains &gt; 50% of peak for 3 consecutive weeks.
            </li>
          </ul>
        </OperatorSection>
      </OperatorPageBody>
    </OperatorLayout>
  );
};

export default OperatorUtilizationScreen;
