// Screen: MOS-02 · Primitives: Vehicle, Reservation, Review
// Route: /mechanic-os/jobs/:id

import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  Car,
  User,
  Trash2,
  MessageSquare,
} from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  getMechanicShop,
  getShopBookings,
  updateMechanicBooking,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  note?: string;
}

const DEFAULT_INSPECTION: ChecklistItem[] = [
  { id: "exterior", label: "Exterior · body panels & paint", checked: false },
  { id: "tyres", label: "Tyres · tread depth & pressure", checked: false },
  { id: "brakes", label: "Brakes · pads, discs, fluid", checked: false },
  { id: "engine", label: "Engine · oil, belts, hoses", checked: false },
  { id: "electrical", label: "Electrical · battery, lights, horn", checked: false },
  { id: "cabin", label: "Cabin · AC, wipers, upholstery", checked: false },
  { id: "test_drive", label: "Test drive · steering, gears, alignment", checked: false },
];

const MosDigitalJobCardScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shop = getMechanicShop();
  const [tick, setTick] = useState(0);

  const booking = useMemo(
    () => {
      if (!shop) return null;
      return getShopBookings(shop.id).find((b) => b.id === id) ?? null;
    },
    [shop, id, tick],
  );

  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_INSPECTION);
  const [notes, setNotes] = useState("");
  const [partsUsed, setPartsUsed] = useState<{ id: string; name: string; qty: number }[]>([]);
  const [newPartName, setNewPartName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const completeProgress = Math.round(
    (checklist.filter((c) => c.checked).length / checklist.length) * 100,
  );

  const toggle = (id: string) =>
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    );

  const addPhoto = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhotos((p) => [...p, r.result as string]);
    r.readAsDataURL(f);
  };

  const addPart = () => {
    if (!newPartName.trim()) return;
    setPartsUsed((prev) => [
      ...prev,
      { id: `p_${Date.now()}`, name: newPartName.trim(), qty: 1 },
    ]);
    setNewPartName("");
  };

  const saveComplete = () => {
    if (!booking) return;
    updateMechanicBooking(booking.id, { status: "completed", paid: true });
    toast.success("Job card closed & job completed");
    setTick((t) => t + 1);
    navigate("/mechanic-os/jobs");
  };

  if (!shop) {
    return (
      <MechanicOsLayout title="Digital job card">
        <p className="text-body-sm text-muted-foreground">
          Set up your shop first.
        </p>
      </MechanicOsLayout>
    );
  }

  if (!booking) {
    return (
      <MechanicOsLayout title="Job not found" subtitle="This booking doesn't exist.">
        <button
          onClick={() => navigate("/mechanic-os/jobs")}
          className="text-primary font-semibold text-body-sm"
        >
          ← Back to job list
        </button>
      </MechanicOsLayout>
    );
  }

  return (
    <MechanicOsLayout
      title={`Job card · ${booking.service}`}
      subtitle={`${booking.customerName} · ${booking.vehicleCategory ?? "vehicle"}`}
      actions={
        <div className="flex items-center gap-3">
          <span className="text-body-sm text-muted-foreground">
            {completeProgress}% complete
          </span>
          <MobileButton size="sm" onClick={saveComplete}>
            <CheckCircle2 className="w-4 h-4" /> Close card
          </MobileButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress bar */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Inspection
              checklist
            </p>
            <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${completeProgress}%` }}
              />
            </div>
            <div className="mt-3 space-y-2">
              {checklist.map((c) => (
                <label
                  key={c.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={c.checked}
                    onChange={() => toggle(c.id)}
                    className="mt-1 w-4 h-4 accent-primary"
                  />
                  <span
                    className={`text-body-sm ${c.checked ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {c.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Photos gallery */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Photos ({photos.length})
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-caption font-semibold text-primary"
              >
                Add photo
              </button>
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => addPhoto(e.target.files?.[0])}
              />
            </div>
            {photos.length === 0 ? (
              <p className="text-caption text-muted-foreground mt-2">
                No photos attached yet.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden bg-secondary"
                  >
                    <img src={p} className="w-full h-full object-cover" />
                    <button
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tech notes */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Technician
              notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, additional work recommended, upsell candidates…"
              className="mt-2 w-full min-h-[120px] rounded-xl border border-border bg-background p-3 text-body-sm"
            />
          </div>
        </div>

        {/* Right / meta */}
        <div className="space-y-4">
          <Card title="Customer">
            <p className="text-body font-bold text-foreground">
              {booking.customerName}
            </p>
            <p className="text-caption text-muted-foreground">
              {booking.customerPhone}
            </p>
          </Card>
          <Card title="Vehicle">
            <p className="text-body-sm font-semibold text-foreground flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              {booking.vehicleCategory ?? "Vehicle"}
            </p>
            <p className="text-caption text-muted-foreground mt-1">
              Job created {new Date(booking.date).toLocaleString()}
            </p>
          </Card>
          <Card title="Assigned tech">
            <p className="text-body-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              {booking.workerName ?? "Unassigned"}
            </p>
          </Card>

          <Card title={`Parts used (${partsUsed.length})`}>
            {partsUsed.length === 0 ? (
              <p className="text-caption text-muted-foreground">
                No parts logged.
              </p>
            ) : (
              <div className="space-y-1">
                {partsUsed.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-body-sm"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="font-semibold">×{p.qty}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="e.g. Brake pad set"
                className="flex-1 h-10 rounded-lg bg-secondary px-3 text-body-sm"
              />
              <button
                onClick={addPart}
                className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-body-sm font-semibold"
              >
                Add
              </button>
            </div>
          </Card>

          <Card title="Estimate">
            <p className="text-body-sm text-foreground">
              Base service ₹{booking.price.toLocaleString("en-IN")}
            </p>
            {booking.priceBreakdown && (
              <p className="text-caption text-muted-foreground mt-1">
                Labour ₹{booking.priceBreakdown.labour} · Travel ₹
                {booking.priceBreakdown.travel} · Service ₹
                {booking.priceBreakdown.service}
              </p>
            )}
          </Card>
        </div>
      </div>
    </MechanicOsLayout>
  );
};

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-4 rounded-2xl bg-card border border-border">
    <p className="text-caption text-muted-foreground">{title}</p>
    <div className="mt-1">{children}</div>
  </div>
);

export default MosDigitalJobCardScreen;
