// Screen: MOS-11 · Primitives: Notification, Vehicle, Identity
// Route: /mechanic-os/reminders

import { useMemo, useState } from "react";
import { Bell, Clock, MessageSquare, Send } from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  listReminders,
  updateReminder,
  type ServiceReminder,
} from "@/modules/mechanic-os/lib/mos-store";
import { toast } from "sonner";

const STATUS_TONE: Record<ServiceReminder["status"], string> = {
  pending: "bg-warning/10 text-warning",
  sent: "bg-primary/10 text-primary",
  booked: "bg-success/10 text-success",
};

const MosRemindersScreen = () => {
  const [tick, setTick] = useState(0);
  const reminders = useMemo(() => listReminders(), [tick]);

  const stats = useMemo(
    () => ({
      overdue: reminders.filter(
        (r) => new Date(r.nextDueISO).getTime() < Date.now(),
      ).length,
      due30: reminders.filter((r) => {
        const gap = new Date(r.nextDueISO).getTime() - Date.now();
        return gap >= 0 && gap <= 30 * 86400000;
      }).length,
      pending: reminders.filter((r) => r.status === "pending").length,
    }),
    [reminders],
  );

  const send = (r: ServiceReminder) => {
    updateReminder(r.id, { status: "sent" });
    toast.success(`Reminder sent to ${r.customerName} via SMS (mock)`);
    setTick((t) => t + 1);
  };
  const markBooked = (r: ServiceReminder) => {
    updateReminder(r.id, { status: "booked" });
    toast.success(`${r.customerName} booked next service`);
    setTick((t) => t + 1);
  };

  return (
    <MechanicOsLayout
      title="Loyalty & reminders"
      subtitle="Auto-remind customers when their next service is due"
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Kpi label="Overdue" value={String(stats.overdue)} tone="destructive" />
        <Kpi label="Due next 30d" value={String(stats.due30)} tone="warning" />
        <Kpi label="Not yet sent" value={String(stats.pending)} tone="primary" />
      </div>

      <div className="space-y-3">
        {reminders.length === 0 && (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center">
            <Bell className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-body-sm text-muted-foreground mt-2">
              No reminders queued.
            </p>
          </div>
        )}
        {reminders.map((r) => {
          const overdue = new Date(r.nextDueISO).getTime() < Date.now();
          const days = Math.round(
            (new Date(r.nextDueISO).getTime() - Date.now()) / 86400000,
          );
          return (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-body-sm font-bold text-foreground">
                      {r.customerName}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-md text-caption font-semibold capitalize ${STATUS_TONE[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    {r.vehicleLabel} · {r.customerPhone}
                  </p>
                  <p className="text-body-sm text-foreground mt-1">
                    {r.reason}
                  </p>
                  <p
                    className={`text-caption mt-1 flex items-center gap-1 ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}
                  >
                    <Clock className="w-3 h-3" />
                    {overdue
                      ? `Overdue by ${Math.abs(days)} day(s)`
                      : `Due in ${days} day(s)`}
                    · Last service{" "}
                    {new Date(r.lastServiceISO).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {r.status !== "sent" && r.status !== "booked" && (
                    <MobileButton size="sm" onClick={() => send(r)}>
                      <Send className="w-4 h-4" /> Send SMS
                    </MobileButton>
                  )}
                  {r.status === "sent" && (
                    <MobileButton
                      size="sm"
                      variant="success"
                      onClick={() => markBooked(r)}
                    >
                      <MessageSquare className="w-4 h-4" /> Mark booked
                    </MobileButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MechanicOsLayout>
  );
};

const Kpi = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "warning" | "destructive" | "primary";
}) => {
  const toneCls =
    tone === "warning"
      ? "text-warning"
      : tone === "destructive"
        ? "text-destructive"
        : "text-primary";
  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${toneCls}`}>{value}</p>
    </div>
  );
};

export default MosRemindersScreen;
