import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, QrCode, Printer, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { usePartnerQrCodes, usePartnerSetup } from "@/api/partner";

const PartnerQrCodesScreen = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: qrData, isLoading } = usePartnerQrCodes();
  const { data: setup } = usePartnerSetup();

  // qrData.qr_codes = array of { id, slot_number, qr_code_data }
  const slots: any[] = qrData?.qr_codes ?? [];
  const qrType: string = qrData?.qr_type ?? "per_gate";
  const facilityId = setup?.facility_id ?? "FACILITY";

  // QR value for a slot — use stored qr_code_data if available, else generate
  const slotQrValue = (slot: any) => {
    if (slot.qr_code_data) return slot.qr_code_data;
    return JSON.stringify({
      facility_id: facilityId,
      slot_id: slot.id,
      slot_number: slot.slot_number,
      type: "slot-entry",
    });
  };

  const gateQrValue = JSON.stringify({
    facility_id: facilityId,
    type: "gate-entry",
  });

  const handleDownload = useCallback((elementId: string, label: string) => {
    const el = document.getElementById(elementId)?.querySelector("svg");
    if (!el) {
      toast.error("QR not found");
      return;
    }
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
      link.download = `QR-${label}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Downloaded QR for ${label}`);
    };
    img.src =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          QR Codes
        </h1>
      </header>

      {/* Gate QR — always shown */}
      <div className="px-4 pt-4">
        <div className="p-4 bg-card border border-border rounded-2xl flex flex-col items-center">
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Gate Entry QR
          </p>
          <p className="text-caption text-muted-foreground mb-3">
            Place this at the parking entrance
          </p>
          <div id="qr-GATE" className="p-4 bg-background rounded-2xl">
            <QRCodeSVG value={gateQrValue} size={160} level="H" includeMargin />
          </div>
          <MobileButton
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => handleDownload("qr-GATE", "Gate-Entry")}
          >
            <Download className="w-4 h-4" /> Download Gate QR
          </MobileButton>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 flex gap-3">
        <MobileButton
          size="sm"
          variant="outline"
          fullWidth
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" /> Print All
        </MobileButton>
      </div>

      {/* Slot QRs — only shown for per_slot type or always for reference */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-body-sm font-bold text-foreground">
          Slot QR Codes
          <span className="ml-2 text-caption font-normal text-muted-foreground">
            ({slots.length} slots)
          </span>
        </p>
        <p className="text-caption text-muted-foreground">
          Tap a slot to view & download its QR
        </p>
      </div>

      <div className="flex-1 px-4 pb-8 overflow-y-auto scrollbar-hide">
        {!slots.length ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <QrCode className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-body-sm text-muted-foreground">
              No slots configured yet
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot: any) => (
                <motion.button
                  key={slot.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setSelected(selected === slot.id ? null : slot.id)
                  }
                  className={`p-3 rounded-xl border text-center transition-all ${selected === slot.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <QrCode
                    className={`w-5 h-5 mx-auto ${selected === slot.id ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p className="text-caption font-semibold text-foreground mt-1">
                    {slot.slot_number}
                  </p>
                </motion.button>
              ))}
            </div>

            {selected &&
              (() => {
                const slot = slots.find((s: any) => s.id === selected);
                if (!slot) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-card border border-border rounded-2xl flex flex-col items-center"
                  >
                    <p className="text-body-sm font-bold text-foreground mb-1">
                      Slot {slot.slot_number}
                    </p>
                    <p className="text-caption text-muted-foreground mb-3">
                      {slot.id}
                    </p>
                    <div
                      id={`qr-slot-${slot.id}`}
                      className="p-4 bg-background rounded-2xl"
                    >
                      <QRCodeSVG
                        value={slotQrValue(slot)}
                        size={160}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <MobileButton
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() =>
                        handleDownload(
                          `qr-slot-${slot.id}`,
                          `Slot-${slot.slot_number}`,
                        )
                      }
                    >
                      <Download className="w-4 h-4" /> Download
                    </MobileButton>
                  </motion.div>
                );
              })()}
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerQrCodesScreen;
