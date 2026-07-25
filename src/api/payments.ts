import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

interface CreateOrderPayload {
  amount: number;
  currency?: string;
  booking_id?: string | null;
  pass_id?: string | null;
}

interface CreateOrderResponse {
  id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  booking_id?: string | null;
  pass_id?: string | null;
}

interface CashConfirmPayload {
  booking_id: string;
  amount: number;
}

export const useCreateOrder = () =>
  useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      api
        .post<{
          success: boolean;
          data: CreateOrderResponse;
        }>("/payments/razorpay/order", payload)
        .then((r) => r.data.data),
  });

export const useVerifyPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) =>
      api
        .post<{
          success: boolean;
          data: any;
        }>("/payments/razorpay/verify", payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useConfirmCash = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CashConfirmPayload) =>
      api.post("/payments/cash/confirm", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const usePaymentHistory = () =>
  useQuery({
    queryKey: ["payment-history"],
    queryFn: () =>
      api
        .get<{ success: boolean; data: any[] }>("/payments/history")
        .then((r) => r.data.data),
  });
