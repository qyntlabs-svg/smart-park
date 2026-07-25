// Screen: V-21 · Primitives: Identity
// Route: /partner/staff

import { useState } from "react";
import {
  Users,
  UserPlus,
  Loader2,
  Trash2,
  Pause,
  Play,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useInviteStaff,
  useRevokeStaff,
  useStaff,
  useUpdateStaffStatus,
} from "./hooks";
import {
  STAFF_ROLE_LABEL,
  STAFF_STATUS_LABEL,
  type StaffRole,
  type StaffStatus,
} from "./types";

const FACILITIES = [
  { id: "fac_main", name: "T Nagar — Main lot" },
  { id: "fac_omr", name: "EV FastCharge — OMR" },
  { id: "fac_vel", name: "Rental — Velachery" },
];

const PartnerStaffScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: staff = [], isLoading, isError } = useStaff(partnerId);
  const invite = useInviteStaff();
  const updateStatus = useUpdateStaffStatus();
  const revoke = useRevokeStaff();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "attendant" as StaffRole,
    facilityId: FACILITIES[0].id,
  });

  const submitInvite = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    const fac = FACILITIES.find((f) => f.id === form.facilityId) ?? FACILITIES[0];
    await invite.mutateAsync({
      partnerId,
      name: form.name.trim(),
      phone: form.phone.trim(),
      role: form.role,
      facilityId: fac.id,
      facilityName: fac.name,
    });
    toast.success(`Invite SMS sent to ${form.phone}`);
    setInviteOpen(false);
    setForm({ name: "", phone: "", role: "attendant", facilityId: FACILITIES[0].id });
  };

  const toggleSuspend = async (id: string, current: StaffStatus) => {
    const next: StaffStatus = current === "active" ? "suspended" : "active";
    await updateStatus.mutateAsync({ partnerId, staffId: id, status: next });
    toast.success(next === "active" ? "Staff reactivated" : "Staff suspended");
  };

  const doRevoke = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from staff? They will lose all access.`))
      return;
    await revoke.mutateAsync({ partnerId, staffId: id });
    toast.success("Staff removed");
  };

  return (
    <PartnerScreenLayout
      title="Staff & Attendants"
      icon={Users}
      action={
        <MobileButton
          size="sm"
          className="gap-1.5"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="w-4 h-4" /> Invite
        </MobileButton>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-center text-body-sm text-destructive py-8">
          Couldn't load staff
        </p>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            No staff yet — invite an attendant to help you scan
          </p>
          <MobileButton
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="mt-2 gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Invite attendant
          </MobileButton>
        </div>
      ) : (
        staff.map((s) => (
          <div
            key={s.id}
            className="p-4 rounded-2xl border border-border bg-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-bold text-foreground truncate">
                  {s.name}
                </p>
                <p className="text-caption text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {s.phone}
                </p>
                <p className="text-caption text-muted-foreground mt-0.5 truncate">
                  {STAFF_ROLE_LABEL[s.role]} · {s.facilityName}
                </p>
                {s.status === "active" && (
                  <p className="text-caption text-success mt-1">
                    {s.scansToday ?? 0} scans today
                  </p>
                )}
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="mt-3 flex gap-2">
              {s.status !== "invited" && (
                <button
                  onClick={() => toggleSuspend(s.id, s.status)}
                  disabled={updateStatus.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-body-sm font-semibold text-foreground active:bg-secondary"
                >
                  {s.status === "active" ? (
                    <>
                      <Pause className="w-4 h-4" /> Suspend
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Reactivate
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => doRevoke(s.id, s.name)}
                disabled={revoke.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-destructive/20 text-body-sm font-semibold text-destructive active:bg-destructive/5"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        ))
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Invite Staff</DialogTitle>
            <DialogDescription>
              They'll receive an SMS with a one-tap sign-in link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <LabeledInput
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. Ravi Kumar"
            />
            <LabeledInput
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="+91 98…"
              type="tel"
            />
            <div>
              <label className="text-caption font-semibold text-muted-foreground">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as StaffRole })
                }
                className="w-full h-11 mt-1 rounded-xl border border-border bg-card px-3 text-body-sm"
              >
                {(Object.keys(STAFF_ROLE_LABEL) as StaffRole[]).map((r) => (
                  <option key={r} value={r}>
                    {STAFF_ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-caption font-semibold text-muted-foreground">
                Facility
              </label>
              <select
                value={form.facilityId}
                onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                className="w-full h-11 mt-1 rounded-xl border border-border bg-card px-3 text-body-sm"
              >
                {FACILITIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
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
              className="flex-1"
              onClick={submitInvite}
              loading={invite.isPending}
            >
              Send invite
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerScreenLayout>
  );
};

const StatusBadge = ({ status }: { status: StaffStatus }) => {
  const map: Record<StaffStatus, string> = {
    invited: "bg-warning/10 text-warning",
    active: "bg-success/10 text-success",
    suspended: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
      {STAFF_STATUS_LABEL[status]}
    </span>
  );
};

const LabeledInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="text-caption font-semibold text-muted-foreground">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 mt-1 rounded-xl border border-border bg-card px-3 text-body-sm"
    />
  </div>
);

export default PartnerStaffScreen;
