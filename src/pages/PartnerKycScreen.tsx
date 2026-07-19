import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Car,
  Bike,
  Building2,
  Sun,
  FileText,
  CheckCircle2,
  Loader2,
  Upload,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import LocationPicker from "@/components/LocationPicker";

type DocStatus = "pending" | "uploading" | "uploaded";

const PartnerKycScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [docs, setDocs] = useState<Record<string, DocStatus>>({
    govId: "pending",
    businessProof: "pending",
    ownershipProof: "pending",
  });
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(13.002);
  const [longitude, setLongitude] = useState(80.21);
  const [parkingType, setParkingType] = useState<"open" | "covered" | "">("");
  const [vehicleType, setVehicleType] = useState<("car" | "bike")[]>([]);
  const [photos, setPhotos] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [submitting, setSubmitting] = useState(false);

  const mockUpload = (key: string, file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }
    setDocs((prev) => ({ ...prev, [key]: "uploading" }));
    setTimeout(() => {
      setDocs((prev) => ({ ...prev, [key]: "uploaded" }));
      toast.success("Document uploaded");
    }, 500);
  };

  const handleFileSelect = (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    mockUpload(key, file);
  };

  const toggleVehicle = (v: "car" | "bike") =>
    setVehicleType((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  const canProceed = () => {
    if (step === 1) {
      const allUploaded = Object.values(docs).every((d) => d === "uploaded");
      return allUploaded && businessName.trim().length > 0;
    }
    if (step === 2) return address.length > 5;
    if (step === 3) return !!parkingType && vehicleType.length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      localStorage.setItem(
        "partner-kyc",
        JSON.stringify({ businessName, address, latitude, longitude, parkingType, vehicleType }),
      );
      toast.success("KYC submitted for review!");
      navigate("/partner/pending", { replace: true });
    }, 400);
  };

  const docItems = [
    {
      key: "govId",
      label: "Government ID",
      desc: "Aadhaar / Passport / License",
    },
    {
      key: "businessProof",
      label: "Business Proof",
      desc: "GST / Trade license (if applicable)",
    },
    {
      key: "ownershipProof",
      label: "Parking Authorization",
      desc: "Ownership / lease document",
    },
  ];

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          KYC Verification
        </h1>
      </header>

      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          Step {step} of 4
        </p>
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        {/* Step 1: Documents */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-heading-sm text-foreground">
              Upload Documents
            </h2>
            <p className="text-body-sm text-muted-foreground">
              Tap each document to mark as uploaded
            </p>
            <div className="mt-2">
              <p className="text-body-sm font-semibold text-foreground mb-1">
                Business Name
              </p>
              <Input
                placeholder="e.g. City Center Parking"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="mt-4 space-y-3">
              {docItems.map((doc) => (
                <button
                  key={doc.key}
                  onClick={() => fileInputRefs.current[doc.key]?.click()}
                  disabled={docs[doc.key] === "uploading"}
                  className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left"
                >
                  <input
                    ref={(el) => {
                      fileInputRefs.current[doc.key] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(doc.key, e)}
                  />
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${docs[doc.key] === "uploaded" ? "bg-success/10" : "bg-secondary"}`}
                  >
                    {docs[doc.key] === "uploading" ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : docs[doc.key] === "uploaded" ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-bold text-foreground">
                      {doc.label}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {doc.desc}
                    </p>
                  </div>
                  {docs[doc.key] === "pending" && (
                    <span className="text-caption text-primary font-semibold flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </span>
                  )}
                  {docs[doc.key] === "uploaded" && (
                    <span className="text-caption text-success font-semibold">
                      Done
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-heading-sm text-foreground">
              Parking Location
            </h2>
            <p className="text-body-sm text-muted-foreground">
              Tap the map to pin your exact parking location
            </p>
            <LocationPicker
              lat={latitude}
              lng={longitude}
              address={address}
              onChange={(lat, lng, addr) => {
                setLatitude(lat);
                setLongitude(lng);
                setAddress(addr);
              }}
            />
            <div>
              <p className="text-body-sm font-semibold text-foreground mb-2">
                Parking Photos
              </p>
              <div className="flex gap-3">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setPhotos(Math.max(photos, i + 1))}
                    className={`flex-1 aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center ${i < photos ? "border-success bg-success/5" : "border-border bg-secondary"}`}
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

        {/* Step 3: Type */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-heading-sm text-foreground">Parking Type</h2>
            <div className="mt-4">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Structure
              </p>
              <div className="flex gap-3">
                {[
                  { key: "open" as const, label: "Open", icon: Sun },
                  {
                    key: "covered" as const,
                    label: "Covered",
                    icon: Building2,
                  },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setParkingType(key)}
                    className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${parkingType === key ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <Icon
                      className={`w-8 h-8 ${parkingType === key ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-body-sm font-semibold ${parkingType === key ? "text-primary" : "text-foreground"}`}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Vehicle Types Accepted
              </p>
              <div className="flex gap-3">
                {[
                  { key: "car" as const, label: "Car", icon: Car },
                  { key: "bike" as const, label: "Bike", icon: Bike },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleVehicle(key)}
                    className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${vehicleType.includes(key) ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <Icon
                      className={`w-8 h-8 ${vehicleType.includes(key) ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-body-sm font-semibold ${vehicleType.includes(key) ? "text-primary" : "text-foreground"}`}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-heading-sm text-foreground">Review & Submit</h2>
            <p className="text-body-sm text-muted-foreground">
              Confirm your details before submitting for admin review
            </p>
            <div className="mt-4 space-y-3">
              {[
                [
                  "Documents",
                  `${Object.values(docs).filter((d) => d === "uploaded").length}/3 uploaded`,
                ],
                ["Address", address || "—"],
                ["Photos", `${photos} uploaded`],
                ["Parking Type", parkingType || "—"],
                [
                  "Accepts",
                  vehicleType
                    .map((v) => (v === "car" ? "Cars" : "Bikes"))
                    .join(", ") || "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl"
                >
                  <span className="text-body-sm text-muted-foreground">
                    {label}
                  </span>
                  <span className="text-body-sm font-semibold text-foreground capitalize">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8 pb-safe">
        <MobileButton
          fullWidth
          onClick={handleNext}
          disabled={!canProceed()}
          loading={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
            </>
          ) : step < 4 ? (
            "Continue"
          ) : (
            "Submit for Approval"
          )}
        </MobileButton>
      </div>
    </div>
  );
};

export default PartnerKycScreen;
