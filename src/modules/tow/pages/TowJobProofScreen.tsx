// Screen: T-04 · Primitives: Reservation, Review, Vehicle
// Route: /tow/jobs/:id/proof

import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Trash2, CheckCircle2, ArrowRight, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import TowLayout from "@/modules/tow/components/TowLayout";
import { useSosRequest, useUpdateSosRequest } from "@/shared/lib/sos-hooks";
import {
  defaultTowFare,
  getCurrentOperator,
  recordEarning,
} from "@/modules/tow/lib/tow";
import { SOS_SITUATION_LABEL } from "@/shared/lib/sos-store";

const TowJobProofScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: req, isLoading } = useSosRequest(id);
  const update = useUpdateSosRequest();
  const op = getCurrentOperator();

  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [cost, setCost] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const defaultFare = useMemo(
    () => (req ? defaultTowFare(req.situation) : 0),
    [req],
  );

  useEffect(() => {
    if (!cost && defaultFare) setCost(String(defaultFare));
  }, [defaultFare, cost]);

  const fileRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLCanvasElement>(null);

  const addPhoto = async (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPhotos((prev) => [...prev, url]);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  // --- signature pad ---
  const drawing = useRef(false);
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = sigRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    ctx.beginPath();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const rect = c.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = sigRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = sigRef.current;
    if (!c) return;
    setSignature(c.toDataURL("image/png"));
  };
  const clearSig = () => {
    const c = sigRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setSignature("");
  };

  const submit = () => {
    if (!req || !op) return;
    if (photos.length === 0) return toast.error("Add at least one photo");
    if (!signature) return toast.error("Get the customer's signature");
    if (!waiverAccepted) return toast.error("Confirm damage waiver");
    setSaving(true);
    const finalCost = Number(cost) || defaultFare;
    update.mutate(
      {
        id: req.id,
        patch: {
          status: "completed",
          proof: {
            photos,
            signature,
            mileage: mileage ? Number(mileage) : undefined,
            notes,
          },
          cost: finalCost,
        },
      },
      {
        onSuccess: () => {
          recordEarning({
            operatorId: op.id,
            sosRequestId: req.id,
            amount: finalCost,
            serviceLabel: SOS_SITUATION_LABEL[req.situation],
            completedAt: new Date().toISOString(),
          });
          toast.success("Job completed & customer notified");
          navigate("/tow/earnings", { replace: true });
        },
        onError: () => {
          setSaving(false);
          toast.error("Could not save proof");
        },
      },
    );
  };

  if (isLoading || !req) {
    return (
      <TowLayout title="Proof" showBack showNav={false}>
        <div className="p-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      </TowLayout>
    );
  }

  return (
    <TowLayout title="Proof of service" showBack showNav={false}>
      <div className="px-5 py-4 space-y-5">
        {/* Photos */}
        <section>
          <p className="text-body-sm font-bold text-foreground">Photos ({photos.length})</p>
          <p className="text-caption text-muted-foreground">
            Capture before/after shots. At least 1 required.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden bg-secondary"
              >
                <img
                  src={p}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              <Camera className="w-5 h-5" />
              <span className="text-caption">Add</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => addPhoto(e.target.files?.[0])}
            />
          </div>
        </section>

        {/* Mileage + notes */}
        <section className="space-y-3">
          <label className="block">
            <span className="text-caption text-muted-foreground">
              Odometer reading (km)
            </span>
            <Input
              value={mileage}
              onChange={(e) =>
                setMileage(e.target.value.replace(/\D/g, "").slice(0, 7))
              }
              placeholder="e.g. 42315"
              inputMode="numeric"
              className="mt-1 h-12 rounded-xl"
            />
          </label>
          <label className="block">
            <span className="text-caption text-muted-foreground">
              Service notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vehicle towed 6 km to Selaiyur service centre."
              className="mt-1 w-full min-h-[80px] rounded-xl bg-card border border-border p-3 text-body-sm"
            />
          </label>
          <label className="block">
            <span className="text-caption text-muted-foreground">Fare (₹)</span>
            <Input
              value={cost}
              onChange={(e) =>
                setCost(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={String(defaultFare)}
              inputMode="numeric"
              className="mt-1 h-12 rounded-xl"
            />
          </label>
        </section>

        {/* Signature */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <p className="text-body-sm font-bold text-foreground flex items-center gap-1">
              <PenLine className="w-4 h-4" /> Customer signature
            </p>
            <button
              onClick={clearSig}
              className="text-caption text-primary font-semibold"
            >
              Clear
            </button>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-secondary">
            <canvas
              ref={sigRef}
              width={340}
              height={140}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="w-full h-[140px] touch-none"
            />
          </div>
        </section>

        {/* Damage waiver */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
          <input
            type="checkbox"
            checked={waiverAccepted}
            onChange={(e) => setWaiverAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 accent-primary"
          />
          <span className="text-caption text-foreground">
            I confirm the vehicle was inspected before towing and any
            pre-existing damage was documented via the photos above. Customer
            accepts standard SmartPark damage waiver.
          </span>
        </label>

        <MobileButton fullWidth loading={saving} onClick={submit}>
          <CheckCircle2 className="w-4 h-4" /> Submit proof & complete
          <ArrowRight className="w-4 h-4" />
        </MobileButton>
      </div>
    </TowLayout>
  );
};

export default TowJobProofScreen;
