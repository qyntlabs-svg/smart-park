
# ParkDoc — Implemented Features & End-to-End User Flow

A mobile-first React + Vite + Capacitor PWA (golden-yellow branded, `#FFC700`) that combines **Smart Parking Aggregation** with an **On-Demand Mechanic Marketplace**. Four roles are live: **Consumer, Parking Partner (Vendor), Mechanic Shop Owner, and Field Worker**, plus a light **Admin** surface.

---

## 1. Onboarding

- **Splash + Onboarding carousel** introduces the two pillars: parking discovery and mechanic services.
- **Role Selection screen** lets the user enter as Consumer, Partner, or Mechanic.
- Region context is pre-seeded around Chennai / Tambaram with mock geodata.

## 2. Authentication

- **Phone + OTP login** for every role (mock OTP `123456` in the demo build).
- Zustand-persisted session (`auth.store.ts`) with role-aware routing and a global 401 → re-login interceptor.
- **KYC gating**: Partners and Mechanics submit documents, land in a **Pending** state, and are auto-approved for demo continuity.
- Workers register via a shop-owner **invite link** (self-contained token, works across devices), upload Aadhaar + PAN, wait for owner approval.

## 3. Consumer Journey — Parking

- **Home / Discovery** with map + list of nearby parking facilities and live slot counts.
- **Location change** with LocationIQ-backed search.
- **Slot selection** (per vehicle type), **Booking summary**, and **UPI payment** via Razorpay flow.
- **Booking QR** generated per reservation, viewable offline in **Booking History**.
- **Monthly Parking Pass**: pick facility → view slots + pricing → pay via UPI → receive a **persistent QR** tied to vehicle, location and validity, viewable in **Active Pass**.
- **My Vehicles** (add / edit / delete) feeds every booking flow.

## 4. Consumer Journey — Mechanic Marketplace

- **Mechanics tab** unlocked in bottom nav: search shops by service, filter by vehicle category (Bike, Car, Auto, Commercial, EV, Bicycle).
- **Shop Detail**: photos, ratings, services + prices; owner name/phone are masked until booking is accepted (privacy layer).
- Two service modes:
  - **Shop Visit** — consumer sees shop address + one-tap Google Maps navigation; on arrival gives the shop a **static 4-digit OTP (1234)** to start service.
  - **Doorstep / Mobile Mechanic** — consumer shares **live location**, gets an itemized quote (with night surcharge logic), and is dispatched to the nearest available worker (first-accept-wins, radius-based).
- **Consumer Mechanic Bookings** screen tracks status, shows worker ETA + OTP, pays via **UPI QR** shown by the shop/worker, and captures a **post-service review**.

## 5. Mechanic Shop Owner Journey

- **Register → KYC → Pending → Setup wizard**: address, vehicle categories served, service list with own pricing, UPI ID, 2–10 shop photos.
- **Save & Go Live** → **Owner Dashboard** with real-time cards: Views, Earnings, Reviews, Open/Closed toggle.
- **Bookings** screen: tabs for New / Active / Completed, accept-reject, OTP verification to start & complete jobs, Google Maps handoff for doorstep jobs.
- **Workers**: generate invite links, review pending applicants (with documents), approve/suspend, "View as worker" for demo.
- **Reviews**: read customer reviews and post replies.
- **Constraint enforced**: owners cannot personally accept mobile-mechanic dispatches; they must register themselves as a worker to do so.

## 6. Field Worker Journey

- Opens invite link → phone + OTP → uploads Aadhaar + PAN (auto-compressed) → **Pending** → owner approves.
- **Worker Dashboard**: incoming mobile job feed, accept/reject, live navigation to consumer, **enter consumer OTP to start**, complete flow, seeded demo jobs + earnings history.
- **Worker Profile** with document + status view.

## 7. Parking Partner (Vendor) Journey

- Partner **Login → Register → KYC → Pending → Setup** (slot count, hourly/daily rates, monthly pass price, QR type per-gate/per-slot, UPI or bank payout).
- **Partner Dashboard**: occupancy %, today's revenue, active bookings, completed sessions — 30-second refresh.
- **Pin on Map** screen to place the facility.
- **QR Codes** management (per-gate / per-slot).
- **Scan** screen supporting entry/exit for regular bookings **and** monthly passes, manual booking reference lookup, and **cash-exit confirmation**.
- **Daily Log** (filter by date/status) with per-session summary.
- **Monthly Pass Management**: view active holders, configure available monthly slots, scan pass QRs.
- **Reports & Earnings**: today/week/month revenue, partner share vs. platform fee, UPI vs. cash split, payout history.
- **Invoice tab** with GST/TDS compliance data.
- **Side drawer**: Profile, Terms, Help & Support, Privacy.

## 8. Booking Flow (end-to-end, unified)

```text
Discover → Select (slot / pass / service) → Confirm summary
       → UPI payment (Razorpay) → QR issued
       → Vendor/Mechanic scans or enters OTP → Service delivered
       → Exit / Complete → Review + payout accounting
```

## 9. Payments

- **Razorpay** UPI flow for parking bookings and monthly passes.
- **UPI QR display** by mechanic shops & workers for on-the-spot service payment (UPI ID captured during setup).
- **Vendor payout tracking** with commission, platform fee, GST and TDS breakdown.
- Cash-exit confirmation path for offline parking payments.

## 10. Profile, Notifications, Reviews

- **Consumer Profile**: edit profile, vehicles, help & support, terms, privacy, logout.
- **Notifications**: in-app notification center; Firebase Cloud Messaging service worker registered for web push (VAPID configured).
- **Reviews**:
  - Parking: post-session ratings feed the facility.
  - Mechanic: consumer reviews after service; shop owner can reply; reviews tag serviced-by-worker where applicable.

## 11. Admin Capabilities (light surface)

- **Admin Dashboard** shell.
- **Mobile Pricing** screen to configure platform-wide base rates and night surcharge for the on-demand mechanic dispatch engine.

---

## What this demonstrates to investors

- **Two revenue engines in one super-app** — recurring parking (bookings + monthly passes) and transactional mechanic services (in-shop + on-demand).
- **Full four-sided marketplace already wired**: Consumer ↔ Partner ↔ Mechanic Shop ↔ Field Worker, with Admin oversight.
- **Trust & safety primitives** live: KYC gating, masked contact info, Uber-style static OTP verification, document review, suspend flows.
- **Monetization plumbing** live: UPI payments, commission splits, GST/TDS invoicing, payout tracking.
- **Operational depth** on the supply side: QR scanning, cash reconciliation, daily logs, occupancy analytics, worker dispatch with first-accept-wins radius logic.

> Note: Current build is a **frontend + mock-data Phase 2 prototype** (Zustand + localStorage). Backend contracts (Supabase / custom API) are stubbed via `src/api/*` hooks and ready to be pointed at production services.

---

### Next step

Approve this summary to lock the narrative, or tell me which sections to expand (e.g., screen inventory, tech stack deep-dive, monetization model) and I'll refine before any code changes.
