import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  QrCode,
  DollarSign,
  Clock,
  AlertTriangle,
  Wallet,
  Building2,
  Shield,
  Info,
  Loader2,
  Car,
  Bike,
  Plus,
  Trash2,
  PenLine,
  Check,
  X,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { calculateCommission } from "@/lib/razorpay";
import {
  usePartnerSetupMutation,
  usePartnerStatus,
  usePartnerSetup,
  usePartnerSlots,
  useAddSlots,
  useUpdateSlot,
  useDeleteSlot,
} from "@/api/partner";
import { toast } from "sonner";
import LocationPicker from "@/components/LocationPicker";

const TOTAL_STEPS = 4;

const PartnerSetupScreen = () => {
  const navigate = useNavigate();
  const [totalSlots, setTotalSlots] = useState("20");
  const [slotPrefix, setSlotPrefix] = useState("A");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(13.002);
  const [longitude, setLongitude] = useState(80.21);
  const [acceptsCar, setAcceptsCar] = useState(true);
  const [acceptsBike, setAcceptsBike] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("40");
  const [dailyRate, setDailyRate] = useState("200");
  const [monthlyPassPrice, setMonthlyPassPrice] = useState("1500");
  const [overstayPenalty, setOverstayPenalty] = useState("50");
  // Payout details
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  // QR
  const [qrType, setQrType] = useState<"per-slot" | "per-gate">("per-gate");
  const [showQr, setShowQr] = useState(false);
  const [step, setStep] = useState(1);

  const slotCount = Math.max(0, parseInt(totalSlots) || 0);
  const generatedSlots = Array.from(
    { length: slotCount },
    (_, i) => `${slotPrefix}-${String(i + 1).padStart(2, "0")}`,
  );
  const commission = calculateCommission(parseInt(hourlyRate) || 0);

  const setupMutation = usePartnerSetupMutation();
  const { data: existingSetup } = usePartnerSetup();
  const { data: slots = [], isLoading: loadingSlots } = usePartnerSlots();
  const addSlotsMutation = useAddSlots();
  const updateSlotMutation = useUpdateSlot();
  const deleteSlotMutation = useDeleteSlot();

  // Slot management state
  const [addCount, setAddCount] = useState("1");
  const [addPrefix, setAddPrefix] = useState("");
  const [addVehicleType, setAddVehicleType] = useState<
    "two_wheeler" | "four_wheeler"
  >("four_wheeler");
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editSlotNumber, setEditSlotNumber] = useState("");

  // Approval gate disabled for demo — partners land here directly after KYC

  // If facility already exists → show slot management instead of setup wizard
  if (existingSetup) {
    const handleAddSlots = async () => {
      const count = parseInt(addCount) || 0;
      if (count < 1) return toast.error("Enter at least 1 slot");
      try {
        const res = await addSlotsMutation.mutateAsync({
          count,
          slot_prefix: addPrefix.trim() || undefined,
          vehicle_type: addVehicleType,
        });
        toast.success(`Added ${res.data?.added ?? count} slots`);
        setAddCount("1");
      } catch (err: any) {
        toast.error(
          err?.response?.data?.error?.message || "Failed to add slots",
        );
      }
    };

    const handleUpdateSlot = async (slotId: string) => {
      try {
        await updateSlotMutation.mutateAsync({
          slotId,
          slot_number: editSlotNumber,
        });
        toast.success("Slot updated");
        setEditingSlot(null);
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "Update failed");
      }
    };

    const handleToggleBlock = async (slotId: string, currentStatus: string) => {
      const newStatus = currentStatus === "blocked" ? "available" : "blocked";
      try {
        await updateSlotMutation.mutateAsync({ slotId, status: newStatus });
        toast.success(
          newStatus === "blocked" ? "Slot blocked" : "Slot unblocked",
        );
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "Update failed");
      }
    };

    const handleDeleteSlot = async (slotId: string) => {
      try {
        const res = await deleteSlotMutation.mutateAsync(slotId);
        if (res.data?.blocked) {
          toast.success(
            "Slot has bookings — marked as blocked instead of deleted",
          );
        } else {
          toast.success("Slot removed");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "Delete failed");
      }
    };

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
            Manage Slots
          </h1>
        </header>

        <div className="flex-1 px-4 pt-4 overflow-y-auto scrollbar-hide space-y-4 pb-8">
          {/* Facility summary */}
          <div className="p-4 bg-card border border-border rounded-2xl">
            <p className="text-body-sm font-bold text-foreground">
              {existingSetup.name ?? "Your Facility"}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {slots.length} total slots · ₹{existingSetup.hourly_rate}/hr
            </p>
          </div>

          {/* Add slots */}
          <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
            <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Add More Slots
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">Count</p>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={addCount}
                  onChange={(e) => setAddCount(e.target.value)}
                  className="h-11 rounded-xl text-center"
                />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">
                  Prefix (optional)
                </p>
                <Input
                  type="text"
                  value={addPrefix}
                  onChange={(e) => setAddPrefix(e.target.value.toUpperCase())}
                  placeholder={existingSetup.slot_prefix ?? "A"}
                  className="h-11 rounded-xl text-center"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(["four_wheeler", "two_wheeler"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAddVehicleType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${addVehicleType === t ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  {t === "four_wheeler" ? (
                    <Car className="w-4 h-4" />
                  ) : (
                    <Bike className="w-4 h-4" />
                  )}
                  <span className="text-body-sm font-semibold">
                    {t === "four_wheeler" ? "Car" : "Bike"}
                  </span>
                </button>
              ))}
            </div>
            <MobileButton
              fullWidth
              loading={addSlotsMutation.isPending}
              onClick={handleAddSlots}
            >
              <Plus className="w-4 h-4" /> Add Slots
            </MobileButton>
          </div>

          {/* Slot list */}
          <div>
            <p className="text-body-sm font-bold text-foreground mb-2">
              All Slots ({slots.length})
            </p>
            {loadingSlots ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {(slots as any[]).map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                  >
                    {editingSlot === slot.id ? (
                      <>
                        <Input
                          value={editSlotNumber}
                          onChange={(e) => setEditSlotNumber(e.target.value)}
                          className="h-9 flex-1 rounded-lg text-body-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateSlot(slot.id)}
                          className="p-1.5 text-success"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingSlot(null)}
                          className="p-1.5 text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${slot.status === "occupied" ? "bg-destructive" : slot.status === "blocked" ? "bg-warning" : "bg-success"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-semibold text-foreground">
                            {slot.slot_number}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            {slot.vehicle_type === "two_wheeler"
                              ? "Bike"
                              : "Car"}{" "}
                            · {slot.status}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleBlock(slot.id, slot.status)
                          }
                          disabled={
                            slot.status === "occupied" ||
                            updateSlotMutation.isPending
                          }
                          className={`text-caption font-semibold px-2 py-1 rounded-lg ${slot.status === "blocked" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"} disabled:opacity-40`}
                        >
                          {slot.status === "blocked" ? "Unblock" : "Block"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingSlot(slot.id);
                            setEditSlotNumber(slot.slot_number);
                          }}
                          className="p-1.5 text-muted-foreground"
                        >
                          <PenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={
                            slot.status === "occupied" ||
                            deleteSlotMutation.isPending
                          }
                          className="p-1.5 text-destructive disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleFinish = async () => {
    const slots = parseInt(totalSlots) || 0;
    const rate = parseFloat(hourlyRate) || 0;

    if (slots < 1) {
      toast.error("Total slots must be at least 1.");
      return;
    }
    if (rate <= 0) {
      toast.error("Hourly rate must be greater than 0.");
      return;
    }
    if (!address.trim()) {
      toast.error("Please pin your parking location on the map.");
      setStep(1);
      return;
    }
    if (!acceptsCar && !acceptsBike) {
      toast.error("Select at least one vehicle type.");
      setStep(1);
      return;
    }

    try {
      await setupMutation.mutateAsync({
        total_slots: slots,
        slot_prefix: slotPrefix.trim() || "A",
        hourly_rate: rate,
        daily_rate: parseFloat(dailyRate) || undefined,
        monthly_pass_price: parseFloat(monthlyPassPrice) || undefined,
        overstay_penalty_per_hour: parseFloat(overstayPenalty) || 0,
        qr_type: qrType === "per-gate" ? "per_gate" : "per_slot",
        payout_method: payoutMethod,
        upi_id: payoutMethod === "upi" ? upiId : undefined,
        bank_account_name: payoutMethod === "bank" ? accountName : undefined,
        bank_account_number:
          payoutMethod === "bank" ? accountNumber : undefined,
        bank_ifsc: payoutMethod === "bank" ? ifscCode : undefined,
        address: address.trim(),
        latitude,
        longitude,
        accepts_four_wheeler: acceptsCar,
        accepts_two_wheeler: acceptsBike,
      });
      navigate("/partner/dashboard", { replace: true });
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === "KYC_NOT_APPROVED") {
        toast.error(
          "You are not authorized to create slots until your account is approved by admin.",
        );
      } else {
        toast.error(
          err?.response?.data?.error?.message ||
            "Setup failed. Please try again.",
        );
      }
    }
  };

  const stepLabels = [
    "Configure Slots",
    "Set Pricing",
    "Payout Setup",
    "Generate QR Codes",
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
          Parking Setup
        </h1>
      </header>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-success" : "bg-secondary"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          {stepLabels[step - 1]}
        </p>
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        {/* Step 1: Slots */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            {/* Address — Leaflet map picker */}
            <div>
              <p className="text-body-sm font-semibold text-foreground mb-2">
                Parking Location
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
            </div>

            {/* Vehicle types */}
            <div>
              <p className="text-body-sm font-semibold text-foreground mb-2">
                Vehicle Types Accepted
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAcceptsCar(!acceptsCar)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${acceptsCar ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <Car
                    className={`w-7 h-7 ${acceptsCar ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-body-sm font-semibold ${acceptsCar ? "text-primary" : "text-foreground"}`}
                  >
                    Car
                  </span>
                </button>
                <button
                  onClick={() => setAcceptsBike(!acceptsBike)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${acceptsBike ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <Bike
                    className={`w-7 h-7 ${acceptsBike ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-body-sm font-semibold ${acceptsBike ? "text-primary" : "text-foreground"}`}
                  >
                    Bike
                  </span>
                </button>
              </div>
              {!acceptsCar && !acceptsBike && (
                <p className="mt-2 text-caption text-destructive">
                  Select at least one vehicle type
                </p>
              )}
            </div>

            {/* Total slots */}
            <div>
              <p className="text-body font-bold text-foreground mb-1">
                Total Slots
              </p>
              <p className="text-caption text-muted-foreground mb-2">
                Enter the number of parking spots
              </p>
              <Input
                type="number"
                min="1"
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                placeholder="e.g. 100"
                className="h-14 rounded-xl text-heading-sm text-center"
              />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-foreground mb-2">
                Slot Prefix
              </p>
              <p className="text-caption text-muted-foreground mb-2">
                Type any prefix (e.g. A, B, P, Floor-1)
              </p>
              <Input
                type="text"
                value={slotPrefix}
                onChange={(e) => setSlotPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. A, B, P1"
                className="h-14 rounded-xl text-heading-sm text-center"
              />
            </div>
            {slotCount > 0 && (
              <div>
                <p className="text-body-sm font-semibold text-foreground mb-2">
                  Generated Slot IDs
                </p>
                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto scrollbar-hide">
                  {generatedSlots.slice(0, 30).map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-card border border-border rounded-lg text-caption font-semibold text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                  {slotCount > 30 && (
                    <span className="px-3 py-1.5 text-caption text-muted-foreground">
                      +{slotCount - 30} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-body-sm font-semibold text-foreground">
                  Hourly Rate (₹)
                </p>
              </div>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="h-14 rounded-xl text-heading-sm text-center"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-body-sm font-semibold text-foreground">
                  Daily Rate (₹)
                </p>
              </div>
              <Input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="h-14 rounded-xl text-heading-sm text-center"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-success" />
                <p className="text-body-sm font-semibold text-foreground">
                  Monthly Pass Price (₹/month)
                </p>
              </div>
              <Input
                type="number"
                value={monthlyPassPrice}
                onChange={(e) => setMonthlyPassPrice(e.target.value)}
                className="h-14 rounded-xl text-heading-sm text-center"
              />
              <p className="mt-1 text-caption text-muted-foreground">
                Set 0 to disable monthly passes for this facility
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <p className="text-body-sm font-semibold text-foreground">
                  Overstay Penalty (₹/hr)
                </p>
              </div>
              <Input
                type="number"
                value={overstayPenalty}
                onChange={(e) => setOverstayPenalty(e.target.value)}
                className="h-14 rounded-xl text-heading-sm text-center"
              />
            </div>
            <div className="p-4 bg-card border border-border rounded-2xl">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Summary
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">
                    Hourly
                  </span>
                  <span className="text-body-sm font-bold text-foreground">
                    ₹{hourlyRate}/hr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">
                    Daily cap
                  </span>
                  <span className="text-body-sm font-bold text-foreground">
                    ₹{dailyRate}/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">
                    Overstay
                  </span>
                  <span className="text-body-sm font-bold text-warning">
                    ₹{overstayPenalty}/hr extra
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payout Setup */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <p className="text-body font-bold text-foreground mb-1">
                How do you want to receive payouts?
              </p>
              <p className="text-caption text-muted-foreground mb-3">
                Earnings from bookings will be transferred to your account after
                platform commission.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPayoutMethod("upi")}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${payoutMethod === "upi" ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <Wallet
                    className={`w-6 h-6 mb-2 ${payoutMethod === "upi" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p
                    className={`text-body-sm font-bold ${payoutMethod === "upi" ? "text-primary" : "text-foreground"}`}
                  >
                    UPI
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Instant transfer
                  </p>
                </button>
                <button
                  onClick={() => setPayoutMethod("bank")}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${payoutMethod === "bank" ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <Building2
                    className={`w-6 h-6 mb-2 ${payoutMethod === "bank" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p
                    className={`text-body-sm font-bold ${payoutMethod === "bank" ? "text-primary" : "text-foreground"}`}
                  >
                    Bank Account
                  </p>
                  <p className="text-caption text-muted-foreground">
                    1-2 business days
                  </p>
                </button>
              </div>
            </div>

            {payoutMethod === "upi" ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <p className="text-body-sm font-semibold text-foreground">
                    Your UPI ID
                  </p>
                </div>
                <Input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="h-14 rounded-xl"
                />
                <p className="mt-1 text-caption text-muted-foreground">
                  Payouts from online bookings will be sent here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-body-sm font-semibold text-foreground mb-2">
                    Account Holder Name
                  </p>
                  <Input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="John Doe"
                    className="h-14 rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-foreground mb-2">
                    Account Number
                  </p>
                  <Input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="1234567890"
                    className="h-14 rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-foreground mb-2">
                    IFSC Code
                  </p>
                  <Input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    className="h-14 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Commission info */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-body-sm font-semibold text-foreground">
                  Platform Commission
                </p>
              </div>
              <p className="text-caption text-muted-foreground mb-3">
                A {commission.commissionPercent}% platform fee is deducted from
                each online booking. The rest is transferred to your account
                automatically via Razorpay.
              </p>
              <div className="p-3 bg-card rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-caption text-muted-foreground">
                    Example: ₹{hourlyRate} booking
                  </span>
                  <span className="text-caption font-bold text-foreground">
                    ₹{hourlyRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-muted-foreground">
                    Platform fee ({commission.commissionPercent}%)
                  </span>
                  <span className="text-caption font-bold text-destructive">
                    -₹{commission.commission}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-caption font-bold text-foreground">
                    You receive
                  </span>
                  <span className="text-caption font-extrabold text-success">
                    ₹{commission.partnerShare}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-caption text-muted-foreground">
                Payments secured by Razorpay
              </span>
            </div>
          </motion.div>
        )}

        {/* Step 4: QR Codes */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <p className="text-body font-bold text-foreground mb-2">
                QR Code Type
              </p>
              <div className="flex gap-3">
                {[
                  {
                    key: "per-gate" as const,
                    label: "Per Gate",
                    desc: "One QR at entry",
                  },
                  {
                    key: "per-slot" as const,
                    label: "Per Slot",
                    desc: "Individual slot QRs",
                  },
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setQrType(key)}
                    className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${qrType === key ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <QrCode
                      className={`w-6 h-6 mb-2 ${qrType === key ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p
                      className={`text-body-sm font-bold ${qrType === key ? "text-primary" : "text-foreground"}`}
                    >
                      {label}
                    </p>
                    <p className="text-caption text-muted-foreground">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-body-sm text-primary font-semibold mb-4"
              >
                {showQr ? "Hide Preview" : "Preview QR Code"}
              </button>
              {showQr && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-card border border-border rounded-3xl"
                >
                  <QRCodeSVG
                    value={JSON.stringify({
                      partner: "PARTNER_001",
                      type: qrType,
                      slot:
                        qrType === "per-slot"
                          ? `${slotPrefix}-01`
                          : "GATE-ENTRY",
                    })}
                    size={180}
                    level="H"
                    includeMargin
                  />
                  <p className="mt-2 text-caption text-center text-muted-foreground">
                    {qrType === "per-gate"
                      ? "Gate Entry QR"
                      : `Slot ${slotPrefix}-01`}
                  </p>
                </motion.div>
              )}
            </div>

            <MobileButton variant="outline" fullWidth onClick={() => {}}>
              <QrCode className="w-5 h-5" /> Download All QR Codes
            </MobileButton>
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8 pb-safe">
        <MobileButton
          fullWidth
          loading={setupMutation.isPending}
          onClick={step < TOTAL_STEPS ? () => setStep(step + 1) : handleFinish}
        >
          {step < TOTAL_STEPS ? "Continue" : "Go Live 🚀"}
        </MobileButton>
      </div>
    </div>
  );
};

export default PartnerSetupScreen;
