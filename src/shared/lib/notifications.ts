// App-wide in-app notification store (localStorage-backed).
// Extracted from src/lib/mechanic.ts so consumer/partner/mechanic/ev/rental modules
// can all publish + read notifications from one canonical store.

export type NotificationAudience =
  | "owner"
  | "worker"
  | "consumer"
  | "vendor"
  | "admin";

export interface AppNotification {
  id: string;
  audience: NotificationAudience;
  /** shopId | workerId | consumerPhone | partnerId — whoever owns this audience bucket */
  audienceId: string;
  title: string;
  body: string;
  createdAt: string;
  read?: boolean;
}

const NOTIFS_KEY = "mechanicAppNotifications";
const MAX_NOTIFS = 200;

export function getNotifications(
  audience: NotificationAudience,
  audienceId: string,
): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    return all.filter(
      (n) => n.audience === audience && n.audienceId === audienceId,
    );
  } catch {
    return [];
  }
}

export function pushNotification(
  n: Omit<AppNotification, "id" | "createdAt">,
) {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    all.unshift({
      ...n,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(all.slice(0, MAX_NOTIFS)));
  } catch {
    /* storage full or disabled — silently drop */
  }
}

export function markAllNotificationsRead(
  audience: NotificationAudience,
  audienceId: string,
) {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    const next = all.map((n) =>
      n.audience === audience && n.audienceId === audienceId
        ? { ...n, read: true }
        : n,
    );
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(next));
  } catch {
    /* */
  }
}

export function unreadCount(
  audience: NotificationAudience,
  audienceId: string,
): number {
  return getNotifications(audience, audienceId).filter((n) => !n.read).length;
}

/**
 * Convenience wrapper for admin surfaces. Admin notifications are broadcast
 * (any admin session sees them) so we use a fixed audienceId of "admin".
 * A03 approvals, A06 disputes, A08 incidents all call this on interesting
 * events; the admin dashboard "Notifications" tab reads them via
 * `getNotifications("admin", "admin")`.
 */
export function pushAdminNotification(
  n: Omit<AppNotification, "id" | "createdAt" | "audience" | "audienceId"> & {
    audienceId?: string;
  },
) {
  const { audienceId = "admin", ...rest } = n;
  pushNotification({ ...rest, audience: "admin", audienceId });
}
