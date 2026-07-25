# Screen Inventory & Information Architecture Map

_Mobility platform planning deliverable. Not a spec, not an implementation plan — a map of every screen the product could ever contain, grouped by actor surface and phased against a wedge-first rollout._

---

## 1. Executive Summary

- **Positioning:** "Infrastructure Coordination Layer for mobility." A neutral network that sits above charging operators, parking vendors, mechanic shops, tow operators, and fleets — *not* a super-app, *not* an asset owner.
- **Wedge:** **Charging reservation in one city.** All P0 screens exist to make one flow work: a consumer reserves a charger, arrives, plugs in, pays, and rates. Everything else is a layer added on top of that wedge.
- **Composition rule:** every screen must compose from the 10 **Mobility Kernel primitives** (Reservation, Vehicle, Provider, Payment, Location, Availability, Pricing, Notification, Identity, Review). This is the single most important discipline in this doc.
- **Actor surfaces covered (13):** Consumer, Vendor/Partner, Mechanic + Mechanic OS, Worker, Admin, Fleet OS, Tow/SOS Operator, Charging Operator SaaS, Mobility Intelligence, Vehicle Identity Platform, Developer Portal, AI Concierge (embedded), Growth/Onboarding (embedded).
- **Phasing:** Phase 0 (0–3 mo) = charging wedge. Phase 1 (3–9 mo) = parking + rental + mechanic layered onto the wedge. Phase 2 (9–18 mo) = SaaS surfaces for operators + habit loops. Phase 3 (18+ mo) = Fleet OS, Mobility Intelligence, Developer Portal.
- **How to read this doc:** IA map → primitives → one table per actor surface (with per-screen priority) → cross-actor flows → phased roadmap → out-of-scope → open questions.
- **Statuses used:** _Existing_ (already in `src/pages/`), _In-flight_ (being added by the parallel refactor: EV charging, parking rental, `src/modules/*` restructure), _New_ (proposed here, not yet built).

---

## 2. IA Map (ASCII)

```
Mobility Platform
├── Client-side apps (mobile-first, Capacitor + React)
│   ├── Consumer app
│   │   ├── Discovery
│   │   │   ├── Parking (map + list + search)
│   │   │   ├── Charging (EV tab)                [in-flight]
│   │   │   ├── Rental (long-stay parking)       [in-flight]
│   │   │   ├── Mechanic shops
│   │   │   └── Mobile mechanic / SOS / Tow
│   │   ├── Reserve → Pay → Access (QR / OTP / plug-in)
│   │   ├── History (bookings, sessions, invoices)
│   │   ├── Vehicles (garage)
│   │   ├── Wallet (methods, receipts, refunds)
│   │   ├── Profile & settings
│   │   ├── AI Concierge (proactive + on-demand)
│   │   └── Habits (health score, savings, streaks)
│   ├── Vendor / Partner app (parking + EV + rental)
│   │   ├── Onboarding (Register → KYC → Pending → Setup)
│   │   ├── Live operations (dashboard, scan, occupancy)
│   │   ├── Inventory (slots, chargers, rentals, passes)
│   │   ├── Pricing & payouts
│   │   └── Reports
│   ├── Mechanic app (shop owner)
│   │   ├── Onboarding
│   │   ├── Bookings (in-shop + mobile)
│   │   ├── Workers (invite / assign)
│   │   ├── Reviews
│   │   └── Bridge to Mechanic OS (desktop / tablet)
│   ├── Worker app (mechanic employee)
│   │   ├── Available jobs
│   │   ├── Assigned jobs
│   │   ├── Earnings
│   │   └── Profile
│   └── Tow / SOS Operator app
│       ├── Live dispatch queue
│       ├── Job detail (nav + status)
│       ├── Proof-of-service
│       └── Earnings
│
├── Console-side surfaces (desktop-first, responsive)
│   ├── Admin console (platform ops)
│   ├── Mechanic OS (shop CRM + inspections + inventory + billing)
│   ├── Charging Operator SaaS (station uptime, remote start/stop, pricing)
│   ├── Fleet OS (B2B fleet dashboard, drivers, energy, maintenance)
│   ├── Mobility Intelligence (analytics, heatmaps, demand forecasts)
│   ├── Vehicle Identity Platform (service history, ownership, docs)
│   └── Developer Portal (API console, keys, webhooks, sandbox)
│
└── Cross-cutting
    ├── AI Concierge (embedded in Consumer + Fleet + Mechanic OS)
    ├── Notification center (push, email, SMS, in-app)
    ├── Identity (SSO across actor apps + KYC)
    └── Growth (onboarding, referrals, subscriptions)
```

---

## 3. Primitives (Mobility Kernel) — cross-cutting

Every screen below composes from these 10 primitives. If a proposed screen doesn't map cleanly to one or more of these, it probably shouldn't exist yet.

- **Reservation** — future-tense hold on a resource (charger slot, parking bay, mechanic time-slot, tow truck ETA). Has state machine: `requested → confirmed → active → completed | cancelled | no-show`.
- **Vehicle** — a car / bike / scooter owned or driven by a consumer or fleet. Carries make/model, plate, VIN, fuel type (EV/ICE/hybrid), connector type, battery kWh.
- **Provider** — anyone offering supply: parking vendor, EV operator, mechanic shop, tow operator, fleet-owned depot. Has KYC, payout account, hours, ratings.
- **Payment** — money movement. Wraps UPI, cards, wallet, corporate invoice, split payouts, refunds, disputes.
- **Location** — a geo point + address + polygon (facility footprint). Powers map, search, geofencing, arrival detection.
- **Availability** — real-time inventory: how many slots free, which chargers online, mechanic bays open now. Also predicted (Waze-style crowdsourced + historical).
- **Pricing** — rules engine: hourly, per-kWh, per-day, per-week, per-month, surge, subsidies, corporate rate cards, promotions.
- **Notification** — outbound comms: push, email, SMS, in-app. Also inbound alerts to operators (charger offline, no-show, dispute).
- **Identity** — who is this actor: consumer login, partner login, mechanic login, worker invite token, admin RBAC, fleet SSO.
- **Review** — trust signals: consumer rates provider, provider rates consumer (no-show), platform aggregates.

---

## 4. Screen Inventory

### 4.1 Consumer app

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| C-01 | Splash | Boot / auth check / route to onboarding or home | Existing | Identity | P0 | `SplashScreen.tsx`. Keep. |
| C-02 | Onboarding | 3–4 slides pitching charging + parking + mechanic value | Existing | — | P0 | `OnboardingScreen.tsx`. Rewrite copy around charging wedge for Phase 0. |
| C-03 | Role Picker | Consumer vs Partner vs Mechanic vs Worker entry point | Existing | Identity | P0 | `RolePickerScreen.tsx` / `RoleSelectionScreen.tsx`. Consolidate to one. |
| C-04 | Login (OTP) | Phone-OTP auth for consumer | Existing | Identity | P0 | `LoginScreen.tsx`. Add email/passkey fallback in Phase 2. |
| C-05 | Add Vehicle | Register a car/bike in the garage | Existing | Vehicle, Identity | P0 | `AddVehicleScreen.tsx`. Add EV connector type + battery kWh field in Phase 0. |
| C-06 | Edit Vehicle | Modify vehicle details | Existing | Vehicle | P0 | `EditVehicleScreen.tsx`. |
| C-07 | Vehicle Added (success) | Confirmation state | Existing | Vehicle | P1 | `VehicleAddedScreen.tsx`. Consider collapsing into inline toast. |
| C-08 | My Vehicles | List/manage garage | Existing | Vehicle | P0 | `MyVehiclesScreen.tsx`. |
| C-09 | Home — Parking map + list + search | Discover parking near me | Existing | Location, Availability, Provider, Pricing | P1 | `HomeScreen.tsx`. In Phase 0 the app opens on Charging tab, not this one. |
| C-10 | Home — Charging tab (map + list) | Discover chargers, filter by connector/kW/price | In-flight | Location, Availability, Provider, Pricing | **P0** | New tab from the refactor. **This is the wedge screen.** |
| C-11 | Home — Rental tab | Discover long-stay parking (day/week/month) | In-flight | Location, Availability, Pricing, Provider | P1 | Refactor is adding this. |
| C-12 | Change Location | Manually override the "near me" anchor | Existing | Location | P1 | `ChangeLocationScreen.tsx`. |
| C-13 | Slot Selection (parking) | Pick specific bay in a facility | Existing | Availability, Reservation | P1 | `SlotSelectionScreen.tsx`. |
| C-14 | Charger Selection | Pick specific charger (connector, kW) in a station | New | Availability, Reservation, Provider | **P0** | Must reference Availability + Reservation. Show queue if none free. |
| C-15 | Rental Facility Detail | See amenities, photos, tier prices, availability calendar | New | Provider, Availability, Pricing | P1 | Composed from Provider + Pricing. |
| C-16 | Booking Summary | Confirm date/time/price before pay | Existing | Reservation, Pricing, Vehicle | P0 | `BookingSummaryScreen.tsx`. Extend for charging + rental. |
| C-17 | UPI Payment | Pay via UPI intent / QR / card | Existing | Payment | P0 | `UpiPaymentScreen.tsx`. Abstract behind Payment primitive so we can add cards, wallet, Apple/Google Pay. |
| C-18 | Booking QR / Access Code | Show QR / OTP for entry-exit or plug-in auth | Existing | Reservation, Identity | P0 | `BookingQrScreen.tsx`. Also becomes "start charging" auth token in Phase 0. |
| C-19 | Selection Success | Confirmation screen after booking | Existing | Reservation, Notification | P1 | `SelectionSuccessScreen.tsx`. Collapse into C-18 if possible. |
| C-20 | Active Charging Session | Live view: kW draw, kWh, cost so far, ETA to target SOC | New | Reservation, Availability, Pricing, Notification | **P0** | Must exist for wedge. Poll charger telemetry via CO-04. |
| C-21 | Active Parking Session | Live view: elapsed time, cost, remote extend | New | Reservation, Pricing, Notification | P1 | Analogous to C-20 for parking. |
| C-22 | Booking History | Past bookings across parking + charging + mechanic + rental | Existing | Reservation, Payment, Review | P0 | `BookingHistoryScreen.tsx`. Add filter tabs per booking type. |
| C-23 | Booking Detail + Receipt | Per-booking detail, invoice, refund request, re-book | New | Reservation, Payment, Review | P0 | Consolidates today's fragmented flows. |
| C-24 | Wallet / Payment Methods | Manage saved UPI, cards, corp cards | New | Payment, Identity | P1 | Prereq for one-tap re-book. |
| C-25 | Refunds & Disputes | Raise refund, track status | New | Payment, Reservation | P1 | Trust-critical. Ties to Admin queue. |
| C-26 | Profile | Consumer profile home | Existing | Identity | P0 | `ProfileScreen.tsx`. |
| C-27 | Edit Profile | Modify name, email, avatar | Existing | Identity | P1 | `EditProfileScreen.tsx`. |
| C-28 | Notifications | Inbox of push/system messages | Existing | Notification | P1 | `NotificationsScreen.tsx`. |
| C-29 | Help & Support | Contact, FAQ, chat, live SOS shortcut | Existing | — | P1 | `HelpSupportScreen.tsx`. Add SOS entry in Phase 1. |
| C-30 | Terms & Privacy | Legal | Existing | — | P0 | `TermsPrivacyScreen.tsx`. |
| C-31 | About | App version, credits | Existing | — | P2 | `AboutScreen.tsx`. |
| C-32 | Monthly Pass (buy) | Purchase a monthly parking pass at a facility | Existing | Reservation, Pricing, Payment | P1 | `MonthlyPassScreen.tsx`. |
| C-33 | Active Pass | View + manage active monthly pass | Existing | Reservation | P1 | `ActivePassScreen.tsx`. |
| C-34 | EV Subscription / Membership | Monthly kWh bundle across networks | New | Pricing, Payment, Reservation | P2 | Netflix-pattern subscription for EV drivers. |
| C-35 | Mechanics list | Discover mechanic shops near me | Existing | Location, Provider, Availability | P1 | `MechanicsScreen.tsx`. |
| C-36 | Mechanic Shop Detail | Shop profile, services, reviews, book slot | Existing | Provider, Pricing, Review, Availability | P1 | `MechanicShopDetailScreen.tsx`. |
| C-37 | Consumer Mechanic Bookings | Past + upcoming mechanic bookings | Existing | Reservation, Review | P1 | `ConsumerMechanicBookingsScreen.tsx`. Later fold into C-22. |
| C-38 | Mobile Mechanic Request | Request a mechanic to come to me | Existing | Provider, Location, Reservation, Pricing | P1 | `ConsumerMobileMechanicRequestScreen.tsx`. |
| C-39 | Mobile Mechanic Status | Live tracker of worker en route | Existing | Reservation, Location, Notification | P1 | `ConsumerMobileMechanicStatusScreen.tsx`. Uber-style. |
| C-40 | Shop (add-on store) | Buy accessories / services in-app | Existing | Payment, Provider | P3 | `ShopScreen.tsx`. Deprioritize. |
| C-41 | SOS Home | Big red button + situation picker (breakdown, flat, tow, accident, out-of-charge) | New | Provider, Location, Reservation, Notification | P1 | Uber-style dispatch. Ties to Tow/SOS Operator app. |
| C-42 | SOS / Tow Live Status | Truck en route, ETA, driver identity, share trip | New | Reservation, Location, Notification, Identity | P1 | Live map + share link. |
| C-43 | AI Concierge — Chat | Ask "cheapest fast charger before airport" | New | Location, Availability, Pricing, Provider, Reservation | P1 | LLM-backed, tools call primitives. |
| C-44 | AI Concierge — Proactive Card Feed | "You'll reach with 12% — I reserved a charger" | New | Reservation, Location, Availability, Notification | P1 | Home surface. Duolingo-pattern habit anchor. |
| C-45 | Journey Planner | "Plan trip A→B with charging stops + parking at destination" | New | Location, Availability, Reservation, Pricing | P2 | Google-Maps-pattern. Multi-provider itinerary. |
| C-46 | One-Tap Journey | Recreate a recent journey with one tap | New | Reservation, Payment, Vehicle | P2 | Amazon-1-click for mobility. |
| C-47 | Vehicle Health Score | Duolingo-style score based on service history + telematics | New | Vehicle, Identity, Review | P2 | Habit surface. |
| C-48 | Energy / Fuel Efficiency Insights | Monthly kWh, cost/km, savings vs baseline | New | Vehicle, Payment, Reservation | P2 | Bloomberg-lite personal dashboard. |
| C-49 | Monthly Savings Summary | "You saved ₹1,240 this month" | New | Payment, Reservation | P2 | Habit-forming, shareable. |
| C-50 | Streaks & Milestones | Consecutive weeks of app use, milestones unlocked | New | Identity, Review | P3 | Duolingo pattern. Optional. |
| C-51 | Referral | Invite friends, share code, track credits | New | Identity, Payment | P1 | Airbnb-style growth loop. |
| C-52 | Vehicle Identity — My Car | Full service history, docs, insurance, ownership | New | Vehicle, Identity, Review, Provider | P2 | Consumer face of VIP-*. Salesforce pattern. |
| C-53 | Roaming / Cross-network Status | "Charging you started on Network X is billed via us" | New | Provider, Payment, Reservation | P2 | Visa-pattern neutrality made visible. |
| C-54 | Notification Preferences | Per-channel + per-topic controls | New | Notification, Identity | P1 | Trust + retention. |
| C-55 | Multi-vehicle Family Sharing | Share a vehicle / wallet with household | New | Vehicle, Identity, Payment | P3 | Apple-Family pattern. |

**Consumer count: 55 screens (30 Existing/In-flight, 25 New).**

---

### 4.2 Vendor / Partner app (parking + EV station + rental)

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| V-01 | Login | Vendor auth | Existing | Identity | P0 | `PartnerLoginScreen.tsx`. |
| V-02 | Register | Sign up as a parking / EV / rental vendor | Existing | Identity, Provider | P0 | `PartnerRegisterScreen.tsx`. |
| V-03 | KYC | Upload business docs + owner ID | Existing | Identity, Provider | P0 | `PartnerKycScreen.tsx`. |
| V-04 | Pending Approval | Waiting-on-admin state | Existing | Identity | P0 | `PartnerPendingScreen.tsx`. |
| V-05 | Setup (multi-step) | Slots, address, pricing, payouts wizard | Existing | Provider, Location, Pricing, Payment, Availability | P0 | `PartnerSetupScreen.tsx`. Extend for EV chargers + rental tiers. |
| V-06 | Dashboard | Live occupancy, today's earnings, active bookings | Existing | Reservation, Availability, Payment | P0 | `PartnerDashboardScreen.tsx`. |
| V-07 | Scan (entry/exit) | Scan consumer QR to open/close a session | Existing | Reservation, Identity | P0 | `PartnerScanScreen.tsx`. |
| V-08 | QR Codes | Print / regenerate facility QR codes | Existing | Provider | P1 | `PartnerQrCodesScreen.tsx`. |
| V-09 | Daily Log | Manual log of walk-ins vs app bookings | Existing | Reservation, Availability | P1 | `PartnerDailyLogScreen.tsx`. |
| V-10 | Reports | Earnings / occupancy / no-show reports | Existing | Payment, Reservation, Review | P1 | `PartnerReportsScreen.tsx`. |
| V-11 | Pin Map (facility footprint) | Draw / adjust facility polygon on map | Existing | Location, Provider | P1 | `PartnerPinMapScreen.tsx`. |
| V-12 | Monthly Passes | Manage monthly pass tiers + subscribers | Existing | Pricing, Reservation, Payment | P1 | `PartnerMonthlyPassScreen.tsx`. |
| V-13 | EV Station Setup | Add chargers per station (connector, kW, price) | In-flight | Provider, Availability, Pricing | **P0** | Refactor is adding. Wedge-critical. |
| V-14 | EV Station Live | Real-time charger status (available / in-use / offline) | In-flight | Availability, Reservation, Notification | **P0** | Vendor-facing side of C-20. |
| V-15 | Rental Listing Setup | Configure rental tiers (day/week/month) per facility | In-flight | Pricing, Availability, Provider | P1 | Refactor is adding. |
| V-16 | Rental Bookings | List of active + upcoming rental reservations | In-flight | Reservation, Payment | P1 | |
| V-17 | Payouts | Bank / UPI payout schedule, statements | New | Payment | P0 | Stripe-Connect-pattern. |
| V-18 | Invoices & Tax Docs | Downloadable invoices, GST reports | New | Payment | P1 | Regulatory-critical in IN. |
| V-19 | Disputes Inbox | Consumer disputes escalated to vendor | New | Review, Payment, Reservation | P1 | |
| V-20 | Pricing Rules | Time-of-day, surge, subsidy configuration | New | Pricing | P1 | Foundation for dynamic pricing later. |
| V-21 | Staff / Attendants | Manage on-site staff logins for V-07 Scan | New | Identity | P1 | Multi-user per facility. |
| V-22 | Vendor Notifications | New booking, no-show, charger offline alerts | New | Notification | P0 | Wedge-critical (charger-offline paging). |
| V-23 | Vendor Reviews | See consumer ratings, respond | New | Review | P1 | |
| V-24 | Facility Photos & Amenities | Manage listing media | New | Provider | P1 | Airbnb-pattern listing quality. |
| V-25 | Vendor Onboarding Checklist | Progress bar: KYC → Setup → First booking | New | Identity, Provider | P0 | Shopify-pattern activation. |
| V-26 | Vendor Referral / Grow-my-listing | Refer other vendors, promo credits | New | Identity, Payment | P2 | |

**Vendor/Partner count: 26 screens (16 Existing/In-flight, 10 New).**

---

### 4.3 Mechanic app (shop owner mobile)

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| M-01 | Login | Mechanic-owner auth | Existing | Identity | P1 | `MechanicLoginScreen.tsx`. |
| M-02 | Register | Sign up as a shop | Existing | Identity, Provider | P1 | `MechanicRegisterScreen.tsx`. |
| M-03 | KYC | Business docs | Existing | Identity, Provider | P1 | `MechanicKycScreen.tsx`. |
| M-04 | Pending | Waiting on admin | Existing | Identity | P1 | `MechanicPendingScreen.tsx`. |
| M-05 | Setup | Services offered, hours, pricing | Existing | Provider, Pricing, Availability | P1 | `MechanicSetupScreen.tsx`. |
| M-06 | Dashboard | Today's bookings, revenue, active jobs | Existing | Reservation, Payment | P1 | `MechanicDashboardScreen.tsx`. |
| M-07 | Bookings | Full booking queue (in-shop + mobile requests) | Existing | Reservation, Provider | P1 | `MechanicBookingsScreen.tsx`. |
| M-08 | Reviews | Consumer ratings, respond | Existing | Review | P1 | `MechanicReviewsScreen.tsx`. |
| M-09 | Workers | Invite / manage worker (employee) logins | Existing | Identity | P1 | `MechanicWorkersScreen.tsx`. |
| M-10 | Job Detail | Per-booking detail, assign worker, mark complete | New | Reservation, Vehicle, Review, Payment | P1 | Missing today. |
| M-11 | Mobile Job Dispatch | Assign mobile-mechanic request to available worker | New | Reservation, Provider, Location | P1 | |
| M-12 | Payouts | Money owed, payout schedule | New | Payment | P1 | Same primitive as V-17. |
| M-13 | Mechanic Notifications | New booking, worker check-in, no-show | New | Notification | P1 | |

**Mechanic app count: 13 screens (9 Existing, 4 New).**

---

### 4.4 Mechanic OS (desktop / tablet SaaS console — Shopify/Toast pattern)

Distinct product surface from the mobile Mechanic app. Sold as a SaaS layer to larger shops.

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| MOS-01 | Shop Console Home | KPIs: throughput, avg ticket, NPS, tech utilization | New | Reservation, Payment, Review | P2 | Toast-pattern operator home. |
| MOS-02 | Digital Job Card | Full inspection checklist, photos, tech notes, parts used | New | Vehicle, Reservation, Review | P2 | Core of Mechanic OS. |
| MOS-03 | Customer CRM | Every car this shop has serviced + owner contact + history | New | Vehicle, Identity, Review | P2 | Salesforce-lite for shops. |
| MOS-04 | Parts / Inventory | Stock levels, reorder alerts, supplier links | New | — (custom domain) | P2 | Adds Inventory as a domain module (not a kernel primitive). |
| MOS-05 | Estimates & Approvals | Send an estimate, customer approves via SMS/app | New | Pricing, Payment, Notification | P2 | Amex-style approval flow. |
| MOS-06 | Invoicing & Billing | Generate GST-compliant invoices | New | Payment | P2 | |
| MOS-07 | Bay Scheduler | Visual calendar: bays × time × technicians | New | Availability, Reservation, Identity | P2 | Google-Calendar-like. |
| MOS-08 | Multi-shop Rollup | Chain owner: see all shops in one view | New | Provider, Payment, Reservation | P3 | For chains only. |
| MOS-09 | Tech Performance | Per-worker throughput, upsell rate, CSAT | New | Identity, Review | P2 | |
| MOS-10 | Warranty & Recall Tracker | Match VIN to open recalls | New | Vehicle, Notification | P3 | Ties into VIP. |
| MOS-11 | Loyalty & Reminders | Auto-remind customers when next service due | New | Notification, Vehicle, Identity | P2 | Habit-forming for shop. |

**Mechanic OS count: 11 screens (all New).**

---

### 4.5 Worker app (mechanic employee — on-site or mobile)

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| W-01 | Register (invite token) | Sign up via link from M-09 | Existing | Identity | P1 | `WorkerRegisterScreen.tsx`. |
| W-02 | Pending | Waiting on shop-owner approval | Existing | Identity | P1 | `WorkerPendingScreen.tsx`. |
| W-03 | Dashboard | Available mobile requests + my assigned jobs | Existing | Reservation, Availability | P1 | `WorkerDashboardScreen.tsx`. |
| W-04 | Profile | Skills, cert, ratings | Existing | Identity, Review | P1 | `WorkerProfileScreen.tsx`. |
| W-05 | Job Detail | Instructions, customer, vehicle, checklist | New | Reservation, Vehicle, Location | P1 | |
| W-06 | Navigation to Job | In-app map to customer location | New | Location, Notification | P1 | |
| W-07 | Job Checklist / Proof | Complete tasks, upload photos, get customer signoff | New | Reservation, Review | P1 | |
| W-08 | Earnings | Per-job payout + weekly summary | New | Payment | P1 | Uber-pattern earnings screen. |
| W-09 | Availability Toggle | Go online / offline / on-break | New | Identity, Availability | P1 | |
| W-10 | Worker Notifications | New job assigned, message from shop | New | Notification | P1 | |

**Worker count: 10 screens (4 Existing, 6 New).**

---

### 4.6 Admin console (platform ops)

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| A-01 | Dashboard | Platform KPIs: GMV, active users, incidents | Existing | Reservation, Payment, Provider | P0 | `AdminDashboardScreen.tsx`. |
| A-02 | Mobile-mechanic Pricing | Set platform-wide mobile mechanic pricing | Existing | Pricing | P1 | `AdminMobilePricingScreen.tsx`. |
| A-03 | Provider Approvals Queue | KYC review for vendors / mechanics | New | Provider, Identity | P0 | Wedge-critical: cannot list a charger until admin approves. |
| A-04 | Provider Directory | All vendors / mechanics / charging operators / tow operators | New | Provider | P0 | |
| A-05 | Consumer Directory | All users + support lookup | New | Identity | P1 | |
| A-06 | Disputes & Refunds | Cross-provider dispute queue | New | Payment, Review | P0 | Trust primitive. |
| A-07 | Payouts Ops | Batch payout runs, exceptions | New | Payment | P1 | |
| A-08 | Incident / Downtime Board | Charger offline, facility closed, worker stuck | New | Availability, Notification | P0 | Wedge-critical for SLA promise. |
| A-09 | Fraud & Risk Console | Flagged accounts, chargebacks, chargeback rate | New | Identity, Payment | P1 | |
| A-10 | Feature Flags & Config | City rollouts, toggles per feature | New | — | P1 | |
| A-11 | Pricing Rules (platform) | Take-rate, subsidies, promo campaigns | New | Pricing, Payment | P1 | |
| A-12 | Notification Templates | System-wide push/SMS/email content | New | Notification | P1 | |
| A-13 | Data Exports & Audits | CSV / API-key access for internal analysts | New | — | P2 | |
| A-14 | Admin RBAC | Roles: super-admin, ops, finance, support | New | Identity | P0 | Security-critical. |

**Admin count: 14 screens (2 Existing, 12 New).**

---

### 4.7 Fleet OS (B2B — Palantir/SAP-lite pattern)

Sold to logistics fleets, cab aggregators, corporate car pools.

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| F-01 | Fleet Console Home | KPIs: fleet uptime, energy cost, incidents | New | Vehicle, Payment, Reservation | P3 | |
| F-02 | Vehicle Fleet Manager | All vehicles, telematics, health scores | New | Vehicle, Identity, Review | P3 | |
| F-03 | Driver Manager | Roster, licenses, ratings, shifts | New | Identity, Review | P3 | |
| F-04 | Energy / Fuel Analytics | kWh + fuel cost per vehicle / route / driver | New | Payment, Vehicle | P3 | Bloomberg-lite. |
| F-05 | Maintenance Scheduler | Predictive + calendar-based service, auto-book mechanic | New | Vehicle, Reservation, Provider | P3 | Auto-triggers M-07 bookings. |
| F-06 | Batch Reservations | Book 20 chargers for tomorrow's night shift | New | Reservation, Availability, Provider | P3 | Ties to cross-actor flow §5.5. |
| F-07 | Cost Center Reports | Chargeback per department / cost center | New | Payment | P3 | SAP-pattern. |
| F-08 | Corporate Wallet & Billing | Single invoice, per-driver policy | New | Payment, Identity | P3 | |
| F-09 | Route Planner (fleet) | Optimize routes across charging stops | New | Location, Availability, Reservation | P3 | |
| F-10 | Policy & Approval Rules | Driver spending caps, mandatory stops | New | Pricing, Identity, Payment | P3 | |
| F-11 | Fleet API Keys | Programmatic access | New | Identity | P3 | Ties into Developer Portal. |
| F-12 | Fleet SSO Setup | SAML / OIDC | New | Identity | P3 | |
| F-13 | Fleet Notifications & Alerts | Vehicle down, charger offline in shift window | New | Notification | P3 | |

**Fleet OS count: 13 screens (all New).**

---

### 4.8 Tow / SOS Operator app

Mobile app for tow-truck operators and roadside-assistance drivers.

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| T-01 | Operator Login / Onboarding | Auth + truck registration | New | Identity, Provider | P1 | |
| T-02 | Live Dispatch Queue | Nearby SOS requests, accept/decline | New | Availability, Reservation, Location | P1 | Uber-pattern driver home. |
| T-03 | Active Job | Nav to consumer, situation notes, ETA | New | Reservation, Location, Notification | P1 | |
| T-04 | Proof of Service | Photos, signature, mileage, damage waiver | New | Reservation, Review, Vehicle | P1 | |
| T-05 | Earnings | Per-job payout, weekly summary | New | Payment | P1 | |
| T-06 | Availability Toggle | Go on/off duty, break | New | Availability, Identity | P1 | |
| T-07 | Operator Profile | Truck type, capabilities (flatbed, wheel-lift, EV-safe) | New | Provider, Identity | P1 | |
| T-08 | Operator Notifications | New job, cancellations, disputes | New | Notification | P1 | |

**Tow/SOS count: 8 screens (all New).**

---

### 4.9 Charging Operator SaaS (desktop console)

Sold to third-party charging networks that plug into our reservation layer.

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| CO-01 | Operator Console Home | Network KPIs: uptime, utilization, revenue | New | Provider, Availability, Payment | P2 | |
| CO-02 | Station List & Map | All stations, filter by status | New | Location, Provider, Availability | P2 | |
| CO-03 | Station Detail | Per-station telemetry, connectors, sessions | New | Availability, Reservation, Provider | P2 | |
| CO-04 | Remote Start/Stop | Manually start/stop a session on behalf of consumer support | New | Reservation, Identity | P2 | OCPP-integration. |
| CO-05 | Pricing Rules Console | Time-of-day, surge, per-connector pricing | New | Pricing | P2 | |
| CO-06 | Uptime & SLA Dashboard | Which chargers down, how long, penalties | New | Availability, Notification | P2 | |
| CO-07 | Utilization Analytics | Heatmaps by day/hour, sessions per station | New | Reservation, Availability | P2 | |
| CO-08 | Revenue & Payouts | Money earned via platform, payout schedule | New | Payment | P2 | |
| CO-09 | Roaming Partners | Which networks we bridge to, cost per session | New | Provider, Payment | P3 | Visa-pattern roaming ledger. |
| CO-10 | Maintenance Log | Field-tech visits, work orders | New | Provider | P2 | |
| CO-11 | Firmware & OTA | Push firmware to chargers | New | Provider | P3 | |
| CO-12 | Operator Notifications | Charger offline, dispute, payout hit | New | Notification | P2 | |

**Charging Operator SaaS count: 12 screens (all New).**

---

### 4.10 Mobility Intelligence (Bloomberg-pattern analytics product)

Sold to city governments, real-estate developers, insurance, energy utilities.

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| MI-01 | Home / Market Overview | Total sessions, GMV, growth curves | New | Reservation, Payment | P3 | |
| MI-02 | Demand Heatmaps | Where do people search for chargers/parking and not find? | New | Location, Availability | P3 | Infrastructure-gap map. |
| MI-03 | Infrastructure Gap Map | Cities × unmet demand × ROI on adding supply | New | Location, Availability, Provider | P3 | For real-estate + govt. |
| MI-04 | Demand Forecasts | Day/week/month prediction per zone | New | Availability, Reservation | P3 | |
| MI-05 | Price Elasticity | Sensitivity of demand to price by segment | New | Pricing, Reservation | P3 | |
| MI-06 | Cohort Retention Explorer | Consumer cohorts, retention curves | New | Identity, Reservation | P3 | |
| MI-07 | Provider Benchmarks | Compare a vendor vs peers | New | Provider, Review | P3 | |
| MI-08 | Data Export & API | Download CSVs, hit our data API | New | — | P3 | Ties into Developer Portal. |

**Mobility Intelligence count: 8 screens (all New).**

---

### 4.11 Vehicle Identity Platform (VIP — Salesforce-pattern data layer + UI)

The "record of truth" for every vehicle on our network. Consumer-facing surface = C-52. Below are the deeper surfaces (admin / OEM / insurer facing).

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| VIP-01 | Vehicle Search | Look up by VIN / plate | New | Vehicle, Identity | P3 | |
| VIP-02 | Vehicle Profile | Full history: services, charges, tows, insurance, ownership | New | Vehicle, Reservation, Identity, Review | P3 | |
| VIP-03 | Service History Timeline | Chronological across all providers | New | Vehicle, Reservation, Provider | P3 | Consumer face = C-52. |
| VIP-04 | Ownership Ledger | Chain of ownership, resale-value inputs | New | Vehicle, Identity | P3 | |
| VIP-05 | Docs Vault | RC, insurance, PUC, warranties | New | Vehicle, Identity | P3 | |
| VIP-06 | Insurance Integrations | Insurer widgets pulling live data | New | Vehicle, Provider | P3 | Insurers as consumers of the API, not underwriters we run. |
| VIP-07 | OEM Data Feeds | OEM-provided recall / telematics feeds in | New | Vehicle | P3 | |
| VIP-08 | Data Sharing Permissions | Consumer controls what who can see | New | Identity, Vehicle | P3 | Trust-critical. |

**VIP count: 8 screens (all New).**

---

### 4.12 Developer Portal (Stripe-pattern)

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| DEV-01 | Portal Home | Getting started, quick links | New | — | P3 | |
| DEV-02 | API Keys | Create / rotate / scope | New | Identity | P3 | |
| DEV-03 | Sandbox Console | Test-mode dashboard | New | Reservation, Payment | P3 | |
| DEV-04 | Docs & Reference | Interactive API docs | New | — | P3 | |
| DEV-05 | Webhooks | Subscribe to events (reservation.confirmed, payment.paid, …) | New | Notification | P3 | |
| DEV-06 | Logs & Debugger | Request/response inspector | New | — | P3 | |
| DEV-07 | Usage & Rate Limits | Per-key consumption | New | — | P3 | |
| DEV-08 | Billing (developer accounts) | If we charge for API access | New | Payment | P3 | |
| DEV-09 | App Store / Integrations | Partner-built apps on top of our API | New | Provider | P3 | Long-term ecosystem. |

**Developer Portal count: 9 screens (all New).**

---

### 4.13 AI Concierge (embedded surfaces — recap)

These are not a separate app; they are cross-cutting components that appear inside Consumer, Fleet OS, and Mechanic OS. Listed here so they can be tracked as distinct screens even though they render inside other apps.

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| AI-01 | Proactive Card (Home) | "You'll reach with 12% — reserved charger" | New | Reservation, Availability, Location, Notification | P1 | Embedded in C-09/C-10. |
| AI-02 | Proactive Card (Weather) | "Rain forecast — covered parking booked" | New | Reservation, Availability, Location, Notification | P2 | |
| AI-03 | Chat Concierge | Free-form ask, calls all primitives | New | Reservation, Availability, Pricing, Provider | P1 | Consumer face = C-43. |
| AI-04 | Journey Planner | Multi-hop trip w/ stops | New | Location, Availability, Reservation, Pricing | P2 | Consumer face = C-45. |
| AI-05 | "Explain this booking" | LLM tells you why price/route/eta is what it is | New | Reservation, Pricing | P2 | Trust surface. |
| AI-06 | Fleet Concierge | Fleet-manager-facing chat | New | Reservation, Vehicle, Availability | P3 | Embedded in F-01. |
| AI-07 | Mechanic Concierge | "What's the likely fix for this VIN's history?" | New | Vehicle, Review | P3 | Embedded in MOS-02. |

**AI Concierge count: 7 screens (all New).**

---

### 4.14 Growth / Onboarding surfaces

Cross-cutting growth loops. Some already exist as fragments; listed together here for coherence.

| # | Screen | Purpose | Status | Primitives used | Priority | Notes |
|---|---|---|---|---|---|---|
| G-01 | Consumer Onboarding | 3–4 slide value pitch | Existing | — | P0 | Same as C-02. Rewrite for charging wedge in Phase 0. |
| G-02 | Empty-state prompts | "Add your first vehicle to see chargers near you" | New | Vehicle | P0 | |
| G-03 | Activation Checklist (Consumer) | Add vehicle → add payment → first booking | New | Vehicle, Payment, Reservation | P0 | Shopify-pattern activation. |
| G-04 | Referral Program | C-51 | New | Identity, Payment | P1 | Cross-listed with Consumer. |
| G-05 | Subscription Upsell | Netflix-pattern EV membership prompt | New | Pricing, Payment | P2 | |
| G-06 | Post-first-booking NPS | Immediate feedback loop | New | Review, Notification | P1 | |
| G-07 | Winback Campaign UI | "We miss you — first charge free" | New | Notification, Pricing | P2 | |
| G-08 | Milestones / Streaks | Duolingo pattern | New | Identity, Review | P3 | Consumer face = C-50. |
| G-09 | Local City Landing (web) | Public marketing per launch city | New | Location, Provider | P0 | Wedge SEO. |

**Growth count: 9 screens (1 Existing, 8 New).**

---

### 4.15 Grand totals

| Actor surface | Screens | Existing / In-flight | New |
|---|---:|---:|---:|
| Consumer | 55 | 30 | 25 |
| Vendor / Partner | 26 | 16 | 10 |
| Mechanic app | 13 | 9 | 4 |
| Mechanic OS | 11 | 0 | 11 |
| Worker | 10 | 4 | 6 |
| Admin | 14 | 2 | 12 |
| Fleet OS | 13 | 0 | 13 |
| Tow / SOS Operator | 8 | 0 | 8 |
| Charging Operator SaaS | 12 | 0 | 12 |
| Mobility Intelligence | 8 | 0 | 8 |
| Vehicle Identity Platform | 8 | 0 | 8 |
| Developer Portal | 9 | 0 | 9 |
| AI Concierge | 7 | 0 | 7 |
| Growth / Onboarding | 9 | 1 | 8 |
| **TOTAL** | **203** | **62** | **141** |

---

## 5. Cross-Actor Flows

### 5.1 Charging reservation end-to-end (the wedge)

```
Consumer                    Platform                 Charging Operator SaaS
--------                    --------                 ----------------------
C-10 Home/Charging tab  -->  Availability primitive
                             (poll operator stations)   CO-03 Station Detail
C-14 Charger Selection  -->  Reservation.requested
C-16 Booking Summary
C-17 UPI Payment        -->  Payment.authorized
C-18 Booking QR         <--  Reservation.confirmed  --> CO-06 Uptime notifies
                             Notification (T-minus 30m,
                              T-minus 5m)               CO-04 Remote-start
[Arrives, plugs in]     -->  Reservation.active
C-20 Active Session     <--  Availability updates    <-- OCPP telemetry
                                                        CO-03 shows session
[Unplug]                -->  Reservation.completed
                             Payment.captured
                             Payout to operator      --> CO-08 Revenue
C-22 History
C-23 Booking Detail     -->  Review prompt          --> Provider review roll-up
AI-01 Proactive next-time
```

Primitives touched: **Reservation, Availability, Provider, Location, Payment, Pricing, Notification, Identity, Review.** (9 of 10.)

### 5.2 Tow / SOS dispatch

```
Consumer                    Platform                 Tow Operator app
--------                    --------                 ---------------
C-41 SOS Home (button)  -->  Provider(tow) discovery
                             by Location + capability
                             Availability toggle           T-06 On-duty
                             Reservation.requested    -->  T-02 Dispatch queue
                                                           T-02 Accept
                        <--  Reservation.confirmed
C-42 Live status         <--  Location telemetry     <--  T-03 Active job (nav)
                              Notification (ETA)
[Truck arrives]         -->  Reservation.active           T-04 Proof of service
[Job done]              -->  Reservation.completed
                             Payment.captured             T-05 Earnings
C-23 Detail + rating    -->  Review
```

Primitives: **Provider, Location, Availability, Reservation, Notification, Payment, Review, Identity.**

### 5.3 Booking a mechanic (in-shop or mobile)

```
Consumer                    Platform                 Mechanic app / Mechanic OS       Worker app
--------                    --------                 ------------------------          ----------
C-35 Mechanics list       -->  Location, Availability
C-36 Shop Detail          -->  Provider, Pricing, Review
C-16 Booking Summary       -->  Reservation.requested
C-17 Pay                   -->  Payment.authorized      M-07 Bookings incoming
                                                        M-10 Job Detail
C-18 QR / OTP              <-- Reservation.confirmed
   (mobile-request only) -----------------------------> M-11 Mobile Dispatch      -->  W-05 Job Detail
                                                                                       W-06 Nav
C-39 Live status           <-- Location + Notification                             <-- W-07 Checklist
[Job done]                 --> Reservation.completed    MOS-02 Digital Job Card
                               Payment.captured         MOS-06 Invoice            -->  W-08 Earnings
C-23 Detail + rating       --> Review                   M-08 Reviews
```

### 5.4 Rental of parking space

```
Consumer                    Platform                  Vendor app
--------                    --------                  ----------
C-11 Home/Rental tab     --> Location, Availability
C-15 Rental Facility Detail  Pricing (day/week/month)  V-15 Rental Listing Setup
C-16 Booking Summary      -->Reservation.requested
C-17 Pay                  -->Payment.authorized
C-18 QR / gate access     <--Reservation.confirmed     V-16 Rental Bookings
[Occupies over N days]    -->Reservation.active        V-06 Dashboard live
[Ends]                    -->Reservation.completed
                            Payment.captured, payout   V-17 Payouts
C-23 Detail + rating      -->Review                    V-23 Reviews
```

### 5.5 Fleet reservation batch

```
Fleet OS                            Platform                            Multiple providers
--------                            --------                            ------------------
F-06 Batch Reservations          -->Provider(*) discovery
   "20 chargers, tomorrow          Availability across providers
    22:00-05:00, near Depot A"     Pricing (corporate rate card)
                                   Reservation × N                --> Charging Operator SaaS × N
                                   Payment (single invoice)            CO-03 stations reserved
F-08 Corporate Wallet             <--Notification per driver
   sees pooled cost                Identity (drivers via SSO)
                                                                   --> Consumer app (driver's phone)
                                                                       C-18 QR issued to each driver
[Sessions run]                    <--Reservation.completed × N     <-- Sessions telemetry
F-04 Energy Analytics              Payment consolidated              CO-08 Revenue split
F-07 Cost Center Reports          Notification: shift complete
```

---

## 6. Prioritization Roadmap

### Phase 0 — Wedge (0–3 months)
**Goal:** in ONE city, a consumer with an EV finds → reserves → pays for → uses → rates a charger. Nothing else has to work.

Screens (by ID):
- Consumer: C-01, C-02, C-03, C-04, C-05, C-06, C-08, **C-10**, C-14, C-16, C-17, C-18, C-20, C-22, C-23, C-26, C-30, G-01, G-02, G-03, G-09
- Vendor: V-01, V-02, V-03, V-04, V-05, V-06, V-13, V-14, V-17, V-22, V-25
- Admin: A-01, A-03, A-04, A-06, A-08, A-14

**~36 screens.** Everything else waits.

### Phase 1 — Layer on parking + rental + mechanic + SOS (3–9 months)
Screens:
- Consumer: C-09, C-11, C-12, C-13, C-15, C-21, C-24, C-25, C-27, C-28, C-29, C-32, C-33, C-35, C-36, C-37, C-38, C-39, C-41, C-42, C-43, C-44, C-51, C-54, AI-01, AI-03
- Vendor: V-07, V-08, V-09, V-10, V-11, V-12, V-15, V-16, V-18, V-19, V-20, V-21, V-23, V-24
- Mechanic (app): M-01…M-13 (all 13)
- Worker: W-01…W-10 (all 10)
- Tow/SOS: T-01…T-08 (all 8)
- Admin: A-02, A-05, A-07, A-09, A-10, A-11, A-12
- Growth: G-04, G-06

**~85 screens.**

### Phase 2 — SaaS surfaces + habits (9–18 months)
Screens:
- Mechanic OS: MOS-01…MOS-11 (11)
- Charging Operator SaaS: CO-01…CO-12 (12; CO-09, CO-11 slip to Phase 3)
- Consumer habits: C-34, C-45, C-46, C-47, C-48, C-49, C-52, C-53
- AI: AI-02, AI-04, AI-05
- Admin: A-13
- Growth: G-05, G-07

**~40 screens** (with two CO screens deferred).

### Phase 3 — Fleet OS + Intelligence + Developer Portal (18+ months)
Screens:
- Fleet OS: F-01…F-13 (13)
- Mobility Intelligence: MI-01…MI-08 (8)
- Vehicle Identity Platform: VIP-01…VIP-08 (8)
- Developer Portal: DEV-01…DEV-09 (9)
- Consumer: C-31, C-40, C-50, C-55
- Mechanic OS: MOS-08, MOS-10
- Charging Operator SaaS: CO-09, CO-11
- AI: AI-06, AI-07
- Growth: G-08

**~50 screens.**

Rough distribution: **P0 ≈ 36**, **P1 ≈ 85**, **P2 ≈ 40**, **P3 ≈ 50**. (Adds up to ~211 with a few screens appearing in multiple phases as they expand scope, matching the 203 unique screens.)

---

## 7. Screens Intentionally Out Of Scope

Explicitly excluded so the team can push back if any of these get lobbied for. Reasoning tied to "focus" from the strategy doc.

- **Insurance underwriting UI.** We surface insurance _data_ (VIP-06) and can broker leads, but we do not run an insurance product. Regulated, capital-heavy, and off-thesis.
- **Spare-parts marketplace UI.** Adjacent to Mechanic OS but a full commerce vertical of its own. Defer indefinitely; partner via API instead.
- **Consumer social features** (feeds, friends, likes). No evidence they drive mobility conversion. Adds moderation overhead. Skip.
- **Proprietary in-app wallet with stored balance.** Regulated as PPI/e-money in India. Route through UPI + card rails + corporate invoicing (existing V-17 / C-24). Do not build a walled wallet.
- **Loyalty points / coins with cross-merchant redemption.** Same regulatory hazard, plus points-management is a company on its own.
- **Consumer content / blog / community.** Marketing content lives outside the app. Do not build in-app CMS.
- **Ride-hailing / cab-booking module.** Explicitly not our category. We are infrastructure, not a mobility service.
- **In-app messaging / chat between consumer & worker beyond structured status updates.** Uber-style scripted taps + call button; no free-form chat in Phase 0–2.
- **OEM factory-integration UIs** (dealer inventory, VIN provisioning at factory). VIP consumes OEM feeds — we don't run OEM ops.
- **Advertising / promoted-listings UI.** Would corrupt neutrality (Visa-style network positioning). Off-thesis until scale is huge.
- **Consumer credit / EMI / financing.** Regulated. Partner if needed.
- **Charging hardware configuration UI** beyond the operator SaaS. We are not building an EMS or an EVSE cloud from scratch — CO-* integrates via OCPP.
- **Full desktop consumer web app.** Consumer is mobile-first; the marketing site (G-09) is the only public web surface in Phase 0.
- **On-premise / self-hosted deployments of any console.** Cloud SaaS only. Palantir-style deploys are outside our capacity for years.

---

## 8. Open Questions for the User

Answer these to unblock Phase 0 scoping. Priority order — the first 5 must be answered before we can freeze the Phase 0 screen list.

1. **Wedge city?** Which single city do we commit to for the charging MVP? Density of chargers, EV penetration, and regulatory friction differ hugely across Bangalore / Delhi-NCR / Mumbai / Hyderabad / Pune. This decides G-09, A-10 flag config, and which operators we approach first.
2. **First target vehicle segment: EV owners, ICE owners, or fleet EVs?** Consumer-EV vs fleet-EV changes which screens exist in Phase 0 (Fleet OS moves earlier if fleet-first). Also changes marketing.
3. **Supply-side proof points on day 1:** how many charging stations / operators can we actually list in the wedge city at launch? This determines whether V-13/V-14 or CO-* integrations are Phase 0 (self-serve operator sign-up vs bespoke integration).
4. **Payment rails for Phase 0:** UPI only, or UPI + cards + corporate invoicing? This decides which sub-flows of C-17 / C-24 must ship. Corporate invoicing pulls in a slice of F-08.
5. **Is roaming (Visa-pattern) part of the wedge or Phase 2?** If yes, CO-09 and C-53 move to P0. If no, we sign one operator exclusively for Phase 0 and defer neutrality claims.
6. **Existing partnerships (mechanics, tow, parking) — do we already have signed vendors we must honor with Phase 0 UI?** If yes, some Phase 1 screens (mechanic, tow, parking) get pulled into Phase 0.
7. **Is Fleet OS in the 12-month plan or the 24-month plan?** Fleet OS as an early ARR anchor changes hiring and Phase 1 sequencing dramatically.
8. **AI Concierge in Phase 0 or Phase 1?** AI-01 + AI-03 are cheap-ish to fake but expensive to make reliable. If Phase 0, we need eval infra + prompt-ops from day 1.
9. **Regulatory posture on data:** what does VIP need to expose _in Phase 0_ vs later? Anything user-facing about vehicle history triggers privacy/consent screens (VIP-08, C-52) earlier than we'd like.
10. **What is the ONE metric Phase 0 must move?** (Weekly reserved sessions? Repeat rate? GMV? Concurrent operators?) The metric determines which screens actually need instrumentation vs which we can ship "cold."

---

_End of inventory. Screen IDs are stable — refer to them in follow-up specs so we can track "which screens changed which phase" over time._
