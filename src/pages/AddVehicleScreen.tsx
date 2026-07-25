import { useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Bike, ChevronLeft, Zap } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAddVehicle } from "@/api/vehicles";
import { upsertVehicleProfile } from "@/modules/ev/store";
import { CONNECTOR_LABEL, type ConnectorType } from "@/modules/ev/types";

const COLORS = [
  { name: "Red", value: "0 84% 60%" },
  { name: "Blue", value: "217 91% 60%" },
  { name: "White", value: "0 0% 95%" },
  { name: "Black", value: "0 0% 10%" },
  { name: "Silver", value: "0 0% 75%" },
  { name: "Grey", value: "0 0% 50%" },
  { name: "Green", value: "142 71% 45%" },
  { name: "Yellow", value: "48 96% 53%" },
];

const CONNECTOR_OPTIONS: ConnectorType[] = [
  "type2",
  "ccs",
  "chademo",
  "gbt",
  "bharat_ac_001",
  "bharat_dc_001",
];

const AddVehicleScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isFirstTime = (location.state as any)?.first === true;
  const evMode = searchParams.get("type") === "ev";
  const nextRoute = searchParams.get("next") ?? undefined;

  const [vehicleType, setVehicleType] = useState<
    "two_wheeler" | "four_wheeler" | null
  >(evMode ? "four_wheeler" : null);
  const [isEv, setIsEv] = useState<boolean>(evMode);
  const [connectorType, setConnectorType] = useState<ConnectorType>("ccs");
  const [batteryKwh, setBatteryKwh] = useState<number>(40);
  const [currentSocPct, setCurrentSocPct] = useState<number>(30);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [model, setModel] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(true);

  const isValid = useMemo(() => {
    if (!vehicleType) return false;
    if (vehicleNumber.trim().length < 4) return false;
    if (isEv) {
      if (batteryKwh < 5 || batteryKwh > 200) return false;
      if (currentSocPct < 0 || currentSocPct > 100) return false;
    }
    return true;
  }, [vehicleType, vehicleNumber, isEv, batteryKwh, currentSocPct]);

  const addVehicle = useAddVehicle();

  const handleSave = async () => {
    if (!isValid || !vehicleType) return;
    let createdId: string | undefined;
    try {
      const created = await addVehicle.mutateAsync({
        registration_number: vehicleNumber,
        vehicle_type: vehicleType,
        nickname: nickname || undefined,
        model: model || undefined,
        color_hsl: selectedColor || undefined,
        is_default: isDefault,
      });
      createdId = created?.id;
    } catch {
      // Mock/demo environment: backend may be unavailable. Proceed anyway.
      createdId = `veh_${Date.now()}`;
    }

    try {
      if (isEv && createdId) {
        await upsertVehicleProfile({
          vehicleId: createdId,
          connectorType,
          batteryKwh,
          currentSocPct,
        });
      }
    } catch {
      // ignore local persistence errors
    }

    if (evMode && nextRoute) {
      navigate(nextRoute, { replace: true });
      return;
    }
    navigate("/vehicle-added", {
      replace: true,
      state: { vehicleNumber, nickname, vehicleType, isDefault, isEv },
    });
  };

  // First-time mandatory prompt (unchanged)
  if (isFirstTime && !vehicleType) {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-[200px] h-[200px] rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Car className="w-24 h-24 text-primary" strokeWidth={1.2} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-heading-lg text-foreground text-center"
        >
          Add Your Vehicle
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-body text-muted-foreground text-center max-w-[280px] leading-relaxed"
        >
          To book parking, we need to know what you're driving
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-12 w-[280px]"
        >
          <MobileButton fullWidth onClick={() => setVehicleType("four_wheeler")}>
            Add My First Vehicle
          </MobileButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center h-[60px] px-4 pt-safe border-b border-border bg-card">
        {!isFirstTime && (
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center -ml-2"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
        )}
        <h1 className="flex-1 text-body font-bold text-foreground text-center">
          {evMode ? "Add EV Vehicle" : "Add Vehicle"}
        </h1>
        <div className="w-[44px]" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        {/* Vehicle Type */}
        <p className="text-caption font-semibold text-muted-foreground tracking-wider uppercase">
          Vehicle Type
        </p>
        <div className="mt-3 flex gap-3">
          {[
            { type: "two_wheeler" as const, icon: Bike, label: "Two-Wheeler" },
            { type: "four_wheeler" as const, icon: Car, label: "Four-Wheeler" },
          ].map(({ type, icon: Icon, label }) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVehicleType(type)}
              className={`flex-1 h-[120px] rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-colors ${
                vehicleType === type
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <Icon
                className={`w-10 h-10 ${vehicleType === type ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={1.5}
              />
              <span
                className={`text-body-sm font-semibold ${vehicleType === type ? "text-primary" : "text-foreground"}`}
              >
                {label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Vehicle details form */}
        {vehicleType && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            {/* EV toggle */}
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body-sm font-bold text-foreground">
                      This is an EV
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Unlocks charging reservations
                    </p>
                  </div>
                </div>
                <Switch checked={isEv} onCheckedChange={setIsEv} />
              </div>

              {isEv && (
                <div className="mt-4 space-y-4">
                  {/* Connector */}
                  <div>
                    <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                      Connector type
                    </label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CONNECTOR_OPTIONS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setConnectorType(t)}
                          className={`px-3 h-9 rounded-full border text-body-sm font-semibold ${
                            connectorType === t
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          {CONNECTOR_LABEL[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Battery */}
                  <div>
                    <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                      Battery capacity (kWh)
                    </label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="mt-2 h-12 rounded-xl"
                      value={batteryKwh}
                      onChange={(e) =>
                        setBatteryKwh(parseFloat(e.target.value) || 0)
                      }
                      placeholder="40"
                    />
                  </div>

                  {/* Current SOC */}
                  <div>
                    <div className="flex items-baseline justify-between">
                      <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                        Current SOC
                      </label>
                      <span className="text-body-sm font-bold text-primary">
                        {currentSocPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={currentSocPct}
                      onChange={(e) => setCurrentSocPct(Number(e.target.value))}
                      className="w-full mt-2 accent-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="text-body-sm font-semibold text-foreground">
                Vehicle Number <span className="text-destructive">*</span>
              </label>
              <Input
                className="mt-2 h-14 rounded-xl text-body px-4"
                placeholder="MH 01 AB 1234"
                maxLength={13}
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                autoFocus
              />
              <p className="mt-1.5 text-caption text-muted-foreground">
                Enter your registration number
              </p>
            </div>

            {/* Nickname */}
            <div>
              <label className="text-body-sm font-semibold text-foreground">
                Vehicle Nickname
              </label>
              <Input
                className="mt-2 h-14 rounded-xl text-body px-4"
                placeholder="e.g., My Red EV, Office Bike"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* Model */}
            <div>
              <label className="text-body-sm font-semibold text-foreground">
                Vehicle Model
              </label>
              <Input
                className="mt-2 h-14 rounded-xl text-body px-4"
                placeholder="e.g., Tata Nexon EV, MG ZS EV"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="text-body-sm font-semibold text-foreground">
                Vehicle Color
              </label>
              <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.value)}
                    className={`shrink-0 w-11 h-11 rounded-full border-2 transition-all ${
                      selectedColor === c.value
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: `hsl(${c.value})` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Default toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-body-sm font-semibold text-foreground">
                  Set as default vehicle
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  Used for quick booking
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
          </motion.div>
        )}
      </div>

      {vehicleType && (
        <div className="px-6 pb-8 pb-safe">
          <MobileButton
            fullWidth
            disabled={!isValid}
            loading={addVehicle.isPending}
            onClick={handleSave}
          >
            Save & Continue
          </MobileButton>
        </div>
      )}
    </div>
  );
};

export default AddVehicleScreen;
