import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Car, Bike } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const EditVehicleScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  // Mock: load vehicle data based on id
  const [number, setNumber] = useState(id === "1" ? "TN 01 AB 1234" : "TN 12 XY 5678");
  const [nickname, setNickname] = useState(id === "1" ? "My Car" : "Office Bike");
  const [type, setType] = useState<"two_wheeler" | "four_wheeler">(id === "1" ? "four_wheeler" : "two_wheeler");

  const handleSave = () => {
    toast({ title: "Vehicle Updated", description: "Vehicle details saved successfully." });
    navigate(-1);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Edit Vehicle</h1>
        <div className="w-[44px]" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Vehicle type selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-6 space-y-5"
        >
          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">Vehicle Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "four_wheeler" as const, icon: Car, label: "4 Wheeler" },
                { key: "two_wheeler" as const, icon: Bike, label: "2 Wheeler" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    type === key
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <Icon className={`w-8 h-8 ${type === key ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-body-sm font-semibold ${type === key ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">Registration Number</Label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value.toUpperCase())}
              placeholder="TN 01 AB 1234"
              className="h-12 rounded-xl border-border bg-card uppercase tracking-wider font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">Vehicle Nickname</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. My Car, Office Bike"
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>
        </motion.div>
      </div>

      <div className="px-6 py-4 pb-safe bg-card border-t border-border">
        <MobileButton fullWidth onClick={handleSave}>
          Save Changes
        </MobileButton>
      </div>
    </div>
  );
};

export default EditVehicleScreen;
