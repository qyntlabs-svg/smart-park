// V-18 Invoices & Tax Docs — domain types.

export type InvoiceStatus = "paid" | "unpaid" | "void";
export type InvoiceKind = "invoice" | "credit_note" | "gst_report";

export interface Invoice {
  id: string;
  number: string;
  partnerId: string;
  kind: InvoiceKind;
  status: InvoiceStatus;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  gstin?: string;
  downloadUrl?: string;
}

export interface GstSummary {
  fyStart: string;
  fyEnd: string;
  totalRevenue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  invoiceCount: number;
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  void: "Void",
};

export const INVOICE_KIND_LABEL: Record<InvoiceKind, string> = {
  invoice: "Invoice",
  credit_note: "Credit Note",
  gst_report: "GST Report",
};
