import { useQuery } from "@tanstack/react-query";
import { getGstSummary, listInvoices } from "./store";

export const useInvoices = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-invoices", partnerId],
    queryFn: () => listInvoices(partnerId!),
    enabled: !!partnerId,
  });

export const useGstSummary = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-gst-summary", partnerId],
    queryFn: () => getGstSummary(partnerId!),
    enabled: !!partnerId,
  });
