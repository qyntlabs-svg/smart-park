import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, QrCode, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";

const SLOT_PREFIX = "A";
const TOTAL_SLOTS = 20;
const VENDOR_ID = "VENDOR_001";

const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => `${SLOT_PREFIX}-${String(i + 1).padStart(2, "0")}`);

const VendorQrCodesScreen = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const qrValue = (slot: string) =>
    JSON.stringify({ vendor: VENDOR_ID, slot, type: "slot-entry" });

  const handleDownload = useCallback((slot: string) => {
    const el = document.getElementById(`qr-${slot}`)?.querySelector("svg");
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new XMLSerializer().serializeToString(el);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 0, 0, 600, 600);
      const link = document.createElement("a");
      link.download = `QR-${slot}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Downloaded QR for ${slot}`);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }, []);

  const handlePrintAll = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">QR Codes</h1>
      </header>

      {/* Gate QR */}
      <div className="px-4 pt-4">
        <div className="p-4 bg-card border border-border rounded-2xl flex flex-col items-center">
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Gate Entry QR</p>
          <div id="qr-GATE" className="p-4 bg-background rounded-2xl">
            <QRCodeSVG value={JSON.stringify({ vendor: VENDOR_ID, type: "gate-entry" })} size={160} level="H" includeMargin />
          </div>
          <MobileButton size="sm" variant="outline" className="mt-3" onClick={() => handleDownload("GATE")}>
            <Download className="w-4 h-4" /> Download Gate QR
          </MobileButton>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 flex gap-3">
        <MobileButton size="sm" variant="outline" fullWidth onClick={handlePrintAll}>
          <Printer className="w-4 h-4" /> Print All
        </MobileButton>
      </div>

      {/* Slot QRs */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-body-sm font-bold text-foreground">Slot QR Codes</p>
        <p className="text-caption text-muted-foreground">Tap a slot to view & download its QR</p>
      </div>

      <div className="flex-1 px-4 pb-8 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <motion.button
              key={slot}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(selected === slot ? null : slot)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selected === slot
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <QrCode className={`w-5 h-5 mx-auto ${selected === slot ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-caption font-semibold text-foreground mt-1">{slot}</p>
            </motion.button>
          ))}
        </div>

        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-card border border-border rounded-2xl flex flex-col items-center"
          >
            <p className="text-body-sm font-bold text-foreground mb-3">Slot {selected}</p>
            <div id={`qr-${selected}`} className="p-4 bg-background rounded-2xl">
              <QRCodeSVG value={qrValue(selected)} size={160} level="H" includeMargin />
            </div>
            <MobileButton size="sm" variant="outline" className="mt-3" onClick={() => handleDownload(selected)}>
              <Download className="w-4 h-4" /> Download
            </MobileButton>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VendorQrCodesScreen;
