// Screen: F-06 · Primitives: Reservation, Availability, Provider
// Batch Reservations wizard — "Book 20 chargers for tomorrow 22:00–05:00 near Depot A".

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Check, ChevronRight, MapPin, Zap } from "lucide-react";
import {
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateBatchReservation,
  useFleetBatch,
  useFleetDepots,
} from "@/modules/fleet/hooks";
import { cn } from "@/lib/utils";

type WizardStep = 0 | 1 | 2 | 3;

const FleetBatchReserveScreen = () => {
  const batch = useFleetBatch();
  const depots = useFleetDepots();
  const create = useCreateBatchReservation();

  const [step, setStep] = useState<WizardStep>(0);
  const [label, setLabel] = useState("Night shift — Wed 22:00–05:00");
  const [depotId, setDepotId] = useState("depot-a");
  const [chargersNeeded, setChargersNeeded] = useState(20);
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("05:00");

  const depotOptions = depots.data ?? [];
  const selectedDepot = depotOptions.find((d) => d.id === depotId);

  const windowStart = useMemo(
    () => new Date(`${dateStr}T${startTime}:00`).toISOString(),
    [dateStr, startTime],
  );
  const windowEnd = useMemo(() => {
    const d = new Date(`${dateStr}T${endTime}:00`);
    // if end < start, assume next day
    const start = new Date(`${dateStr}T${startTime}:00`);
    if (d.getTime() <= start.getTime()) d.setDate(d.getDate() + 1);
    return d.toISOString();
  }, [dateStr, endTime, startTime]);

  const submit = async () => {
    try {
      await create.mutateAsync({
        label,
        depotId,
        windowStart,
        windowEnd,
        chargersNeeded,
      });
      toast.success("Batch requested — partial confirms typical");
      setStep(0);
    } catch {
      toast.error("Could not queue batch");
    }
  };

  if (batch.isLoading || depots.isLoading)
    return (
      <FleetLayout
        title="Batch reservations"
        screenId="F-06"
        primitives={["Reservation", "Availability", "Provider"]}
      >
        <FleetLoading />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Batch reservations"
      screenId="F-06"
      primitives={["Reservation", "Availability", "Provider"]}
    >
      <FleetPageBody>
        <FleetSection
          title="New batch"
          subtitle="Reserve N chargers in a shift window near a depot"
        >
          <div className="p-5 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
            {/* Stepper */}
            <ol className="space-y-1">
              {["Window", "Depot", "Capacity", "Review"].map((s, i) => (
                <li
                  key={s}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-[12px]",
                    step === i
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : i < step
                        ? "text-slate-600"
                        : "text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold",
                      step === i
                        ? "bg-blue-600 text-white"
                        : i < step
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>

            {/* Steps */}
            <div>
              {step === 0 && (
                <div className="space-y-3">
                  <Field label="Label">
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 px-3 text-[13px]"
                    />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Date">
                      <input
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-200 px-3 text-[13px]"
                      />
                    </Field>
                    <Field label="Start">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-200 px-3 text-[13px]"
                      />
                    </Field>
                    <Field label="End">
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-200 px-3 text-[13px]"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {depotOptions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDepotId(d.id)}
                      className={cn(
                        "text-left rounded-lg border p-3 transition-colors",
                        depotId === d.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={cn("w-4 h-4", depotId === d.id ? "text-blue-600" : "text-slate-400")} />
                        <p className="text-[13px] font-semibold text-slate-900">
                          {d.name}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{d.address}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3 max-w-sm">
                  <Field label={`Chargers needed (${chargersNeeded})`}>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={chargersNeeded}
                      onChange={(e) => setChargersNeeded(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </Field>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[12px] text-slate-600">
                      Estimated cost: <span className="font-semibold text-slate-900">
                        ₹{(chargersNeeded * 380).toLocaleString()}
                      </span>{" "}
                      · ~₹380/charger @ 22kWh · 18% GST
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <Row label="Label" value={label} />
                  <Row label="Depot" value={selectedDepot?.name ?? depotId} />
                  <Row
                    label="Window"
                    value={`${new Date(windowStart).toLocaleString()} → ${new Date(windowEnd).toLocaleString()}`}
                  />
                  <Row label="Chargers" value={String(chargersNeeded)} />
                  <Row label="Est. cost" value={`₹${(chargersNeeded * 380).toLocaleString()}`} />
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => (s - 1) as WizardStep)}
                    className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => (s + 1) as WizardStep)}
                    className="h-8 px-3 rounded-md bg-blue-600 text-white text-[12px] font-semibold inline-flex items-center gap-1"
                  >
                    Continue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={create.isPending}
                    className="h-8 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold inline-flex items-center gap-1 disabled:opacity-70"
                  >
                    <Zap className="w-3.5 h-3.5" /> Confirm batch
                  </button>
                )}
              </div>
            </div>
          </div>
        </FleetSection>

        <FleetSection
          title="Recent batches"
          subtitle={`${batch.data?.length ?? 0} in history`}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Label</TableHead>
                <TableHead className="text-[11px]">Depot</TableHead>
                <TableHead className="text-[11px]">Window</TableHead>
                <TableHead className="text-[11px] text-right">Needed</TableHead>
                <TableHead className="text-[11px] text-right">Confirmed</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(batch.data ?? []).map((b) => (
                <TableRow key={b.id} className="text-[12px]">
                  <TableCell className="py-2 font-semibold text-slate-800">
                    {b.label}
                  </TableCell>
                  <TableCell className="py-2 font-mono text-slate-500">
                    {b.depotId}
                  </TableCell>
                  <TableCell className="py-2 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3 text-slate-400" />
                    {new Date(b.windowStart).toLocaleString()} →{" "}
                    {new Date(b.windowEnd).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="py-2 text-right">{b.chargersNeeded}</TableCell>
                  <TableCell className="py-2 text-right font-semibold">
                    {b.confirmedIds.length}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        b.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : b.status === "partially_confirmed"
                            ? "bg-amber-50 text-amber-700"
                            : b.status === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {b.status.replace("_", " ")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </FleetSection>
      </FleetPageBody>
    </FleetLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
      {label}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between border-b border-slate-200 pb-1.5">
    <span className="text-[11px] text-slate-500">{label}</span>
    <span className="text-[13px] font-semibold text-slate-900 text-right">{value}</span>
  </div>
);

export default FleetBatchReserveScreen;
