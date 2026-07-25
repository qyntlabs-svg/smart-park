// Screen: MOS-04 · Primitives: (custom Inventory domain)
// Route: /mechanic-os/inventory

import { useMemo, useState } from "react";
import { AlertCircle, Boxes, ExternalLink, Minus, Plus } from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import {
  listInventory,
  updateInventoryPart,
  type InventoryPart,
} from "@/modules/mechanic-os/lib/mos-store";
import { toast } from "sonner";

const MosInventoryScreen = () => {
  const [items, setItems] = useState<InventoryPart[]>(listInventory());
  const [q, setQ] = useState("");

  const { rows, low, outOfStock, value } = useMemo(() => {
    const rows = items.filter(
      (p) =>
        !q.trim() ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.sku.toLowerCase().includes(q.toLowerCase()) ||
        p.category.toLowerCase().includes(q.toLowerCase()),
    );
    const low = items.filter((p) => p.stock > 0 && p.stock <= p.reorderAt).length;
    const outOfStock = items.filter((p) => p.stock === 0).length;
    const value = items.reduce((s, p) => s + p.stock * p.costPerUnit, 0);
    return { rows, low, outOfStock, value };
  }, [items, q]);

  const adjust = (id: string, delta: number) => {
    const cur = items.find((p) => p.id === id);
    if (!cur) return;
    const next = updateInventoryPart(id, {
      stock: Math.max(0, cur.stock + delta),
    });
    if (next) {
      setItems(listInventory());
      if (delta < 0) toast.message(`Used 1 × ${next.name}`);
      else toast.success(`Restocked ${next.name}`);
    }
  };

  return (
    <MechanicOsLayout
      title="Parts & inventory"
      subtitle="Stock levels, reorder alerts, supplier links"
      actions={
        <div className="hidden md:block">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU, name, category"
            className="h-10 px-3 rounded-lg bg-secondary text-body-sm w-72"
          />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi label="SKUs" value={String(items.length)} />
        <Kpi label="Below reorder" value={String(low)} tone="warning" />
        <Kpi label="Out of stock" value={String(outOfStock)} tone="destructive" />
        <Kpi
          label="Stock value"
          value={`₹${value.toLocaleString("en-IN")}`}
          tone="primary"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-caption text-muted-foreground">
          <span className="col-span-4">Part</span>
          <span className="col-span-2">SKU</span>
          <span className="col-span-2">Supplier</span>
          <span className="col-span-2 text-right">Stock</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>
        {rows.length === 0 && (
          <div className="p-8 text-center">
            <Boxes className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-body-sm text-muted-foreground mt-2">
              No inventory items match.
            </p>
          </div>
        )}
        <div className="divide-y divide-border">
          {rows.map((p) => {
            const critical = p.stock === 0;
            const low = p.stock > 0 && p.stock <= p.reorderAt;
            return (
              <div
                key={p.id}
                className="grid grid-cols-2 md:grid-cols-12 gap-2 px-4 py-3 items-center"
              >
                <div className="col-span-2 md:col-span-4">
                  <p className="text-body-sm font-semibold text-foreground">
                    {p.name}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {p.category} · ₹{p.costPerUnit.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="md:col-span-2 text-caption text-muted-foreground font-mono">
                  {p.sku}
                </div>
                <div className="md:col-span-2 text-body-sm text-foreground flex items-center gap-1">
                  {p.supplier}
                  {p.supplierUrl && (
                    <a
                      href={p.supplierUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary"
                      aria-label={`${p.supplier} website`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="md:col-span-2 md:text-right">
                  <p
                    className={`text-body-sm font-bold ${
                      critical
                        ? "text-destructive"
                        : low
                          ? "text-warning"
                          : "text-foreground"
                    }`}
                  >
                    {p.stock}
                  </p>
                  {(critical || low) && (
                    <p className="text-caption text-muted-foreground flex items-center gap-1 md:justify-end">
                      <AlertCircle className="w-3 h-3" /> reorder at {p.reorderAt}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 flex items-center gap-1 md:justify-end">
                  <button
                    onClick={() => adjust(p.id, -1)}
                    disabled={p.stock === 0}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center disabled:opacity-40"
                    aria-label={`Decrement ${p.name}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => adjust(p.id, 1)}
                    className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                    aria-label={`Restock ${p.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
  tone?: "warning" | "destructive" | "primary";
}) => {
  const toneCls =
    tone === "warning"
      ? "text-warning"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";
  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${toneCls}`}>{value}</p>
    </div>
  );
};

export default MosInventoryScreen;
