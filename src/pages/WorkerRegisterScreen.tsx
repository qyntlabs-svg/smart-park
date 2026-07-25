import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Upload, CheckCircle2, FileText } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import {
  addWorker,
  getInvite,
  pushNotification,
  setWorkerAuth,
  type MechanicWorker,
} from "@/lib/mechanic";
import { toast } from "sonner";

const fileToDataUrl = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

// Downscale large images so we don't blow past localStorage quota.
const compressImage = (dataUrl: string, maxDim = 1280, quality = 0.7) =>
  new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const WorkerRegisterScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const invite = token ? getInvite(token) : null;

  const [stage, setStage] = useState<"phone" | "otp" | "form">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const [pan, setPan] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);

  useEffect(() => {
    if (!invite) return;
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      toast.error("This invite link has expired");
    }
  }, [invite]);

  if (!invite) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-body text-muted-foreground">Invalid or expired invite link.</p>
        </div>
      </div>
    );
  }

  const sendOtp = () => {
    if (!/^\+?\d{10,13}$/.test(phone.replace(/\s/g, ""))) {
      return toast.error("Enter a valid mobile number");
    }
    toast.success("OTP sent (mock): use 123456");
    setStage("otp");
  };
  const verifyOtp = () => {
    if (otp.length !== 6) return toast.error("Enter 6-digit OTP");
    setStage("form");
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, set: (v: string) => void) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast.error("File too large (max 20 MB)");
    try {
      const raw = await fileToDataUrl(f);
      const out = f.type.startsWith("image/") ? await compressImage(raw) : raw;
      set(out);
      toast.success("Uploaded");
    } catch {
      toast.error("Could not read file");
    }
  };
  const onPickExtras = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = await Promise.all(
      files.map(async (f) => {
        const raw = await fileToDataUrl(f);
        return f.type.startsWith("image/") ? await compressImage(raw) : raw;
      }),
    );
    setExtras((prev) => [...prev, ...urls].slice(0, 5));
  };

  const submit = () => {
    if (!name.trim()) return toast.error("Enter your name");
    if (!aadhaar) return toast.error("Upload Aadhaar card");
    if (!pan) return toast.error("Upload PAN card");

    // Mock geolocation near the shop
    const lat = 12.92 + Math.random() * 0.1;
    const lng = 80.1 + Math.random() * 0.1;

    const worker: MechanicWorker = {
      id: `wk_${Date.now()}`,
      shopId: invite.shopId,
      shopName: invite.shopName,
      name: name.trim(),
      phone: phone.trim(),
      aadhaarUrl: aadhaar,
      panUrl: pan,
      extraDocs: extras,
      status: "pending",
      createdAt: new Date().toISOString(),
      lat,
      lng,
    };
    try {
      addWorker(worker);
      setWorkerAuth({ workerId: worker.id });
      pushNotification({
        audience: "owner",
        audienceId: invite.shopId,
        title: "New worker application",
        body: `${worker.name} has applied to join your shop.`,
      });
      toast.success("Submitted — awaiting owner approval");
      navigate("/worker/pending", { replace: true });
    } catch (err) {
      console.error("Worker submit failed", err);
      toast.error("Could not save — try smaller document images");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="px-5 pt-safe pb-4 bg-card border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-body font-bold text-foreground">Join {invite.shopName}</p>
          <p className="text-caption text-muted-foreground">Worker registration</p>
        </div>
      </header>

      <div className="flex-1 p-5 space-y-5">
        {stage === "phone" && (
          <div className="space-y-3">
            <p className="text-body-sm text-foreground">Enter your mobile number</p>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 12345"
              type="tel"
              className="h-12 rounded-xl"
            />
            <MobileButton fullWidth onClick={sendOtp}>Send OTP</MobileButton>
          </div>
        )}
        {stage === "otp" && (
          <div className="space-y-3">
            <p className="text-body-sm text-foreground">Enter 6-digit OTP</p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              className="h-12 rounded-xl tracking-widest text-center text-heading-sm"
            />
            <MobileButton fullWidth onClick={verifyOtp}>Verify</MobileButton>
          </div>
        )}
        {stage === "form" && (
          <div className="space-y-4">
            <div>
              <p className="text-body-sm font-semibold text-foreground mb-1">Full name</p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 rounded-xl"
              />
            </div>

            <UploadCard
              title="Aadhaar card"
              value={aadhaar}
              onPick={(e) => onPick(e, setAadhaar)}
              onClear={() => setAadhaar(null)}
            />
            <UploadCard
              title="PAN card"
              value={pan}
              onPick={(e) => onPick(e, setPan)}
              onClear={() => setPan(null)}
            />

            <div className="p-4 rounded-xl border border-dashed border-border">
              <p className="text-body-sm font-semibold text-foreground">Additional documents (optional)</p>
              <p className="text-caption text-muted-foreground mb-2">Driving licence, certificates, etc.</p>
              <input type="file" multiple accept="image/*,application/pdf" onChange={onPickExtras} className="text-caption" />
              {extras.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {extras.map((_, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-secondary text-caption flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Doc {i + 1}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <motion.div whileTap={{ scale: 0.99 }}>
              <MobileButton fullWidth onClick={submit}>Submit application</MobileButton>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

const UploadCard = ({
  title,
  value,
  onPick,
  onClear,
}: {
  title: string;
  value: string | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) => (
  <div className="p-4 rounded-xl border border-border bg-card">
    <p className="text-body-sm font-semibold text-foreground">{title}</p>
    {value ? (
      <div className="mt-2 space-y-2">
        <img src={value} alt={title} className="w-full max-h-40 object-contain rounded-lg bg-secondary" />
        <button onClick={onClear} className="text-caption text-destructive font-semibold">Remove</button>
      </div>
    ) : (
      <label className="mt-2 flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary text-body-sm text-foreground font-semibold cursor-pointer">
        <Upload className="w-4 h-4" /> Upload image
        <input type="file" accept="image/*" onChange={onPick} className="hidden" />
      </label>
    )}
    {value && <p className="text-caption text-success flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</p>}
  </div>
);

export default WorkerRegisterScreen;