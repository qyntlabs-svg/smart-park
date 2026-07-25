import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileButton } from "@/components/ui/mobile-button";
import { getMobilePricing, setMobilePricing } from "@/lib/mechanic";
import { toast } from "sonner";

const AdminMobilePricingScreen = () => {
  const navigate = useNavigate();
  const [p, setP] = useState(getMobilePricing());

  const save = () => {
    setMobilePricing({
      labourPerService: Math.max(0, +p.labourPerService || 0),
      travelPerKm: Math.max(0, +p.travelPerKm || 0),
      serviceCharge: Math.max(0, +p.serviceCharge || 0),
      nightSurchargePct: Math.max(0, Math.min(100, +p.nightSurchargePct || 0)),
    });
    toast.success("Pricing saved");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">Mobile Mechanic Pricing</h1>
      </header>

      <div className="p-5 space-y-4">
        <Field label="Labour per service (₹)" value={p.labourPerService} onChange={(v) => setP({ ...p, labourPerService: v })} />
        <Field label="Travel charge per km (₹)" value={p.travelPerKm} onChange={(v) => setP({ ...p, travelPerKm: v })} />
        <Field label="Service charge (₹)" value={p.serviceCharge} onChange={(v) => setP({ ...p, serviceCharge: v })} />
        <Field label="Night surcharge (% of subtotal, 9PM–6AM)" value={p.nightSurchargePct} onChange={(v) => setP({ ...p, nightSurchargePct: v })} />
        <MobileButton fullWidth onClick={save}><Save className="w-4 h-4 mr-1" /> Save</MobileButton>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-12 rounded-xl"
    />
  </div>
);

export default AdminMobilePricingScreen;