// Screen: MOS-08 · Primitives: Provider, Payment, Reservation
// Route: /mechanic-os/rollup

import { useMemo } from "react";
import { Building2, MapPin, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import {
  getPublicShops,
  getShopBookings,
  type MechanicShop,
} from "@/modules/mechanic/lib/shops";

const MosMultiShopRollupScreen = () => {
  const shops = getPublicShops();

  const rows = useMemo(
    () =>
      shops.map((s) => {
        const bookings = getShopBookings(s.id);
        const completed = bookings.filter((b) => b.status === "completed");
        const revenue = completed.reduce((sum, b) => sum + (b.price || 0), 0);
        return {
          shop: s,
          jobs: completed.length,
          revenue,
          rating: s.rating,
          open: s.open,
          openBookings: bookings.filter((b) =>
            ["pending", "assigned", "accepted", "in_progress"].includes(b.status),
          ).length,
        };
      }),
    [shops],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          jobs: acc.jobs + r.jobs,
          revenue: acc.revenue + r.revenue,
          open: acc.open + r.openBookings,
        }),
        { jobs: 0, revenue: 0, open: 0 },
      ),
    [rows],
  );

  const chart = rows.map((r) => ({
    name: r.shop.shopName.slice(0, 14),
    revenue: r.revenue,
  }));

  return (
    <MechanicOsLayout
      title="Multi-shop rollup"
      subtitle="Chain owner view — all shops in one place"
    >
      {shops.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Shops" value={String(shops.length)} icon={Building2} />
            <Kpi label="Jobs (all-time)" value={String(totals.jobs)} icon={TrendingUp} />
            <Kpi
              label="Revenue"
              value={`₹${totals.revenue.toLocaleString("en-IN")}`}
              icon={TrendingUp}
            />
            <Kpi label="Open now" value={String(totals.open)} icon={Building2} />
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-body-sm font-bold text-foreground mb-3">
              Revenue by shop
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(59,130,246,0.08)" }}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-caption text-muted-foreground">
              <span className="col-span-4">Shop</span>
              <span className="col-span-3">Location</span>
              <span className="col-span-2 text-right">Jobs</span>
              <span className="col-span-2 text-right">Revenue</span>
              <span className="col-span-1 text-right">Status</span>
            </div>
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <ShopRow
                  key={r.shop.id}
                  shop={r.shop}
                  jobs={r.jobs}
                  revenue={r.revenue}
                  open={r.open}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </MechanicOsLayout>
  );
};

const ShopRow = ({
  shop,
  jobs,
  revenue,
  open,
}: {
  shop: MechanicShop;
  jobs: number;
  revenue: number;
  open: boolean;
}) => (
  <div className="grid grid-cols-2 md:grid-cols-12 gap-2 px-4 py-3 items-center">
    <div className="col-span-2 md:col-span-4">
      <p className="text-body-sm font-bold text-foreground truncate">
        {shop.shopName}
      </p>
      <p className="text-caption text-muted-foreground">{shop.ownerName}</p>
    </div>
    <div className="md:col-span-3 text-caption text-muted-foreground flex items-center gap-1">
      <MapPin className="w-3 h-3" /> {shop.address}
    </div>
    <div className="md:col-span-2 md:text-right text-body-sm font-semibold text-foreground">
      {jobs}
    </div>
    <div className="md:col-span-2 md:text-right text-body-sm font-bold text-primary">
      ₹{revenue.toLocaleString("en-IN")}
    </div>
    <div className="md:col-span-1 md:text-right">
      <span
        className={`px-2 py-0.5 rounded-md text-caption font-semibold ${
          open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        {open ? "Open" : "Closed"}
      </span>
    </div>
  </div>
);

const Kpi = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
}) => (
  <div className="p-4 rounded-2xl bg-card border border-border">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-caption">{label}</span>
    </div>
    <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
  </div>
);

const EmptyState = () => (
  <div className="p-8 rounded-2xl border border-dashed border-border text-center">
    <Building2 className="w-6 h-6 mx-auto text-muted-foreground" />
    <p className="text-body-sm text-muted-foreground mt-2">
      No shops enrolled yet.
    </p>
  </div>
);

export default MosMultiShopRollupScreen;
