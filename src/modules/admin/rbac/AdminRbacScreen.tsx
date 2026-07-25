// Screen: A-14 · Primitives: Identity
// Route: /admin/rbac

import { useState } from "react";
import {
  KeyRound,
  Loader2,
  UserPlus,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import {
  useAdminUsers,
  useInviteAdmin,
  useRemoveAdmin,
  useSetAdminStatus,
  useUpdateAdminRole,
} from "./hooks";
import {
  ROLE_LABEL,
  ROLE_PERMISSIONS,
  type AdminRole,
  type AdminUser,
} from "./types";

const AdminRbacScreen = () => {
  const { data: users = [], isLoading, isError } = useAdminUsers();
  const invite = useInviteAdmin();
  const updateRole = useUpdateAdminRole();
  const setStatus = useSetAdminStatus();
  const remove = useRemoveAdmin();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "support" as AdminRole,
  });

  const submitInvite = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Name, email, and phone required");
      return;
    }
    await invite.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
    });
    setInviteOpen(false);
    setForm({ name: "", email: "", phone: "", role: "support" });
    toast.success("Invite sent");
  };

  const changeRole = async (id: string, role: AdminRole) => {
    try {
      await updateRole.mutateAsync({ id, role });
      toast.success(`Role changed to ${ROLE_LABEL[role]}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not change role");
    }
  };

  const toggleSuspend = async (u: AdminUser) => {
    const next: AdminUser["status"] = u.status === "suspended" ? "active" : "suspended";
    await setStatus.mutateAsync({ id: u.id, status: next });
    toast.success(next === "active" ? "Admin reactivated" : "Admin suspended");
  };

  const doRemove = async (u: AdminUser) => {
    if (!window.confirm(`Remove ${u.name}? This cannot be undone.`)) return;
    try {
      await remove.mutateAsync(u.id);
      toast.success("Admin removed");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not remove admin");
    }
  };

  return (
    <AdminLayout
      title="Admin RBAC"
      subtitle="Manage roles and access for internal team"
      action={
        <MobileButton
          size="sm"
          className="gap-1.5"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="w-4 h-4" /> Invite admin
        </MobileButton>
      }
    >
      {/* Role catalog */}
      <div className="grid lg:grid-cols-4 gap-3 mb-4">
        {(Object.keys(ROLE_LABEL) as AdminRole[]).map((r) => {
          const count = users.filter((u) => u.role === r).length;
          return (
            <div
              key={r}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-body-sm font-bold text-foreground">
                  {ROLE_LABEL[r]}
                </p>
                <span className="text-caption font-bold text-muted-foreground">
                  {count}
                </span>
              </div>
              <p className="text-caption text-muted-foreground mt-0.5">
                {ROLE_PERMISSIONS[r].label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-body-sm text-destructive p-4">
            Couldn't load admin users
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="bg-secondary/60 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Last login</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{u.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {u.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-body-sm">
                      <p className="text-foreground">{u.email}</p>
                      <p className="text-caption text-muted-foreground">
                        {u.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value as AdminRole)}
                        className="h-9 rounded-lg border border-border bg-background px-2 text-body-sm"
                      >
                        {(Object.keys(ROLE_LABEL) as AdminRole[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-caption text-muted-foreground">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <MobileButton
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => toggleSuspend(u)}
                          loading={setStatus.isPending}
                        >
                          {u.status === "suspended" ? (
                            <>
                              <Play className="w-3.5 h-3.5" /> Activate
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Suspend
                            </>
                          )}
                        </MobileButton>
                        <MobileButton
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => doRemove(u)}
                          loading={remove.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </MobileButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Invite admin</DialogTitle>
            <DialogDescription>
              They'll receive an email with a sign-in link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 phone"
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
            >
              {(Object.keys(ROLE_LABEL) as AdminRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]} — {ROLE_PERMISSIONS[r].label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </MobileButton>
            <MobileButton
              className="flex-1 gap-1.5"
              onClick={submitInvite}
              loading={invite.isPending}
            >
              <KeyRound className="w-4 h-4" /> Send invite
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const StatusBadge = ({ status }: { status: AdminUser["status"] }) => {
  const map: Record<AdminUser["status"], string> = {
    active: "bg-success/10 text-success",
    invited: "bg-warning/10 text-warning",
    suspended: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
      {status}
    </span>
  );
};

export default AdminRbacScreen;
