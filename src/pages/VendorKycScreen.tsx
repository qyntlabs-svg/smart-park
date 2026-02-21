import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Upload, MapPin, Camera, Car, Bike, Building2,
  Sun, ChevronRight, FileText, CheckCircle2
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";

type DocStatus = "pending" | "uploaded";

const VendorKycScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=docs, 2=parking, 3=type, 4=review
  const [docs, setDocs] = useState<Record<string, DocStatus>>({
    govId: "pending",
    businessProof: "pending",
    ownershipProof: "pending",
  });
  const [address, setAddress] = useState("");
  const [parkingType, setParkingType] = useState<"open" | "covered" | "">("");
  const [vehicleType, setVehicleType] = useState<("car" | "bike")[]>([]);
  const [photos, setPhotos] = useState(0);

  const mockUpload = (key: string) => {
    setDocs((prev) => ({ ...prev, [key]: "uploaded" }));
  };

  const toggleVehicle = (v: "car" | "bike") => {
    setVehicleType((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const canProceed = () => {
    if (step === 1) return Object.values(docs).every((d) => d === "uploaded");
    if (step === 2) return address.length > 5 && photos > 0;
    if (step === 3) return parkingType && vehicleType.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      navigate("/vendor/pending", { replace: true });
    }
  };

  const docItems = [
    { key: "govId", label: "Government ID", desc: "Aadhaar / Passport / License" },
    { key: "businessProof", label: "Business Proof", desc: "GST / Trade license (if applicable)" },
    { key: "ownershipProof", label: "Parking Authorization", desc: "Ownership / lease document" },
  ];

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">KYC Verification</h1>
      </header>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-caption text-muted-foreground">Step {step} of 4</p>
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        {/* Step 1: Documents */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-heading-sm text-foreground">Upload Documents</h2>
            <p className="text-body-sm text-muted-foreground">Submit mandatory verification documents</p>
            <div className="mt-4 space-y-3">
              {docItems.map((doc) => (
                <button
                  key={doc.key}
                  onClick={() => mockUpload(doc.key)}
                  className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    docs[doc.key] === "uploaded" ? "bg-success/10" : "bg-secondary"
                  }`}>
                    {docs[doc.key] === "uploaded" ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-bold text-foreground">{doc.label}</p>
                    <p className="text-caption text-muted-foreground">{doc.desc}</p>
                  </div>
                  {docs[doc.key] === "pending" && (
                    <Upload className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Parking Location */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-heading-sm text-foreground">Parking Location</h2>
            <p className="text-body-sm text-muted-foreground">Provide your parking facility address</p>

            <div className="relative mt-4">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Full parking address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-12 h-14 rounded-xl text-body"
              />
            </div>

            {/* Mock GPS pin */}
            <button className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-bold text-foreground">Pin on Map</p>
                <p className="text-caption text-muted-foreground">Tap to set GPS location</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Photos */}
            <div>
              <p className="text-body-sm font-semibold text-foreground mb-2">Parking Photos</p>
              <div className="flex gap-3">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setPhotos(Math.max(photos, i + 1))}
                    className={`flex-1 aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center ${
                      i < photos
                        ? "border-success bg-success/5"
                        : "border-border bg-secondary"
                    }`}
                  >
                    {i < photos ? (
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground/40" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Parking Type */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-heading-sm text-foreground">Parking Type</h2>
            <p className="text-body-sm text-muted-foreground">Select your parking configuration</p>

            <div className="mt-4">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Structure</p>
              <div className="flex gap-3">
                {[
                  { key: "open" as const, label: "Open", icon: Sun },
                  { key: "covered" as const, label: "Covered", icon: Building2 },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setParkingType(key)}
                    className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      parkingType === key
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${parkingType === key ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-body-sm font-semibold ${parkingType === key ? "text-primary" : "text-foreground"}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vehicle Types</p>
              <div className="flex gap-3">
                {[
                  { key: "car" as const, label: "Car", icon: Car },
                  { key: "bike" as const, label: "Bike", icon: Bike },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleVehicle(key)}
                    className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      vehicleType.includes(key)
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${vehicleType.includes(key) ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-body-sm font-semibold ${vehicleType.includes(key) ? "text-primary" : "text-foreground"}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-heading-sm text-foreground">Review & Submit</h2>
            <p className="text-body-sm text-muted-foreground">Confirm your details before submitting</p>

            <div className="mt-4 space-y-3">
              {[
                ["Documents", `${Object.values(docs).filter((d) => d === "uploaded").length}/3 uploaded`],
                ["Address", address || "—"],
                ["Photos", `${photos} uploaded`],
                ["Type", parkingType || "—"],
                ["Vehicles", vehicleType.join(", ") || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
                  <span className="text-body-sm text-muted-foreground">{label}</span>
                  <span className="text-body-sm font-semibold text-foreground capitalize">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8 pb-safe">
        <MobileButton fullWidth onClick={handleNext} disabled={!canProceed()}>
          {step < 4 ? "Continue" : "Submit for Approval"}
        </MobileButton>
      </div>
    </div>
  );
};

export default VendorKycScreen;
