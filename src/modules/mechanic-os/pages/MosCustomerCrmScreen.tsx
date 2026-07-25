// Screen: MOS-03 · Primitives: Vehicle, Identity, Review
// Route: /mechanic-os/customers

import { useMemo, useState } from "react";
import { Users, Search, Phone, Car, Clock, ChevronRight } from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import {
  getMechanicShop,
  getShopBookings,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";

interface CustomerRow {
  phone: string;
  name: string;
  vehicles: string[];
  visits: number;
  lastVisitISO: string;
  lifetimeSpend: number;
  bookings: MechanicBooking[];
}

const MosCustomerCrmScreen = () => {
  const shop = getMechanicShop();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const customers = useMemo<CustomerRow[]>(() => {
    if (!shop) return [];
    const bookings = getShopBookings(shop.id);
    const map = new Map<string, CustomerRow>();
    for (const b of bookings) {
      const key = b.customerPhone;
      const cur = map.get(key) ?? {
        phone: key,
        name: b.customerName,
        vehicles: [],
        visits: 0,
        lastVisitISO: b.date,
        lifetimeSpend: 0,
        bookings: [],
      };
      cur.visits += 1;
      cur.lifetimeSpend += b.price || 0;
      if (new Date(b.date).getTime() > new Date(cur.lastVisitISO).getTime()) {
        cur.lastVisitISO = b.date;
      }
      const vehicleLabel =
        b.vehicleCategory ??
        (b.service.match(/\b(car|bike|scooter|ev|auto)\b/i)?.[0] || "Vehicle");
      if (!cur.vehicles.includes(vehicleLabel)) cur.vehicles.push(vehicleLabel);
      cur.bookings.unshift(b);
      map.set(key, cur);
    }
    let list = Array.from(map.values());
    if (q.trim()) {
      const n = q.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(n) || c.phone.includes(n),
      );
    }
    return list.sort(
      (a, b) => new Date(b.lastVisitISO).getTime() - new Date(a.lastVisitISO).getTime(),
    );
  }, [shop, q]);

  return (
    <MechanicOsLayout
      title="Customer CRM"
      subtitle="Every car this shop has serviced — with owner contact & history"
      actions={
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone"
            className="h-10 pl-9 pr-3 rounded-lg bg-secondary text-body-sm w-72"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="hidden md:flex px-4 py-2 border-b border-border text-caption text-muted-foreground">
            <span className="w-1/3">Customer</span>
            <span className="w-1/4">Vehicles</span>
            <span className="w-1/6">Visits</span>
            <span className="w-1/4 text-right">Last visit</span>
          </div>
          {customers.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-body-sm text-muted-foreground mt-2">
                No customers yet.
              </p>
            </div>
          )}
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {customers.map((c) => (
              <button
                key={c.phone}
                onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 ${
                  selected?.phone === c.phone ? "bg-secondary/70" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-body-sm font-bold text-primary">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 md:w-1/3">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {c.name}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {c.phone}
                  </p>
                </div>
                <div className="hidden md:block md:w-1/4 text-body-sm text-foreground truncate">
                  {c.vehicles.join(", ")}
                </div>
                <div className="hidden md:block md:w-1/6 text-body-sm text-foreground">
                  {c.visits}
                </div>
                <div className="hidden md:block md:w-1/4 text-body-sm text-muted-foreground text-right">
                  {new Date(c.lastVisitISO).toLocaleDateString()}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-3">
          {!selected ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center">
              <Users className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-body-sm text-muted-foreground mt-2">
                Select a customer to view history.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-card border border-border">
                <p className="text-body font-bold text-foreground">
                  {selected.name}
                </p>
                <p className="text-caption text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {selected.phone}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <MiniStat label="Visits" value={String(selected.visits)} />
                  <MiniStat
                    label="Lifetime"
                    value={`₹${selected.lifetimeSpend.toLocaleString("en-IN")}`}
                  />
                  <MiniStat
                    label="Last visit"
                    value={new Date(selected.lastVisitISO).toLocaleDateString()}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {selected.vehicles.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded-md bg-secondary text-caption font-semibold text-foreground flex items-center gap-1"
                    >
                      <Car className="w-3 h-3" /> {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border">
                <p className="text-body-sm font-bold text-foreground">
                  Service history
                </p>
                <div className="mt-2 space-y-2">
                  {selected.bookings.map((b) => (
                    <div key={b.id} className="p-2.5 rounded-lg bg-secondary">
                      <p className="text-body-sm font-semibold text-foreground">
                        {b.service}
                      </p>
                      <p className="text-caption text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(b.date).toLocaleDateString()} · ₹{b.price} ·{" "}
                        <span className="capitalize">{b.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MechanicOsLayout>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2 rounded-lg bg-secondary text-center">
    <p className="text-body-sm font-bold text-foreground">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

export default MosCustomerCrmScreen;
