# Mechanic Platform Extension Plan

Building on top of existing `src/lib/mechanic.ts` mock store + existing mechanic dashboard / consumer mechanic screens. Phase 2 frontend-only — all state in localStorage, mock OTP, mock geolocation, mock push (toast + in-app notification list).

## Data model additions (`src/lib/mechanic.ts`)

- `MechanicWorker` — `{ id, shopId, name, phone, aadhaarUrl, panUrl, extraDocs[], status: 'pending'|'approved'|'rejected'|'suspended'|'removed'|'self_suspended', createdAt, lat?, lng? }`
- `WorkerInvite` — `{ token, shopId, createdAt, expiresAt? }`
- Extend `MechanicBooking` with `jobType: 'in_shop'|'mobile'`, `workerId?`, `workerName?`, `priceBreakdown?: { labour, travel, service, nightSurcharge }`, status timeline adds `searching`, `assigned`, `on_the_way`, `in_progress`.
- `MechanicReview` gets `workerId?`, `workerName?`.
- `AdminMobilePricing` — `{ labourPerService, travelPerKm, serviceCharge, nightSurchargePct }` (configurable; default seeded).
- `Notification` mock store keyed per role (owner/worker/consumer).

Helper functions: `createWorkerInvite`, `consumeInvite`, `getWorkersForShop`, `setWorkerStatus`, `notifyOwner/Worker/Consumer`, `getMobilePricing`, `calcMobileQuote(services, distanceKm, time)`.

## Screens / routes

Mechanic (owner) dashboard:
- `/mechanic/workers` — list (tabs: Pending / Active / Suspended), approve/reject/suspend/remove, "Invite Worker" → modal with link + Web Share + WhatsApp + copy.
- `/mechanic/bookings` — already exists; upgrade to include filters, job-type chips, summary metric cards, date range filter, assigned worker column.
- Add "Workers" + notif bell entry to dashboard.

Worker side (new mini-app):
- `/worker/register/:token` — mobile-first OTP form + Aadhaar/PAN/extra uploads (file → dataURL in localStorage).
- `/worker/pending` — pending approval screen.
- `/worker/dashboard` — incoming requests feed (auto-shows mobile requests within radius), profile with self-suspend toggle, "My reviews".
- Worker session stored in `workerAuth` localStorage key.

Consumer:
- `/mechanics/request` — new "Request Mobile Mechanic" flow: pick services from predefined catalogue, see itemised quote (labour/travel/service/night), confirm → status screen `Looking → Found → On the way → In progress → Completed`.
- Existing shop-detail "Book" flow stays as in-shop with shop-owner pricing.
- Post-completion review modal — captures rating, comment; attaches workerId for mobile jobs.

Admin:
- `/admin/mobile-pricing` — simple form to edit `AdminMobilePricing` (gated behind existing admin route pattern).

Notifications:
- `NotificationsScreen` already exists — extend to read from per-role mock notif store. Toast on dispatch.

## Dispatch simulation

Since no backend: on consumer request, create booking with `status='searching'`, broadcast to all approved+active workers for shops within ~10km of consumer (Haversine on mocked lat/lng). A worker viewing dashboard sees it in a "New Requests" list and can Accept → first-accept wins (compare-and-set on booking status). Consumer screen polls localStorage every 2s via interval.

## Files to add
- `src/pages/MechanicWorkersScreen.tsx`
- `src/pages/WorkerRegisterScreen.tsx`
- `src/pages/WorkerPendingScreen.tsx`
- `src/pages/WorkerDashboardScreen.tsx`
- `src/pages/WorkerProfileScreen.tsx`
- `src/pages/ConsumerMobileMechanicRequestScreen.tsx`
- `src/pages/ConsumerMobileMechanicStatusScreen.tsx`
- `src/pages/AdminMobilePricingScreen.tsx`
- Extend `src/lib/mechanic.ts`, `src/pages/MechanicDashboardScreen.tsx`, `src/pages/MechanicBookingsScreen.tsx`, `src/pages/MechanicShopDetailScreen.tsx`, `src/pages/MechanicReviewsScreen.tsx`, `src/App.tsx` routes, `src/pages/NotificationsScreen.tsx`.

## Out of scope (mocked)
- Real OTP/SMS (auto-accept any 6-digit).
- Real geolocation (use existing mock Tambaram coords; ask browser if available, fallback to mock).
- Real push (toast + in-app list only).
- Secure storage (files stored as dataURLs in localStorage, flagged TODO for Supabase Storage in Phase 3).
