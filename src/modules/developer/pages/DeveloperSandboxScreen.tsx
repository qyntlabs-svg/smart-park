// Screen: DEV-03 · Primitives: Reservation, Payment
// Sandbox Console — test-mode dashboard: mock reservations + mock payments.

import { useState } from "react";
import { toast } from "sonner";
import { Play, Terminal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DevKpi,
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import {
  useCreateSandboxReservation,
  useDevSandboxPayments,
  useDevSandboxReservations,
} from "@/modules/developer/hooks";

const CHARGERS = ["ccs", "type2", "chademo", "gbt"];
const STATIONS = ["ev-seed-omr", "ev-seed-velachery", "ev-seed-tnagar"];

const DeveloperSandboxScreen = () => {
  const reservations = useDevSandboxReservations();
  const payments = useDevSandboxPayments();
  const create = useCreateSandboxReservation();

  const [station, setStation] = useState(STATIONS[0]);
  const [charger, setCharger] = useState(CHARGERS[0]);
  const [amount, setAmount] = useState(600);

  const runReservation = async () => {
    try {
      const r = await create.mutateAsync({
        stationId: station,
        chargerType: charger,
        amount,
      });
      toast.success(`Sandbox reservation ${r.id} created`);
    } catch {
      toast.error("Sandbox call failed");
    }
  };

  const total = reservations.data?.length ?? 0;
  const captured =
    payments.data?.filter((p) => p.status === "captured").length ?? 0;
  const gross =
    payments.data
      ?.filter((p) => p.status === "captured")
      .reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <DeveloperLayout
      title="Sandbox console"
      screenId="DEV-03"
      primitives={["Reservation", "Payment"]}
      actions={
        <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase">
          Test mode
        </span>
      }
    >
      {reservations.isLoading || payments.isLoading ? (
        <DevLoading />
      ) : (
        <DevPageBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <DevKpi label="Sandbox reservations" value={String(total)} />
            <DevKpi
              label="Captured payments"
              value={String(captured)}
              hint="test cards"
            />
            <DevKpi label="Gross (₹)" value={gross.toLocaleString()} />
            <DevKpi label="Env" value="test" hint="no real payments" />
          </div>

          <DevSection
            title="Fire a mock reservation"
            subtitle="POST /v1/reservations — same shape as production"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <label className="block">
                <span className="text-[11px] uppercase text-slate-500 font-semibold">
                  Station
                </span>
                <select
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 px-2 text-[13px]"
                >
                  {STATIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase text-slate-500 font-semibold">
                  Charger type
                </span>
                <select
                  value={charger}
                  onChange={(e) => setCharger(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 px-2 text-[13px]"
                >
                  {CHARGERS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase text-slate-500 font-semibold">
                  Amount (₹)
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 px-2 text-[13px]"
                />
              </label>
              <button
                onClick={runReservation}
                disabled={create.isPending}
                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" /> Send request
              </button>
            </div>
            <div className="px-4 pb-4">
              <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">
                {`curl https://api.smartpark.dev/v1/reservations \\
  -H "Authorization: Bearer sk_test_****ccd0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "stationId": "${station}",
    "chargerType": "${charger}",
    "amount": ${amount}
  }'`}
              </pre>
            </div>
          </DevSection>

          <DevSection title="Sandbox reservations" subtitle="Latest first">
            {(reservations.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-[13px] text-slate-500">
                <Terminal className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No sandbox reservations yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">ID</TableHead>
                    <TableHead className="text-[11px]">Station</TableHead>
                    <TableHead className="text-[11px]">Type</TableHead>
                    <TableHead className="text-[11px]">Amount</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px]">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.data!.map((r) => (
                    <TableRow key={r.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono">{r.id}</TableCell>
                      <TableCell className="py-2">{r.stationId}</TableCell>
                      <TableCell className="py-2 font-mono">
                        {r.chargerType}
                      </TableCell>
                      <TableCell className="py-2">₹{r.amount}</TableCell>
                      <TableCell className="py-2">
                        <span
                          className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                            r.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.status === "cancelled"
                                ? "bg-red-50 text-red-700"
                                : r.status === "confirmed"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DevSection>

          <DevSection title="Sandbox payments">
            {(payments.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-[13px] text-slate-500">
                No sandbox payments yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Payment</TableHead>
                    <TableHead className="text-[11px]">Reservation</TableHead>
                    <TableHead className="text-[11px]">Amount</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px]">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.data!.map((p) => (
                    <TableRow key={p.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono">{p.id}</TableCell>
                      <TableCell className="py-2 font-mono">
                        {p.reservationId}
                      </TableCell>
                      <TableCell className="py-2">
                        ₹{p.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                            p.status === "captured"
                              ? "bg-emerald-50 text-emerald-700"
                              : p.status === "refunded"
                                ? "bg-blue-50 text-blue-700"
                                : p.status === "failed"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-slate-500">
                        {new Date(p.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DevSection>
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperSandboxScreen;
