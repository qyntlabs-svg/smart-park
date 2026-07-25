// Screen: CO-12 · Primitives: Notification
// Operator Notifications — charger offline, dispute, payout hit.

import { AlertTriangle, CheckCheck, Info } from "lucide-react";
import { toast } from "sonner";
import {
  OperatorEmpty,
  OperatorLayout,
  OperatorLoading,
  OperatorPageBody,
  OperatorSection,
} from "@/modules/operator/components/OperatorLayout";
import {
  useMarkAllOperatorNoticesRead,
  useMarkOperatorNoticeRead,
  useOperatorNotices,
} from "@/modules/operator/hooks";
import type { OperatorNotice, OperatorNoticeSeverity } from "@/modules/operator/types";
import { cn } from "@/lib/utils";

const OperatorNotificationsScreen = () => {
  const notices = useOperatorNotices();
  const markOne = useMarkOperatorNoticeRead();
  const markAll = useMarkAllOperatorNoticesRead();

  const list = notices.data ?? [];
  const unread = list.filter((n) => !n.read).length;

  const groups: Record<OperatorNoticeSeverity, OperatorNotice[]> = {
    critical: list.filter((n) => n.severity === "critical"),
    warning: list.filter((n) => n.severity === "warning"),
    info: list.filter((n) => n.severity === "info"),
  };

  return (
    <OperatorLayout
      title="Notifications"
      screenId="CO-12"
      primitives={["Notification"]}
      actions={
        <button
          onClick={async () => {
            await markAll.mutateAsync();
            toast.success("Inbox cleared");
          }}
          disabled={unread === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 disabled:opacity-50"
        >
          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
        </button>
      }
    >
      {notices.isLoading ? (
        <OperatorLoading />
      ) : (
        <OperatorPageBody>
          {list.length === 0 ? (
            <OperatorSection title="Inbox">
              <OperatorEmpty
                title="All clear"
                body="Charger-offline, dispute, and payout events land here."
              />
            </OperatorSection>
          ) : (
            (["critical", "warning", "info"] as OperatorNoticeSeverity[]).map((sev) =>
              groups[sev].length === 0 ? null : (
                <OperatorSection
                  key={sev}
                  title={sev === "critical" ? "Critical" : sev === "warning" ? "Warning" : "Info"}
                  subtitle={`${groups[sev].length} · ${groups[sev].filter((n) => !n.read).length} unread`}
                >
                  <ul className="divide-y divide-slate-100">
                    {groups[sev].map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          "px-4 py-3 flex items-start gap-3",
                          !n.read && "bg-emerald-50/20",
                        )}
                      >
                        <SeverityBadge sev={n.severity} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            )}
                          </div>
                          <p className="text-[12px] text-slate-600 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                            {n.stationId && ` · ${n.stationId}`}
                          </p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markOne.mutateAsync(n.id)}
                            className="text-[11px] font-semibold text-emerald-700 hover:underline shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </OperatorSection>
              ),
            )
          )}
        </OperatorPageBody>
      )}
    </OperatorLayout>
  );
};

const SeverityBadge = ({ sev }: { sev: OperatorNoticeSeverity }) => {
  const map = {
    critical: { icon: AlertTriangle, cls: "text-red-600 bg-red-50" },
    warning: { icon: AlertTriangle, cls: "text-amber-600 bg-amber-50" },
    info: { icon: Info, cls: "text-emerald-600 bg-emerald-50" },
  } as const;
  const { icon: Icon, cls } = map[sev];
  return (
    <div
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        cls,
      )}
    >
      <Icon className="w-4 h-4" />
    </div>
  );
};

export default OperatorNotificationsScreen;
