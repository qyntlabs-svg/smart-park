// V-18 Invoices & Tax Docs — localStorage-backed mock store.

import { readJson, writeJson } from "@/shared/lib/storage";
import type { GstSummary, Invoice } from "./types";

const INVOICES_KEY = "partnerInvoices";

const dayMs = 86_400_000;

const SEED = (partnerId: string): Invoice[] => {
  const now = Date.now();
  const mk = (n: number, offsetDays: number, amount: number, kind: Invoice["kind"] = "invoice", status: Invoice["status"] = "paid"): Invoice => {
    const cgst = Math.round(amount * 0.09);
    const sgst = Math.round(amount * 0.09);
    return {
      id: `inv_seed_${n}`,
      number: `SP-${new Date(now - offsetDays * dayMs).getFullYear()}-${String(n).padStart(4, "0")}`,
      partnerId,
      kind,
      status,
      amount,
      cgst,
      sgst,
      igst: 0,
      total: amount + cgst + sgst,
      periodStart: new Date(now - (offsetDays + 30) * dayMs).toISOString(),
      periodEnd: new Date(now - offsetDays * dayMs).toISOString(),
      issuedAt: new Date(now - offsetDays * dayMs).toISOString(),
      gstin: "33AAACS1429P1ZW",
      downloadUrl: "#",
    };
  };
  return [
    mk(1042, 3, 24800),
    mk(1041, 33, 21050),
    mk(1040, 63, 18720),
    mk(1039, 93, 22400),
    mk(38, 30, 1180, "credit_note", "void"),
  ];
};

function load(partnerId: string): Invoice[] {
  const key = `${INVOICES_KEY}:${partnerId}`;
  const existing = readJson<Invoice[] | null>(key, null);
  if (existing) return existing;
  const seed = SEED(partnerId);
  writeJson(key, seed);
  return seed;
}

export async function listInvoices(partnerId: string): Promise<Invoice[]> {
  return load(partnerId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function getGstSummary(partnerId: string): Promise<GstSummary> {
  const now = new Date();
  const fyStart = new Date(
    now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1,
    3,
    1,
  );
  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
  const invoices = load(partnerId).filter(
    (i) =>
      i.status === "paid" &&
      new Date(i.issuedAt) >= fyStart &&
      new Date(i.issuedAt) <= fyEnd,
  );
  return {
    fyStart: fyStart.toISOString(),
    fyEnd: fyEnd.toISOString(),
    totalRevenue: invoices.reduce((n, i) => n + i.amount, 0),
    totalCgst: invoices.reduce((n, i) => n + i.cgst, 0),
    totalSgst: invoices.reduce((n, i) => n + i.sgst, 0),
    totalIgst: invoices.reduce((n, i) => n + i.igst, 0),
    totalTax: invoices.reduce((n, i) => n + i.cgst + i.sgst + i.igst, 0),
    invoiceCount: invoices.length,
  };
}
