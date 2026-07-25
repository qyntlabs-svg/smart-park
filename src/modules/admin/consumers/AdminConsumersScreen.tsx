// Screen: A-05 · Primitives: Identity
// Route: /admin/consumers

import { useState } from "react";
import {
  Users,
  Search,
  Loader2,
  Ban,
  RefreshCcw,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import {
  useConsumerBookings,
  useConsumerSearch,
  useToggleConsumerSuspension,
} from "./hooks";

const AdminConsumersScreen = () => {
  const [query, setQuery] = useState("");
  const { data: consumers = [], isLoading, isError } = useConsumerSearch(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: bookings = [], isLoading: loadingBookings } =
    useConsumerBookings(selectedId ?? undefined);
  const toggleSuspend = useToggleConsumerSuspension();

  const doSuspend = async (id: string, name: string, suspended?: boolean) => {
    const action = suspended ? "reactivate" : "suspend";
    if (!window.confirm(`${action[0].toUpperCase() + action.slice(1)} ${name}?`))
      return;
    await toggleSuspend.mutateAsync(id);
    toast.success(`Consumer ${suspended ? "reactivated" : "suspended"}`);
  };

  return (
    <AdminLayout
      title="Consumer Directory"
      subtitle="Support lookup by phone / booking id / name"
    >
      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by phone, email, name, or ID"
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-body-sm"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : isError ? (
            <p className="text-body-sm text-destructive py-4">
              Couldn't load consumers
            </p>
          ) : consumers.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-2 rounded-2xl border border-dashed border-border">
              <Users className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-body-sm text-muted-foreground">
                No consumers match your search
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {consumers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-4 rounded-2xl border bg-card transition-colors ${
                    selectedId === c.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-body-sm font-bold text-foreground truncate">
                        {c.name}
                      </p>
                      <p className="text-caption text-muted-foreground truncate flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </p>
                      {c.email && (
                        <p className="text-caption text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {c.email}
                        </p>
                      )}
                      <p className="text-caption text-muted-foreground mt-1">
                        {c.city} · {c.vehiclesCount} vehicles · {c.bookingsCount} bookings
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-body-sm font-bold text-foreground">
                        ₹{c.gmvLifetime.toLocaleString()}
                      </p>
                      <p className="text-caption text-muted-foreground">lifetime</p>
                      {c.suspended && (
                        <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive mt-1 inline-block">
                          Suspended
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 min-h-[300px]">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-body-sm text-muted-foreground">
                Select a consumer to see their bookings
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const c = consumers.find((x) => x.id === selectedId);
                if (!c) return null;
                return (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-heading-sm font-bold text-foreground">
                          {c.name}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {c.phone} · Joined{" "}
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <MobileButton
                        size="sm"
                        variant={c.suspended ? "success" : "destructive"}
                        className="gap-1.5"
                        onClick={() => doSuspend(c.id, c.name, c.suspended)}
                        loading={toggleSuspend.isPending}
                      >
                        {c.suspended ? (
                          <>
                            <RefreshCcw className="w-3.5 h-3.5" /> Reactivate
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </>
                        )}
                      </MobileButton>
                    </div>
                    <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Recent bookings
                    </p>
                    {loadingBookings ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                    ) : bookings.length === 0 ? (
                      <p className="text-body-sm text-muted-foreground text-center py-4">
                        No bookings on record
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {bookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-3 rounded-xl bg-background border border-border"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-body-sm font-bold text-foreground">
                                  {b.ref} · {b.kind}
                                </p>
                                <p className="text-caption text-muted-foreground">
                                  {b.provider}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-body-sm font-bold">
                                  ₹{b.amount.toLocaleString()}
                                </p>
                                <span
                                  className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                                    b.status === "disputed"
                                      ? "bg-destructive/10 text-destructive"
                                      : b.status === "active"
                                        ? "bg-primary/10 text-primary"
                                        : b.status === "completed"
                                          ? "bg-success/10 text-success"
                                          : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(b.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConsumersScreen;
