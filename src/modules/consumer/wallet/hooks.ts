// React-query hooks for the wallet + refunds modules.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCardMethod,
  addUpiMethod,
  advanceRefundStatus,
  createRefundRequest,
  listPaymentMethods,
  listRefundRequests,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "./store";
import type { CardMethod, RefundReason, RefundStatus } from "./types";

const KEYS = {
  methods: ["wallet-methods"] as const,
  refunds: (userId: string) => ["wallet-refunds", userId] as const,
};

export const usePaymentMethods = () =>
  useQuery({ queryKey: KEYS.methods, queryFn: () => listPaymentMethods() });

export const useAddUpiMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addUpiMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.methods }),
  });
};

export const useAddCardMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      last4: string;
      brand: CardMethod["brand"];
      expMonth: number;
      expYear: number;
      holderName: string;
      label?: string;
    }) => addCardMethod(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.methods }),
  });
};

export const useRemovePaymentMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removePaymentMethod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.methods }),
  });
};

export const useSetDefaultPaymentMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultPaymentMethod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.methods }),
  });
};

export const useRefundRequests = (userId: string | undefined) =>
  useQuery({
    queryKey: KEYS.refunds(userId ?? ""),
    queryFn: () => listRefundRequests(userId!),
    enabled: !!userId,
  });

export const useCreateRefundRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      bookingRef: string;
      bookingTitle: string;
      amount: number;
      reason: RefundReason;
      detail?: string;
    }) => createRefundRequest(input),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: KEYS.refunds(vars.userId) }),
  });
};

export const useAdvanceRefundStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: RefundStatus; note?: string }) =>
      advanceRefundStatus(input.id, input.status, input.note),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["wallet-refunds"] }),
  });
};
