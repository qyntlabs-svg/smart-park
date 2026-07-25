# Module structure

This document explains how the codebase is organised after the module refactor.
It is meant for anyone touching `src/` — read it before adding a new screen or
data layer.

## TL;DR

```
src/
├── modules/                ← Role- and domain-scoped feature modules
│   ├── auth/               ← Splash, onboarding, role selection, per-role login barrels
│   ├── consumer/           ← Every screen a paying customer sees
│   ├── partner/            ← Parking-vendor: dashboard, KYC, scan, QR, EV, rentals
│   ├── mechanic/           ← Shop-owner: dashboard, bookings, reviews, workers
│   ├── worker/             ← Mechanic-employee (invited): register, dashboard, profile
│   ├── admin/              ← Internal ops dashboard, mobile-service pricing
│   ├── ev/                 ← EV Charging Stations (vendor + consumer)   ← NEW
│   └── rental/             ← Parking-space rentals (vendor + consumer)   ← NEW
│
├── shared/                 ← Cross-module helpers (no role/domain awareness)
│   └── lib/
│       ├── geo.ts          ← haversineKm, formatKm, DEFAULT_DISCOVERY_RADIUS_KM
│       ├── notifications.ts← app-wide in-app notification store
│       └── storage.ts      ← typed localStorage wrapper (readJson/writeJson/makeId)
│
├── pages/                  ← Legacy flat page folder (still the physical home of most screens)
├── components/             ← Shared UI (ui/, layout/, BottomNav, SideDrawer, ParkingMap, LocationPicker)
├── api/                    ← Real-backend react-query wrappers (partner, parking, bookings, …)
├── lib/                    ← Legacy: axios, token, firebase, razorpay, qr-payload, mechanic.ts
├── hooks/                  ← Legacy: use-toast, use-dark-mode, usePushNotifications, useLocationSearch
├── store/                  ← Zustand stores (auth.store.ts)
└── App.tsx                 ← Routes only. Imports from module barrels or legacy pages.
```

## What a module contains

Each module under `src/modules/*` is self-contained and may include:

| Sub-path       | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `index.ts`     | Public surface — **only** import a module through its barrel.      |
| `types.ts`     | Domain types shared between vendor + consumer + admin sides.        |
| `store.ts`     | Data access layer (mock or real). Returns Promises even if sync.    |
| `hooks.ts`     | React-query wrappers over `store.ts`. UI should use these, not the store. |
| `pages/`       | Screen components. Often split into `partner/`, `consumer/`, `worker/`. |
| `lib/`         | Non-hook helpers scoped to this module.                             |
| `components/`  | Non-shared components used only inside this module.                  |

The `ev/` and `rental/` modules are the reference implementations of this layout.

## Why some files still live in `src/pages/`

The existing app has ~60 screens. Physically moving all of them into their
module folders would cause hundreds of import updates in a single change.
Instead, each module's `index.ts` **re-exports** the existing pages from
`src/pages/`. This means:

- `App.tsx` can `import { PartnerDashboardScreen } from "@/modules/partner"` today.
- Every current import like `import PartnerDashboardScreen from "@/pages/PartnerDashboardScreen"` **keeps working**.
- Files can be physically moved into `modules/<name>/pages/` incrementally, one at a time, without a big-bang refactor.

New code (see `ev/`, `rental/`) is written directly inside its module folder — it never lives in `src/pages/`.

## Legacy `src/lib/mechanic.ts`

That file is ~820 lines and mixes mechanic auth, shops, bookings, workers,
invites, notifications, pricing and geo helpers. We split its public surface
into three module facades **without touching the underlying file** yet:

| Module    | Facade                            | Exposes                             |
| --------- | --------------------------------- | ----------------------------------- |
| mechanic  | `@/modules/mechanic/lib/shops`    | Shop CRUD, bookings, reviews, auth  |
| worker    | `@/modules/worker/lib/workers`    | Workers, invites, dispatch, auth    |
| admin     | `@/modules/admin/lib/pricing`     | Mobile-service pricing, catalogue   |

Cross-cutting concerns (notifications, geo) were **physically extracted** into `src/shared/lib/`:

- `haversineKm`, `formatKm`, `DEFAULT_DISCOVERY_RADIUS_KM` → `src/shared/lib/geo.ts`
- `getNotifications`, `pushNotification`, `markAllNotificationsRead` → `src/shared/lib/notifications.ts`

The originals in `src/lib/mechanic.ts` are still there so nothing breaks; new
code should import from `@/shared/lib/*` and `@/modules/*/lib/*` instead.

## Mock-first data pattern (used by `ev/` and `rental/`)

Both new modules follow the same shape so they can be swapped to a real API
without any UI changes:

```
types.ts   → Plain interfaces + label maps
store.ts   → async functions (list / get / create / update / delete)
             backed by localStorage today, backed by axios tomorrow.
hooks.ts   → useQuery / useMutation wrappers that call store.ts.
             *This is what components consume.*
```

To swap to real backend later:

1. Keep `types.ts` unchanged.
2. Replace the `readJson` / `writeJson` calls in `store.ts` with `api.get` / `api.post` calls.
3. Delete the `SEED_*` seed data.
4. **No component or hook needs to change.**

## Roles + routes

| Role     | Login route            | Home after login          | Owns modules                    |
| -------- | ---------------------- | ------------------------- | ------------------------------- |
| Consumer | `/login`               | `/home`                   | `consumer/`                     |
| Partner  | `/partner/login`       | `/partner/dashboard`      | `partner/`, `ev/`, `rental/`    |
| Mechanic | `/mechanic/login`      | `/mechanic/dashboard`     | `mechanic/`                     |
| Worker   | `/worker/register/:t`  | `/worker/dashboard`       | `worker/`                       |
| Admin    | *(via role picker)*    | `/admin/dashboard`        | `admin/`                        |

Role gating lives in `<ProtectedRoute role="…">` inside `App.tsx`, backed by
`useAuthStore.hasRole(...)`. Only three canonical roles exist in the store
today (`user`, `partner`, `admin`); Mechanic + Worker use their own
localStorage auth (see `src/lib/mechanic.ts` → `MechanicAuth`, `WorkerAuth`).

## Adding a new feature

1. Decide which role(s) own the feature.
2. If it doesn't fit an existing module, create `src/modules/<domain>/`.
3. Add `types.ts`, `store.ts`, `hooks.ts`, then `pages/partner/…` / `pages/consumer/…` as needed.
4. Add a barrel `index.ts` re-exporting the public surface.
5. Add routes in `App.tsx` importing from `@/modules/<domain>`.
6. Wire nav entry points into the appropriate side drawer / home tile.

Reference: EV module (`src/modules/ev/`) is the smallest complete example.

## Migrating a page from `src/pages/` into its module

Safe, per-page recipe:

1. Move the file: `src/pages/FooScreen.tsx` → `src/modules/<owner>/pages/FooScreen.tsx`.
2. Update `src/modules/<owner>/index.ts` to `export { default as FooScreen } from "./pages/FooScreen"`.
3. Update `App.tsx` to import `FooScreen` from `@/modules/<owner>`.
4. Update any other importer of `@/pages/FooScreen` — usually zero, since App.tsx is the only route consumer.

Do **not** move + rename in the same commit.

## What was added in the module refactor

- **EV Charging module** (`ev/`): 8 files.
  - Vendor: `/partner/ev`, `/partner/ev/new`, `/partner/ev/:id/edit`
  - Consumer: `/ev`, `/ev/:id`
- **Parking Rental module** (`rental/`): 8 files.
  - Vendor: `/partner/rentals`, `/partner/rentals/new`, `/partner/rentals/:id/edit`
  - Consumer: `/rentals`, `/rentals/:id` (with in-sheet booking flow)
- **Shared libs**: `geo.ts`, `notifications.ts`, `storage.ts` (extracted from `lib/mechanic.ts`).
- **Nav wiring**: Partner side-drawer + dashboard tiles, Consumer HomeScreen quick-access grid.
