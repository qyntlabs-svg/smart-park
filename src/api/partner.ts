import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PartnerDashboard {
  facility_name: string;
  total_slots: number;
  occupied_slots: number;
  available_slots: number;
  occupancy_pct: number;
  today_revenue: number;
  today_bookings: number;
  active_bookings: number;
  completed_today?: number;
}

export interface PartnerBooking {
  id: string;
  booking_reference: string;
  vehicle_registration: string;
  slot_number: string;
  entry_time: string;
  exit_time?: string;
  duration?: string;
  charge?: number;
  status: string;
  payment_status: string;
  payment_method?: string;
}

export interface PartnerEarnings {
  period: string;
  total_revenue: number;
  partner_share: number;
  platform_fee: number;
  total_sessions: number;
  avg_per_session: number;
  upi_pct: number;
  cash_pct: number;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export const usePartnerDashboard = () =>
  useQuery({
    queryKey: ["partner-dashboard"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: PartnerDashboard }>("/partner/dashboard")
        .then((r) => r.data.data),
    refetchInterval: 30000, // refresh every 30s
  });

export const usePartnerActiveBookings = () =>
  useQuery({
    queryKey: ["partner-active-bookings"],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: PartnerBooking[];
        }>("/partner/bookings/active")
        .then((r) => r.data.data),
    refetchInterval: 15000,
  });

export const usePartnerDailyLog = (date?: string, status?: string) =>
  useQuery({
    queryKey: ["partner-daily-log", date, status],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: {
            entries: PartnerBooking[];
            summary: {
              total_sessions: number;
              active: number;
              completed: number;
              total_revenue: number;
            };
          };
        }>(
          "/partner/bookings/daily-log",
          {
            params: { date, status },
          },
        )
        .then((r) => r.data.data),
  });

export const usePartnerEarnings = (
  period: "today" | "week" | "month" = "today",
) =>
  useQuery({
    queryKey: ["partner-earnings", period],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: any;
        }>("/partner/earnings", { params: { period } })
        .then((r) => r.data.data),
  });

export const usePartnerPaymentHistory = () =>
  useQuery({
    queryKey: ["partner-payment-history"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/partner/earnings/payments")
        .then((r) => r.data.data),
  });

export const usePartnerQrCodes = () =>
  useQuery({
    queryKey: ["partner-qr"],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: { qr_codes: any[]; qr_type: "per_gate" | "per_slot" };
        }>("/partner/qr")
        .then((r) => r.data.data),
  });

export const usePartnerKycStatus = () =>
  useQuery({
    queryKey: ["partner-kyc-status"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any }>("/partner/kyc/status")
        .then((r) => r.data.data),
  });

export const usePartnerStatus = () =>
  useQuery({
    queryKey: ["partner-status"],
    queryFn: () =>
      api
        .get<{
          success: boolean;
          data: {
            registered: boolean;
            kyc_status: "pending" | "approved" | "rejected" | null;
            is_active: boolean;
            rejection_reason: string | null;
          };
        }>("/partner/status")
        .then((r) => r.data.data),
  });

export const usePartnerSetup = () =>
  useQuery({
    queryKey: ["partner-setup"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any }>("/partner/setup")
        .then((r) => r.data.data),
  });

export const usePartnerPassHolders = (status?: string) =>
  useQuery({
    queryKey: ["partner-passes", status],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/partner/passes/monthly", {
          params: status ? { status } : {},
        })
        .then((r) => r.data.data),
  });

export const usePartnerPayouts = () =>
  useQuery({
    queryKey: ["partner-payouts"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/partner/payouts")
        .then((r) => r.data.data),
  });

// ── Mutations ────────────────────────────────────────────────────────────────

export const usePartnerRegister = () =>
  useMutation({
    mutationFn: (business_name: string) =>
      api.post("/partner/register", { business_name }).then((r) => r.data),
  });

export const useSubmitKyc = () =>
  useMutation({
    mutationFn: (payload: {
      address: string;
      latitude: number;
      longitude: number;
      parking_type: "open" | "covered";
      accepts_two_wheeler?: boolean;
      accepts_four_wheeler?: boolean;
    }) => api.post("/partner/kyc/submit", payload).then((r) => r.data),
  });

export const usePartnerSetupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      total_slots: number;
      slot_prefix: string;
      hourly_rate: number;
      daily_rate?: number;
      monthly_pass_price?: number;
      overstay_penalty_per_hour?: number;
      qr_type?: "per_gate" | "per_slot";
      payout_method: "upi" | "bank";
      upi_id?: string;
      bank_account_name?: string;
      bank_account_number?: string;
      bank_ifsc?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      accepts_four_wheeler?: boolean;
      accepts_two_wheeler?: boolean;
    }) => api.post("/partner/setup", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-setup"] });
    },
  });
};

// Update existing facility settings (PUT /partner/setup)
export const useUpdateSetup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      hourly_rate?: number;
      daily_rate?: number;
      monthly_pass_price?: number;
      overstay_penalty_per_hour?: number;
      qr_type?: "per_gate" | "per_slot";
      payout_method?: "upi" | "bank";
      upi_id?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    }) => api.put("/partner/setup", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-setup"] });
    },
  });
};

export const usePartnerSlots = () =>
  useQuery({
    queryKey: ["partner-slots"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/partner/slots")
        .then((r) => r.data.data),
  });

export const useAddSlots = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      count: number;
      slot_prefix?: string;
      vehicle_type: "two_wheeler" | "four_wheeler";
    }) => api.post("/partner/slots", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-slots"] });
      qc.invalidateQueries({ queryKey: ["partner-setup"] });
      qc.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};

export const useUpdateSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      slotId,
      ...body
    }: {
      slotId: string;
      vehicle_type?: string;
      status?: string;
      slot_number?: string;
    }) => api.patch(`/partner/slots/${slotId}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-slots"] }),
  });
};

export const useDeleteSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) =>
      api.delete(`/partner/slots/${slotId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-slots"] });
      qc.invalidateQueries({ queryKey: ["partner-setup"] });
      qc.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};
export const usePartnerScan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { qr_data: string; scan_type: "entry" | "exit" }) =>
      api.post("/partner/scan", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-active-bookings"] });
      qc.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};

export const useVerifyBookingManual = () => {
  return useMutation({
    mutationFn: (ref: string) =>
      api.post("/partner/verify-booking", { ref }).then((r) => r.data),
  });
};

export const useConfirmManualScan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ref: string; scan_type: "entry" | "exit" }) =>
      api.post("/partner/confirm-scan", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-active-bookings"] });
      qc.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};

export const useConfirmCashExit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (booking_id: string) =>
      api
        .post("/partner/confirm-cash-exit", { booking_id })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-active-bookings"] });
      qc.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};
