// Mechanic OS — desktop-console specific data (inventory, estimates,
// invoices, bays, reminders). Kept separate from the mobile mechanic app
// store so the OS surface can evolve independently.
//
// Same mock-first pattern as `ev/`, `rental/`, `tow/`: localStorage-backed
// today, swap for API later.

import { makeId, readJson, writeJson } from "@/shared/lib/storage";

// ---------- Inventory ----------

export interface InventoryPart {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  supplierUrl?: string;
  stock: number;
  reorderAt: number;
  costPerUnit: number;
  updatedAt: string;
}

const INV_KEY = "mosInventory";

const SEED_INVENTORY: InventoryPart[] = [
  {
    id: "part-1",
    sku: "OIL-5W30-1L",
    name: "Engine Oil 5W-30 (1L)",
    category: "Oils & Fluids",
    supplier: "Castrol India",
    supplierUrl: "https://castrol.com",
    stock: 24,
    reorderAt: 10,
    costPerUnit: 480,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "part-2",
    sku: "BRK-PAD-STD",
    name: "Standard Brake Pad Set",
    category: "Brakes",
    supplier: "Bosch Automotive",
    supplierUrl: "https://bosch.in",
    stock: 6,
    reorderAt: 8,
    costPerUnit: 1250,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "part-3",
    sku: "BAT-12V-45AH",
    name: "12V 45Ah Battery",
    category: "Electricals",
    supplier: "Exide Industries",
    stock: 3,
    reorderAt: 5,
    costPerUnit: 4200,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "part-4",
    sku: "TYR-165-14",
    name: "Tyre 165/14",
    category: "Tyres",
    supplier: "MRF Wheels",
    stock: 12,
    reorderAt: 6,
    costPerUnit: 3800,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "part-5",
    sku: "AC-GAS-R134A",
    name: "AC Gas R134a (canister)",
    category: "AC",
    supplier: "SRF Ltd",
    stock: 15,
    reorderAt: 8,
    costPerUnit: 950,
    updatedAt: new Date().toISOString(),
  },
];

export function listInventory(): InventoryPart[] {
  const existing = readJson<InventoryPart[] | null>(INV_KEY, null);
  if (existing) return existing;
  writeJson(INV_KEY, SEED_INVENTORY);
  return SEED_INVENTORY;
}

export function saveInventory(list: InventoryPart[]) {
  writeJson(INV_KEY, list);
}

export function updateInventoryPart(
  id: string,
  patch: Partial<InventoryPart>,
): InventoryPart | null {
  const list = listInventory();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  saveInventory(list);
  return list[idx];
}

// ---------- Estimates ----------

export type EstimateStatus =
  | "draft"
  | "sent"
  | "approved"
  | "declined"
  | "expired";

export interface EstimateLine {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
}

export interface Estimate {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleLabel: string;
  vin?: string;
  lines: EstimateLine[];
  subtotal: number;
  tax: number;
  total: number;
  status: EstimateStatus;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
  notes?: string;
}

const EST_KEY = "mosEstimates";

const SEED_ESTIMATES: Estimate[] = seedEstimates();

function seedEstimates(): Estimate[] {
  const lines = (l: EstimateLine[]): { subtotal: number; tax: number; total: number } => {
    const subtotal = l.reduce((s, x) => s + x.unitPrice * x.qty, 0);
    const tax = Math.round(subtotal * 0.18);
    return { subtotal, tax, total: subtotal + tax };
  };
  const items: Estimate[] = [
    {
      id: "est-1",
      customerName: "Anitha Sundar",
      customerPhone: "+91 98400 55501",
      vehicleLabel: "Hyundai i20 · TN 11 KL 4567",
      lines: [
        { id: "l1", label: "Front brake pad replacement", qty: 1, unitPrice: 2400 },
        { id: "l2", label: "Brake fluid top-up", qty: 1, unitPrice: 300 },
      ],
      status: "sent",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      subtotal: 0,
      tax: 0,
      total: 0,
    },
    {
      id: "est-2",
      customerName: "Vikram Reddy",
      customerPhone: "+91 98400 55502",
      vehicleLabel: "Maruti Baleno · TN 22 EV 8890",
      lines: [{ id: "l1", label: "Full periodic service (10k km)", qty: 1, unitPrice: 4800 }],
      status: "approved",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      respondedAt: new Date(Date.now() - 60 * 60000).toISOString(),
      subtotal: 0,
      tax: 0,
      total: 0,
    },
    {
      id: "est-3",
      customerName: "Priya Krishnan",
      customerPhone: "+91 98400 55503",
      vehicleLabel: "Honda Activa · TN 04 AB 1122",
      lines: [
        { id: "l1", label: "Rear tyre replacement", qty: 1, unitPrice: 1800 },
        { id: "l2", label: "Chain lube service", qty: 1, unitPrice: 250 },
      ],
      status: "draft",
      createdAt: new Date().toISOString(),
      subtotal: 0,
      tax: 0,
      total: 0,
    },
  ];
  return items.map((e) => ({ ...e, ...lines(e.lines) }));
}

export function listEstimates(): Estimate[] {
  const existing = readJson<Estimate[] | null>(EST_KEY, null);
  if (existing) return existing;
  writeJson(EST_KEY, SEED_ESTIMATES);
  return SEED_ESTIMATES;
}

export function saveEstimates(list: Estimate[]) {
  writeJson(EST_KEY, list);
}

export function updateEstimate(
  id: string,
  patch: Partial<Estimate>,
): Estimate | null {
  const list = listEstimates();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const next = { ...list[idx], ...patch };
  list[idx] = next;
  saveEstimates(list);
  return next;
}

export function createEstimate(
  input: Omit<Estimate, "id" | "createdAt" | "subtotal" | "tax" | "total">,
): Estimate {
  const subtotal = input.lines.reduce(
    (s, l) => s + l.unitPrice * l.qty,
    0,
  );
  const tax = Math.round(subtotal * 0.18);
  const e: Estimate = {
    ...input,
    id: makeId("est"),
    createdAt: new Date().toISOString(),
    subtotal,
    tax,
    total: subtotal + tax,
  };
  const list = listEstimates();
  list.unshift(e);
  saveEstimates(list);
  return e;
}

// ---------- Invoices ----------

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerGstin?: string;
  vehicleLabel: string;
  lines: EstimateLine[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  issuedAt: string;
  paidAt?: string;
  status: "issued" | "paid" | "cancelled";
}

const INV2_KEY = "mosInvoices";

function seedInvoices(): Invoice[] {
  const mk = (
    n: number,
    days: number,
    lines: EstimateLine[],
    paid: boolean,
  ): Invoice => {
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const cgst = Math.round(subtotal * 0.09);
    const sgst = cgst;
    return {
      id: `inv-seed-${n}`,
      invoiceNumber: `SP/24-25/${String(1000 + n).padStart(4, "0")}`,
      customerName: `Customer ${n}`,
      customerPhone: `+91 98765 ${String(30000 + n).padStart(5, "0")}`,
      vehicleLabel: `Vehicle #${n}`,
      lines,
      subtotal,
      cgst,
      sgst,
      total: subtotal + cgst + sgst,
      issuedAt: new Date(Date.now() - days * 86400000).toISOString(),
      paidAt: paid ? new Date(Date.now() - days * 86400000 + 3600000).toISOString() : undefined,
      status: paid ? "paid" : "issued",
    };
  };
  return [
    mk(
      1,
      1,
      [{ id: "l", label: "Full periodic service", qty: 1, unitPrice: 4800 }],
      true,
    ),
    mk(
      2,
      3,
      [{ id: "l", label: "Brake pad replacement", qty: 1, unitPrice: 2400 }],
      true,
    ),
    mk(
      3,
      7,
      [
        { id: "l1", label: "Battery replacement", qty: 1, unitPrice: 4200 },
        { id: "l2", label: "Labour", qty: 1, unitPrice: 300 },
      ],
      false,
    ),
  ];
}

export function listInvoices(): Invoice[] {
  const existing = readJson<Invoice[] | null>(INV2_KEY, null);
  if (existing) return existing;
  const seed = seedInvoices();
  writeJson(INV2_KEY, seed);
  return seed;
}

export function saveInvoices(list: Invoice[]) {
  writeJson(INV2_KEY, list);
}

export function createInvoiceFromEstimate(est: Estimate): Invoice {
  const cgst = Math.round(est.subtotal * 0.09);
  const sgst = cgst;
  const list = listInvoices();
  const inv: Invoice = {
    id: makeId("inv"),
    invoiceNumber: `SP/24-25/${String(2000 + list.length).padStart(4, "0")}`,
    customerName: est.customerName,
    customerPhone: est.customerPhone,
    vehicleLabel: est.vehicleLabel,
    lines: est.lines,
    subtotal: est.subtotal,
    cgst,
    sgst,
    total: est.subtotal + cgst + sgst,
    issuedAt: new Date().toISOString(),
    status: "issued",
  };
  list.unshift(inv);
  saveInvoices(list);
  return inv;
}

// ---------- Bay scheduling ----------

export interface BaySlot {
  id: string;
  bayId: string;
  technicianId?: string;
  technicianName?: string;
  startISO: string;
  durationMin: number;
  customerName: string;
  service: string;
  vehicleLabel: string;
}

const BAY_KEY = "mosBaySchedule";

const DEFAULT_BAYS = [
  { id: "bay-1", label: "Bay 1 · General" },
  { id: "bay-2", label: "Bay 2 · General" },
  { id: "bay-3", label: "Bay 3 · Alignment" },
  { id: "bay-4", label: "Bay 4 · Detailing" },
];

const seedBaySlots = (): BaySlot[] => {
  const today = new Date();
  today.setHours(9, 0, 0, 0);
  const at = (bay: string, hOffset: number, min = 60): string => {
    const d = new Date(today);
    d.setHours(d.getHours() + hOffset);
    return d.toISOString();
  };
  return [
    {
      id: "slot-1",
      bayId: "bay-1",
      technicianName: "Karthik R.",
      startISO: at("", 0),
      durationMin: 60,
      customerName: "Anitha S.",
      service: "Brake pads",
      vehicleLabel: "Hyundai i20",
    },
    {
      id: "slot-2",
      bayId: "bay-2",
      technicianName: "Prakash M.",
      startISO: at("", 1),
      durationMin: 90,
      customerName: "Vikram R.",
      service: "Full service",
      vehicleLabel: "Maruti Baleno",
    },
    {
      id: "slot-3",
      bayId: "bay-3",
      technicianName: "Sneha D.",
      startISO: at("", 3),
      durationMin: 60,
      customerName: "Divya R.",
      service: "Wheel alignment",
      vehicleLabel: "Honda City",
    },
    {
      id: "slot-4",
      bayId: "bay-1",
      technicianName: "Karthik R.",
      startISO: at("", 4),
      durationMin: 120,
      customerName: "Mohan K.",
      service: "AC service",
      vehicleLabel: "Toyota Innova",
    },
  ];
};

export function listBays() {
  return DEFAULT_BAYS;
}

export function listBaySlots(): BaySlot[] {
  const existing = readJson<BaySlot[] | null>(BAY_KEY, null);
  if (existing) return existing;
  const seed = seedBaySlots();
  writeJson(BAY_KEY, seed);
  return seed;
}

// ---------- Reminders / Loyalty ----------

export interface ServiceReminder {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleLabel: string;
  lastServiceISO: string;
  nextDueISO: string;
  reason: string;
  status: "pending" | "sent" | "booked";
}

const REM_KEY = "mosReminders";

const SEED_REMINDERS: ServiceReminder[] = [
  {
    id: "rem-1",
    customerName: "Arjun Mehta",
    customerPhone: "+91 98401 23456",
    vehicleLabel: "Ford EcoSport",
    lastServiceISO: new Date(Date.now() - 150 * 86400000).toISOString(),
    nextDueISO: new Date(Date.now() + 5 * 86400000).toISOString(),
    reason: "10,000 km periodic service",
    status: "pending",
  },
  {
    id: "rem-2",
    customerName: "Sneha Iyer",
    customerPhone: "+91 87543 21098",
    vehicleLabel: "Honda City",
    lastServiceISO: new Date(Date.now() - 30 * 86400000).toISOString(),
    nextDueISO: new Date(Date.now() + 60 * 86400000).toISOString(),
    reason: "PUC certificate expiring",
    status: "sent",
  },
  {
    id: "rem-3",
    customerName: "Karthik S.",
    customerPhone: "+91 90030 44556",
    vehicleLabel: "TVS Apache",
    lastServiceISO: new Date(Date.now() - 90 * 86400000).toISOString(),
    nextDueISO: new Date(Date.now() - 5 * 86400000).toISOString(),
    reason: "Overdue: chain & sprocket",
    status: "pending",
  },
];

export function listReminders(): ServiceReminder[] {
  const existing = readJson<ServiceReminder[] | null>(REM_KEY, null);
  if (existing) return existing;
  writeJson(REM_KEY, SEED_REMINDERS);
  return SEED_REMINDERS;
}

export function updateReminder(
  id: string,
  patch: Partial<ServiceReminder>,
): ServiceReminder | null {
  const list = listReminders();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  writeJson(REM_KEY, list);
  return list[idx];
}

// ---------- Recalls ----------

export interface RecallEntry {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  campaign: string;
  severity: "high" | "medium" | "low";
  description: string;
  openedAt: string;
}

// Static mock catalogue (no persist needed).
export const RECALL_CATALOGUE: RecallEntry[] = [
  {
    id: "rc-1",
    vin: "MA3EYD81S00123456",
    make: "Maruti Suzuki",
    model: "Swift",
    year: 2021,
    campaign: "SW-2023-BRK",
    severity: "high",
    description: "Front brake booster hose may crack under vibration.",
    openedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "rc-2",
    vin: "MA3EYD81S00543210",
    make: "Hyundai",
    model: "Creta",
    year: 2022,
    campaign: "HY-2024-ECU",
    severity: "medium",
    description: "ECU firmware update recommended for cold-start stalling.",
    openedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "rc-3",
    vin: "MA3EYD81S00999888",
    make: "Tata",
    model: "Nexon EV",
    year: 2023,
    campaign: "TT-2024-BAT",
    severity: "high",
    description: "Battery pack coolant sensor recall.",
    openedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "rc-4",
    vin: "MA3EYD81S00777666",
    make: "Honda",
    model: "City",
    year: 2020,
    campaign: "HN-2023-AB",
    severity: "low",
    description: "Airbag inflator preventive replacement.",
    openedAt: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
];
