import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Car,
  Clock,
  Pencil,
  CalendarIcon,
  ChevronUp,
  ChevronDown,
  Zap,
  MapPin,
  Battery,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { format, isBefore } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/PageTransition";
import { useCreateBooking } from "@/api/bookings";
import { useCreateEvReservation } from "@/modules/ev/hooks";
import { CONNECTOR_LABEL } from "@/modules/ev/types";

const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const BookingSummaryScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  // EV charging branch — completely different UX, but reuses the same
  // container + confirm button. See EvChargerSelectionScreen for the shape.
  if (state?.kind === "ev-charging") {
    return <EvBookingSummary state={state} />;
  }

  const slotNumber = state?.slotNumber || "A3";
  const slotType = state?.slotType || "covered";
  const price = state?.price || 40;
  const facilityName = state?.facilityName || "Parking Facility";
  const facilityLat = state?.facilityLat ?? null;
  const facilityLng = state?.facilityLng ?? null;
  const facilityAddress = state?.facilityAddress ?? null;
  const slotId = state?.slotId;
  const parkingId = state?.parkingId;
  const vehicleId = state?.vehicleId;
  const vehicleRegistration = state?.vehicleRegistration || "TN 01 AB 1234";

  // Fix #10: Use pre-selected times from SlotSelectionScreen if available
  const preStartTime = state?.startTime as string | undefined;
  const preEndTime = state?.endTime as string | undefined;

  const now = new Date();

  const parsePreTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d,
      time: `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
    };
  };

  const preStart = preStartTime ? parsePreTime(preStartTime) : null;
  const preEnd = preEndTime ? parsePreTime(preEndTime) : null;

  const [startDate, setStartDate] = useState<Date>(preStart?.date ?? now);
  const [endDate, setEndDate] = useState<Date>(preEnd?.date ?? now);
  const [startTime, setStartTime] = useState(() => {
    if (preStart) return preStart.time;
    const h = now.getHours();
    const m = now.getMinutes() < 30 ? 30 : 0;
    const hAdj = now.getMinutes() >= 30 ? h + 1 : h;
    return `${(hAdj % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });
  const [endTime, setEndTime] = useState(() => {
    if (preEnd) return preEnd.time;
    const [h, m] = startTime.split(":").map(Number);
    return `${((h + 2) % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const createBooking = useCreateBooking();

  const totalMinutes = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMs = new Date(startDate).setHours(sh, sm, 0, 0);
    const endMs = new Date(endDate).setHours(eh, em, 0, 0);
    let diffMin = Math.round((endMs - startMs) / 60000);
    if (diffMin <= 0) diffMin = 30; // minimum 30 min
    return diffMin;
  }, [startDate, endDate, startTime, endTime]);

  const durationText = useMemo(() => {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hrs = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? "s" : ""}`);
    if (mins > 0) parts.push(`${mins} min`);
    return parts.join(" ") || "0 min";
  }, [totalMinutes]);

  const durationHours = useMemo(
    () => Math.ceil(totalMinutes / 60),
    [totalMinutes],
  );
  const totalPrice = useMemo(
    () => durationHours * price,
    [durationHours, price],
  );

  const handleConfirm = async () => {
    if (!slotId || !parkingId || !vehicleId) {
      setError("Missing booking details. Please go back and try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startDt = new Date(startDate);
      startDt.setHours(sh, sm, 0, 0);
      const endDt = new Date(endDate);
      endDt.setHours(eh, em, 0, 0);

      const booking = await createBooking.mutateAsync({
        facility_id: parkingId,
        slot_id: slotId,
        vehicle_id: vehicleId,
        vehicle_type: state?.vehicleType,
        start_time: startDt.toISOString(),
        end_time: endDt.toISOString(),
      });

      navigate("/upi-payment", {
        replace: true,
        state: {
          bookingId: booking.id,
          bookingReference: booking.booking_reference,
          slot: slotNumber,
          parking: facilityName,
          facilityLat,
          facilityLng,
          facilityAddress,
          price: booking.total_amount,
          duration: durationText,
        },
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          "Failed to create booking. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const TimeSelector = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) => {
    const currentIndex = TIME_OPTIONS.indexOf(value);
    const scrollUp = () => {
      const prev =
        (currentIndex - 1 + TIME_OPTIONS.length) % TIME_OPTIONS.length;
      onChange(TIME_OPTIONS[prev]);
    };
    const scrollDown = () => {
      const next = (currentIndex + 1) % TIME_OPTIONS.length;
      onChange(TIME_OPTIONS[next]);
    };
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-caption text-muted-foreground font-semibold">
          {label}
        </span>
        <div className="flex flex-col items-center">
          <button
            onClick={scrollUp}
            className="touch-target flex items-center justify-center"
          >
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="bg-secondary rounded-xl px-4 py-2 min-w-[100px] text-center">
            <span className="text-body font-bold text-foreground">
              {formatTime12(value)}
            </span>
          </div>
          <button
            onClick={scrollDown}
            className="touch-target flex items-center justify-center"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  };

  const cards = [
    {
      label: "PARKING LOCATION",
      content: (
        <p className="text-body font-bold text-foreground">{facilityName}</p>
      ),
    },
    {
      label: "SELECTED SLOT",
      content: (
        <>
          <p className="text-heading-md text-primary">{slotNumber}</p>
          <p className="mt-1 text-body-sm text-muted-foreground capitalize">
            {slotType} · Near Entry
          </p>
        </>
      ),
    },
    {
      label: "VEHICLE",
      content: (
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-primary" />
          <p className="text-body-sm font-bold text-foreground">
            {vehicleRegistration}
          </p>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
        {/* Header */}
        <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center -ml-2"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="flex-1 text-body font-bold text-foreground text-center">
            Booking Summary
          </h1>
          <div className="w-[44px]" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 relative"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </div>
              {card.content}
            </motion.div>
          ))}

          {/* Time section — read-only if pre-selected from slot screen, editable otherwise */}
          {preStart && preEnd ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Booking Time
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm text-muted-foreground">Start</p>
                  <p className="text-body font-bold text-foreground">
                    {format(preStart.date, "dd MMM yyyy")} ·{" "}
                    {formatTime12(preStart.time)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm text-muted-foreground">End</p>
                  <p className="text-body font-bold text-foreground">
                    {format(preEnd.date, "dd MMM yyyy")} ·{" "}
                    {formatTime12(preEnd.time)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-caption text-primary font-semibold text-center">
                Duration: {durationText}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Start date & time */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Start Date & Time
                </p>
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex-1 flex items-center gap-2 p-3 bg-secondary rounded-xl">
                        <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-body-sm font-semibold text-foreground">
                          {format(startDate, "dd MMM yyyy")}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => {
                          if (!d) return;
                          setStartDate(d);
                          if (isBefore(endDate, d)) setEndDate(d);
                        }}
                        disabled={(d) =>
                          isBefore(
                            d,
                            new Date(
                              now.getFullYear(),
                              now.getMonth(),
                              now.getDate(),
                            ),
                          )
                        }
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <TimeSelector
                    label=""
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
              </motion.div>

              {/* End date & time */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  End Date & Time
                </p>
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex-1 flex items-center gap-2 p-3 bg-secondary rounded-xl">
                        <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-body-sm font-semibold text-foreground">
                          {format(endDate, "dd MMM yyyy")}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(d) => d && setEndDate(d)}
                        disabled={(d) => isBefore(d, startDate)}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <TimeSelector
                    label=""
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
                <p className="mt-3 text-caption text-primary font-semibold text-center">
                  Duration: {durationText}
                </p>
              </motion.div>
            </>
          )}

          {/* Price breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-primary uppercase tracking-wider mb-3">
              Estimated Price
            </p>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-foreground">
                ₹{price} × {durationHours} hr{durationHours > 1 ? "s" : ""}
              </span>
              <span className="text-body-sm font-semibold text-foreground">
                ₹{totalPrice}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-between">
              <span className="text-body font-bold text-foreground">Total</span>
              <span className="text-heading-md text-primary">
                ₹{totalPrice}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Confirm button */}
        <div className="px-4 pb-4 pb-safe bg-background">
          {error && (
            <p className="mb-3 text-body-sm text-destructive text-center">
              {error}
            </p>
          )}
          <MobileButton
            fullWidth
            loading={loading || createBooking.isPending}
            onClick={handleConfirm}
          >
            Proceed to Payment
          </MobileButton>
        </div>
      </div>
    </PageTransition>
  );
};

// ---------- EV charging booking summary ----------
//
// State shape expected from EvChargerSelectionScreen:
//   { kind: 'ev-charging', stationId, stationName, stationAddress,
//     stationLat, stationLng, chargerId, connectorType, powerKw,
//     vehicleId, vehicleRegistration, batteryKwh, currentSocPct, target,
//     estimate, requestedStart, userId }

interface EvSummaryState {
  kind: "ev-charging";
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationLat: number;
  stationLng: number;
  chargerId: string;
  connectorType: keyof typeof CONNECTOR_LABEL;
  powerKw: number;
  vehicleId: string;
  vehicleRegistration: string;
  batteryKwh: number;
  currentSocPct: number;
  target:
    | { kind: "soc"; targetSocPct: number }
    | { kind: "duration"; minutes: number }
    | { kind: "full" };
  estimate: {
    kwh: number;
    pricePerKwh: number;
    energy: number;
    gst: number;
    gstPct: number;
    idleFeePerMin: number;
    total: number;
    minutes: number;
  };
  requestedStart: string;
  userId: string;
}

const EvBookingSummary = ({ state }: { state: EvSummaryState }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const createReservation = useCreateEvReservation();

  const start = new Date(state.requestedStart);
  const durationMinutes = Math.max(1, Math.round(state.estimate.minutes));
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const targetLabel =
    state.target.kind === "soc"
      ? `Charge to ${state.target.targetSocPct}% SOC`
      : state.target.kind === "duration"
        ? `Charge for ${state.target.minutes} min`
        : "Charge till full";

  const handleReserve = async () => {
    setLoading(true);
    setError("");
    try {
      const reservation = await createReservation.mutateAsync({
        stationId: state.stationId,
        chargerId: state.chargerId,
        vehicleId: state.vehicleId,
        userId: state.userId,
        requestedStart: state.requestedStart,
        target: state.target,
        batteryKwh: state.batteryKwh,
        currentSocPct: state.currentSocPct,
      });
      navigate("/upi-payment", {
        replace: true,
        state: {
          kind: "ev-charging",
          evReservationId: reservation.id,
          price: state.estimate.total,
          parking: state.stationName,
          slot: `${CONNECTOR_LABEL[state.connectorType]} · ${state.powerKw}kW`,
          duration: `${durationMinutes} min`,
          facilityLat: state.stationLat,
          facilityLng: state.stationLng,
          facilityAddress: state.stationAddress,
        },
      });
    } catch (e) {
      setError("Could not create reservation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
        <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center -ml-2"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="flex-1 text-body font-bold text-foreground text-center">
            Booking Summary
          </h1>
          <div className="w-[44px]" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
          {/* Station */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Station
            </p>
            <div className="mt-2 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-body font-bold text-foreground truncate">
                  {state.stationName}
                </p>
                <p className="text-caption text-muted-foreground truncate">
                  {state.stationAddress}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Connector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Charger
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <p className="text-body-sm font-bold text-foreground">
                  {CONNECTOR_LABEL[state.connectorType]}
                </p>
                <p className="text-caption text-muted-foreground">
                  {state.powerKw} kW
                </p>
              </div>
            </div>
          </motion.div>

          {/* Vehicle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Vehicle
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Car className="w-5 h-5 text-primary" />
              <div>
                <p className="text-body-sm font-bold text-foreground">
                  {state.vehicleRegistration}
                </p>
                <p className="text-caption text-muted-foreground">
                  Currently at {state.currentSocPct}% · {state.batteryKwh} kWh battery
                </p>
              </div>
            </div>
          </motion.div>

          {/* Time */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Schedule
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">Start</p>
                <p className="text-body font-bold text-foreground">
                  {format(start, "dd MMM, hh:mm a")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-body-sm text-muted-foreground">End (est.)</p>
                <p className="text-body font-bold text-foreground">
                  {format(end, "hh:mm a")}
                </p>
              </div>
            </div>
            <p className="mt-3 text-caption text-primary font-semibold text-center flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {durationMinutes} min · {targetLabel}
            </p>
          </motion.div>

          {/* Cost breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5" />
              Estimated cost
            </p>
            <div className="mt-3 space-y-2">
              <SumRow
                label={`Energy · ${state.estimate.kwh.toFixed(1)} kWh × ₹${state.estimate.pricePerKwh.toFixed(1)}`}
                value={`₹${Math.round(state.estimate.energy)}`}
              />
              <SumRow
                label={`GST (${state.estimate.gstPct}%)`}
                value={`₹${Math.round(state.estimate.gst)}`}
              />
              {state.estimate.idleFeePerMin > 0 && (
                <SumRow
                  label="Idle fee (after complete)"
                  value={`₹${state.estimate.idleFeePerMin}/min`}
                  muted
                />
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-primary/20 flex items-baseline justify-between">
              <span className="text-body font-bold text-foreground">Total</span>
              <span className="text-heading-md text-primary">
                ₹{state.estimate.total}
              </span>
            </div>
          </motion.div>
        </div>

        <div className="px-4 pb-4 pb-safe bg-background">
          {error && (
            <p className="mb-3 text-body-sm text-destructive text-center">
              {error}
            </p>
          )}
          <MobileButton
            fullWidth
            loading={loading || createReservation.isPending}
            onClick={handleReserve}
          >
            Reserve & Pay
          </MobileButton>
        </div>
      </div>
    </PageTransition>
  );
};

const SumRow = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex items-baseline justify-between">
    <span
      className={`text-body-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {label}
    </span>
    <span
      className={`text-body-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {value}
    </span>
  </div>
);

export default BookingSummaryScreen;
