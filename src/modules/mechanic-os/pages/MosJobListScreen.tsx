// Screen: MOS-02 (list index) · Primitives: Reservation
// Route: /mechanic-os/jobs

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, ChevronRight, Filter } from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import {
  getMechanicShop,
  getShopBookings,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "completed", label: "Completed" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const MosJobListScreen = () => {
  const navigate = useNavigate();
  const shop = getMechanicShop();
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");

  const jobs = useMemo(() => {
    if (!shop) return [];
    let list = getShopBookings(shop.id);
    if (filter === "open") {
      list = list.filter((b) =>
        ["pending", "accepted", "assigned", "in_progress", "on_the_way", "searching"].includes(
          b.status,
        ),
      );
    } else if (filter === "completed") {
      list = list.filter((b) => b.status === "completed");
    }
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (b) =>
          b.customerName.toLowerCase().includes(needle) ||
          b.service.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [shop, filter, q]);

  return (
    <MechanicOsLayout
      title="Digital job cards"
      subtitle="Full inspection checklists, photos, tech notes, parts used"
      actions={
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer or service"
              className="h-10 pl-9 pr-3 rounded-lg bg-secondary text-body-sm w-64"
            />
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-caption font-semibold ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!shop && (
        <div className="p-8 rounded-2xl border border-dashed border-border text-center">
          <p className="text-body-sm text-muted-foreground">
            Set up your shop to see job cards.
          </p>
        </div>
      )}

      {shop && jobs.length === 0 && (
        <div className="p-8 rounded-2xl border border-dashed border-border text-center">
          <ClipboardList className="w-6 h-6 mx-auto text-muted-foreground" />
          <p className="text-body-sm font-semibold text-foreground mt-2">
            No jobs match this filter
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {jobs.map((b) => (
          <JobRow key={b.id} b={b} onOpen={() => navigate(`/mechanic-os/jobs/${b.id}`)} />
        ))}
      </div>
    </MechanicOsLayout>
  );
};

const JobRow = ({
  b,
  onOpen,
}: {
  b: MechanicBooking;
  onOpen: () => void;
}) => (
  <button
    onClick={onOpen}
    className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/50 transition-colors"
  >
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
      <ClipboardList className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-body-sm font-bold text-foreground truncate">
        {b.service}
      </p>
      <p className="text-caption text-muted-foreground truncate">
        {b.customerName} · {new Date(b.date).toLocaleDateString()}
      </p>
    </div>
    <div className="text-right">
      <p className="text-body-sm font-bold text-primary">
        ₹{b.price.toLocaleString("en-IN")}
      </p>
      <p className="text-caption text-muted-foreground capitalize">
        {b.status.replace("_", " ")}
      </p>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </button>
);

export default MosJobListScreen;
