// Screen: F-13 · Primitives: Notification
// Fleet Notifications & Alerts — vehicle down, charger offline in shift window, etc.

import { AlertTriangle, Bell, CheckCheck, Info } from "lucide-react";
import { toast } from "sonner";
import {
  FleetEmpty,
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import {
  useFleetAlerts,
  useMarkAllFleetAlertsRead,
  useMarkFleetAlertRead,
} from "@/modules/fleet/hooks";
import type { FleetAlert } from "@/modules/fleet/types";
import { cn } from "@/lib/utils";

const FleetNotificationsScreen = () => {
  const alerts = useFleetAlerts();
  const markOne = useMarkFleetAlertRead();
  const markAll = useMarkAllFleetAlertsRead();

  const list = alerts.data ?? [];
  const unreadCount = list.filter((a) => !a.read).length;

  const groups: Record<FleetAlert["severity"], FleetAlert[]> = {
    critical: list.filter((a) => a.severity === "critical"),
    warning: list.filter((a) => a.severity === "warning"),
    info: list.filter((a) => a.severity === "info"),
  };

  return (
    <FleetLayout
      title="Notifications"
      screenId="F-13"
      primitives={["Notification"]}
      actions={
        <button
          onClick={async () => {
            await markAll.mutateAsync();
            toast.success("Inbox cleared");
          }}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 disabled:opacity-50"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      }
    >
      {alerts.isLoading ? (
        <FleetLoading />
      ) : (
        <FleetPageBody>
          {list.length === 0 ? (
            <FleetSection title="Inbox">
              <FleetEmpty
                title="Zero alerts"
                body="Fleet is nominal. This is where charger-offline, license-expiry, and predictive-service alerts show up."
              />
            </FleetSection>
          ) : (
            (["critical", "warning", "info"] as const).map((sev) =>
              groups[sev].length === 0 ? null : (
                <FleetSection
                  key={sev}
                  title={
                    sev === "critical"
                      ? "Critical"
                      : sev === "warning"
                        ? "Warning"
                        : "Info"
                  }
                  subtitle={`${groups[sev].length} · ${groups[sev].filter((a) => !a.read).length} unread`}
                >
                  <ul className="divide-y divide-slate-100">
                    {groups[sev].map((a) => (
                      <li
                        key={a.id}
                        className={cn(
                          "px-4 py-3 flex items-start gap-3",
                          !a.read && "bg-blue-50/30",
                        )}
                      >
                        <SeverityIcon severity={a.severity} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">
                              {a.title}
                            </p>
                            {!a.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <p className="text-[12px] text-slate-600 mt-0.5">
                            {a.body}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(a.createdAt).toLocaleString()}
                            {a.vehicleId && ` · vehicle ${a.vehicleId}`}
                          </p>
                        </div>
                        {!a.read && (
                          <button
                            onClick={() => markOne.mutateAsync(a.id)}
                            className="text-[11px] font-semibold text-blue-700 hover:underline shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </FleetSection>
              ),
            )
          )}
        </FleetPageBody>
      )}
    </FleetLayout>
  );
};

const SeverityIcon = ({ severity }: { severity: FleetAlert["severity"] }) => {
  const map = {
    critical: { icon: AlertTriangle, cls: "text-red-600 bg-red-50" },
    warning: { icon: AlertTriangle, cls: "text-amber-600 bg-amber-50" },
    info: { icon: Info, cls: "text-blue-600 bg-blue-50" },
  } as const;
  const { icon: Icon, cls } = map[severity];
  return (
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cls)}>
      <Icon className="w-4 h-4" />
    </div>
  );
};

// suppress unused import warning
void Bell;

export default FleetNotificationsScreen;
