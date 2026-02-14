

# Auto Doc - Smart Parking App (Phase 1)

## Overview
A mobile-first, pixel-perfect parking app built as a PWA with Capacitor for native iOS/Android. Users authenticate via phone/OTP, manage vehicles, discover nearby parking on a map, and select parking slots. Backend powered by Supabase with real-time updates.

---

## Build Order (Pixel-Perfect, Screen by Screen)

### Step 1: Foundation & Design System
- Set up the custom color palette (Primary blue #2563EB, success green, error red, warning amber)
- Configure typography scale (28/24/20/16/14/12px), 8px spacing grid
- Build reusable mobile-first components: large touch-target buttons (56px height, 44x44 min), rounded cards (16px radius), bottom sheet component
- Set up Capacitor with iOS/Android targets
- Configure hash routing for mobile compatibility
- Add safe area CSS variables and viewport-fit=cover

### Step 2: Splash Screen
- Full-viewport gradient blue background with centered Auto Doc logo (120x120px, fade-in animation)
- "Park Smart, Drive Easy" tagline and version number
- 2-second auto-navigation with auth session check
- Routes to onboarding (first time), login (returning), or home (logged in)

### Step 3: Onboarding (3 Swipeable Screens)
- Horizontal swipeable carousel with snap behavior and dot pagination
- Skip button on screens 1-2, "Get Started" button on screen 3
- Illustrations and copy for: Find Parking, Manage Vehicles, Real-Time Availability
- Stores `hasSeenOnboarding` flag in localStorage

### Step 4: Supabase Setup & Authentication
- Connect external Supabase project
- Create database tables: profiles, vehicles, parking_locations, parking_slots, bookings
- Set up all RLS policies (users own their data, public read for parking)
- Create storage bucket for parking images
- Add indexes for performance

### Step 5: Login Screen
- Clean white card on gradient background with Auto Doc logo
- Country code dropdown (🇮🇳 +91) + phone input with real-time 10-digit validation
- "Send OTP" button with disabled state
- Legal footer with Terms & Privacy links
- Supabase phone/OTP auth integration

### Step 6: OTP Verification Screen
- Back button, masked phone display with edit option
- 6 OTP input boxes (56x56px) with auto-focus and auto-advance
- 30-second resend countdown timer
- "Verify & Continue" button
- Routes to vehicle registration or home based on existing vehicles

### Step 7: First-Time Vehicle Registration & Add Vehicle Form
- Full-screen mandatory prompt (cannot dismiss) with illustration
- Vehicle type selection (Two-Wheeler / Four-Wheeler cards with tap animation)
- Form fields: vehicle number (required), nickname, model, color picker (horizontal scroll dots)
- Default vehicle toggle
- Save to Supabase vehicles table

### Step 8: Vehicle Added Success Screen
- Centered success checkmark animation
- Vehicle summary card with number, nickname, badges
- "Start Finding Parking" button → navigates to home

### Step 9: Home Screen / Dashboard
- Custom header with menu, logo, notifications, profile avatar
- Greeting section with user name and GPS location
- Vehicle selector card (opens bottom sheet)
- Placeholder map area with mock parking markers (green/yellow/red/grey by availability)
- Map/List view toggle segmented control
- Current location and refresh buttons
- Vehicle selector bottom sheet component

### Step 10: Parking Preview & Detail Bottom Sheets
- **Small preview** (25% height): name, distance, availability bar, price, rating on marker tap
- **Full detail** (90% height): image carousel, availability card, vehicle types, pricing, facilities grid, address with copy/directions, operating hours
- "View Available Slots" button at bottom

### Step 11: List View
- Sortable/filterable list of parking locations
- Cards with image, name, distance, availability bar, price
- Pull-to-refresh support
- Loading skeletons

### Step 12: Slot Selection (Grid & List Views)
- **Grid view**: Visual parking lot layout with color-coded slots (available/occupied/selected/blocked)
- Slot tap selects with scale animation, legend overlay, zoom controls
- **List view**: Sectioned by floor with slot rows
- Selected slot footer slides up with "Proceed to Book" button
- Slot detail bottom sheet with features and pricing

### Step 13: Booking Summary & Confirmation
- Editable summary cards: parking location, selected slot, vehicle, duration picker (±1hr increments)
- Entry time display, price breakdown card
- "Confirm Selection" creates booking in Supabase with status `slot_selected`
- Success screen with summary and Phase 2 teaser (payment, QR code coming soon)
- Auto-navigates to home after 5 seconds

### Step 14: My Vehicles & Profile Screens
- **My Vehicles**: List of vehicle cards with 3-dot menu (edit, set default, disable, delete)
- Edit vehicle form (pre-filled), disable modal with duration/reason, delete confirmation with checkbox
- Empty state for no vehicles
- **Profile**: Gradient header with avatar, menu items (vehicles, coming soon badges for payments/history, notifications toggle, help, terms, about, logout)
- Logout confirmation alert

### Step 15: Real-Time Updates & Seed Data
- Supabase Realtime subscriptions for parking_slots (live availability)
- Seed 12-15 Chennai/Tambaram area parking locations with 30-60 slots each
- Randomized availability, pricing (₹20-50/hr), facilities, ratings
- Sample test vehicles

### Step 16: Polish & Native Features
- Smooth 300ms page transitions throughout
- Pull-to-refresh on scrollable lists
- Capacitor plugins: Geolocation, Haptics, Status Bar, Keyboard handling, App lifecycle
- Safe area handling for notches/home indicators
- Offline caching with indicator
- Performance optimization: lazy loading, virtual scrolling, code splitting

---

## Key Technical Decisions
- **Maps**: Mock/placeholder map for now, Google Maps integration later
- **Auth**: Phone/OTP via Supabase (requires Twilio configuration)
- **Backend**: User's own Supabase project
- **Mobile**: Capacitor set up from the start for native distribution
- **State**: Zustand for global state management
- **Routing**: Hash routing (#/) for Capacitor compatibility

