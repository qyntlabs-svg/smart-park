import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle2, Loader2, Upload } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { getMechanicAuth, setMechanicAuth } from "@/lib/mechanic";
import { toast } from "sonner";

type DocStatus = "pending" | "uploading" | "uploaded";

const DOCS = [
  { key: "govId", label: "Government ID", desc: "Aadhaar / Passport / License" },
  { key: "addressProof", label: "Address Proof", desc: "Utility bill / rental agreement" },
  { key: "shopProof", label: "Shop Ownership / Trade License", desc: "GST / Trade license / Lease" },
  { key: "selfie", label: "Selfie with ID", desc: "Hold your ID next to your face" },
] as const;

const MechanicKycScreen = () => {
  const navigate = useNavigate();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [docs, setDocs] = useState<Record<string, DocStatus>>({
    govId: "pending",
    addressProof: "pending",
    shopProof: "pending",
    selfie: "pending",
  });

  const allUploaded = Object.values(docs).every((d) => d === "uploaded");

  const handleFile = (key: string, file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File must be under 5MB");
    setDocs((p) => ({ ...p, [key]: "uploading" }));
    setTimeout(() => {
      setDocs((p) => ({ ...p, [key]: "uploaded" }));
      toast.success(`${key} uploaded`);
    }, 700);
  };

  const handleSubmit = () => {
    const auth = getMechanicAuth();
    if (!auth) return navigate("/mechanic/login");
    setMechanicAuth({ ...auth, status: "pending_approval" });
    toast.success("KYC submitted for admin review");
    navigate("/mechanic/pending", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">KYC Verification</h1>
      </header>
      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        <h2 className="text-heading-sm text-foreground">Upload Documents</h2>
        <p className="text-body-sm text-muted-foreground mt-1">All documents are required for verification.</p>
        <div className="mt-4 space-y-3">
          {DOCS.map((doc) => (
            <motion.button
              key={doc.key}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileRefs.current[doc.key]?.click()}
              disabled={docs[doc.key] === "uploading"}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left"
            >
              <input
                ref={(el) => { fileRefs.current[doc.key] = el; }}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(doc.key, e.target.files?.[0])}
              />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${docs[doc.key] === "uploaded" ? "bg-success/10" : "bg-secondary"}`}>
                {docs[doc.key] === "uploading" ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> :
                 docs[doc.key] === "uploaded" ? <CheckCircle2 className="w-6 h-6 text-success" /> :
                 <FileText className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-bold text-foreground">{doc.label}</p>
                <p className="text-caption text-muted-foreground">{doc.desc}</p>
              </div>
              {docs[doc.key] === "pending" && (
                <span className="text-caption text-primary font-semibold flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </span>
              )}
              {docs[doc.key] === "uploaded" && <span className="text-caption text-success font-semibold">Done</span>}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="px-6 pb-8 pb-safe">
        <MobileButton fullWidth disabled={!allUploaded} onClick={handleSubmit}>
          Submit for Approval
        </MobileButton>
      </div>
    </div>
  );
};

export default MechanicKycScreen;