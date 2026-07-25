// Screen: G-09 · Primitives: Location, Provider
// Route: /city/:citySlug
//
// Public marketing per launch city (currently Chennai). Renders even for
// signed-out users — this route is mounted OUTSIDE <ProtectedRoute>.
// Full-width responsive landing page: hero → supply stats → charger map
// preview → download-app CTA → footer.

import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import {
  Zap,
  MapPin,
  ArrowRight,
  Smartphone,
  Wrench,
  Car,
  ShieldCheck,
} from "lucide-react";
import { useEvStations } from "@/modules/ev";

interface CityContent {
  slug: string;
  name: string;
  tagline: string;
  center: [number, number];
  zoom: number;
  areas: string[];
}

const CITIES: Record<string, CityContent> = {
  chennai: {
    slug: "chennai",
    name: "Chennai",
    tagline:
      "The reliable charging & parking network across T Nagar, Velachery, and OMR.",
    center: [13.03, 80.22],
    zoom: 12,
    areas: [
      "T Nagar",
      "Velachery",
      "OMR / Sholinganallur",
      "Anna Nagar",
      "Adyar",
      "Guindy",
    ],
  },
};

const CenterOnCity = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [map, center, zoom]);
  return null;
};

const CityLandingScreen = () => {
  const { citySlug } = useParams();
  const navigate = useNavigate();
  const city = CITIES[(citySlug ?? "chennai").toLowerCase()];
  const chennaiCenter: [number, number] = city?.center ?? [13.03, 80.22];
  const { data: stations = [], isLoading } = useEvStations({}, {
    lat: chennaiCenter[0],
    lng: chennaiCenter[1],
  });

  const stats = useMemo(() => {
    const totalConnectors = stations.reduce(
      (n, s) => n + s.connectors.reduce((m, c) => m + c.count, 0),
      0,
    );
    const availableNow = stations.reduce(
      (n, s) => n + s.connectors.reduce((m, c) => m + c.available, 0),
      0,
    );
    const avgRating =
      stations.length === 0
        ? 0
        : stations.reduce((n, s) => n + (s.rating ?? 0), 0) / stations.length;
    return {
      stations: stations.length,
      connectors: totalConnectors,
      available: availableNow,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  }, [stations]);

  if (!city) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
            City not yet available
          </div>
          <h1 className="mt-2 text-3xl font-bold">
            We haven't launched here yet.
          </h1>
          <p className="mt-2 text-muted-foreground">
            SmartPark is currently live in Chennai. Explore the Chennai
            network below.
          </p>
          <Link
            to="/city/chennai"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-semibold"
          >
            Go to Chennai <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold text-body">SmartPark</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px]">
            <a href="#network" className="hover:text-primary">
              Network
            </a>
            <a href="#services" className="hover:text-primary">
              Services
            </a>
            <a href="#download" className="hover:text-primary">
              Download
            </a>
          </nav>
          <button
            onClick={() => navigate("/role-select")}
            className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-[12px] font-semibold"
          >
            Open app
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/10" />
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider px-3 py-1">
              <MapPin className="w-3 h-3" /> {city.name}
            </div>
            <h1 className="mt-4 text-4xl lg:text-5xl font-black leading-tight">
              Charge, park & repair —{" "}
              <span className="text-primary">one app for {city.name}.</span>
            </h1>
            <p className="mt-4 text-[15px] lg:text-lg text-muted-foreground max-w-lg">
              {city.tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#download"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 font-semibold"
              >
                <Smartphone className="w-4 h-4" /> Download the app
              </a>
              <a
                href="#network"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-semibold"
              >
                See the map <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {city.areas.map((a) => (
                <span
                  key={a}
                  className="text-[11px] rounded-full bg-muted px-3 py-1"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Right: KPI grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Charging stations",
                value: stats.stations,
                icon: Zap,
                tone: "text-primary",
              },
              {
                label: "Chargers deployed",
                value: stats.connectors,
                icon: MapPin,
                tone: "text-emerald-500",
              },
              {
                label: "Available right now",
                value: stats.available,
                icon: ShieldCheck,
                tone: "text-cyan-500",
              },
              {
                label: "Avg. rating",
                value: `${stats.avgRating || "—"}★`,
                icon: Car,
                tone: "text-amber-500",
              },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <k.icon className={`w-4 h-4 ${k.tone}`} />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </span>
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums">
                  {isLoading ? "…" : k.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Network map */}
      <section id="network" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-14">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                Network
              </div>
              <h2 className="text-3xl font-bold mt-1">Every plug on one map</h2>
              <p className="text-muted-foreground text-[14px] mt-1 max-w-lg">
                See live charger availability across {city.name} — updated in
                real time by our partner stations.
              </p>
            </div>
            <a
              href="#download"
              className="text-primary font-semibold text-[13px] inline-flex items-center gap-1"
            >
              Get the app for live routing <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden h-[420px] bg-muted">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-[13px] text-muted-foreground">
                Loading network…
              </div>
            ) : stations.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-[13px] text-muted-foreground">
                We're bringing stations online soon.
              </div>
            ) : (
              <MapContainer
                center={city.center}
                zoom={city.zoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <CenterOnCity center={city.center} zoom={city.zoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stations.map((s) => {
                  const available = s.connectors.reduce(
                    (n, c) => n + c.available,
                    0,
                  );
                  return (
                    <CircleMarker
                      key={s.id}
                      center={[s.lat, s.lng]}
                      radius={10 + Math.min(20, available * 3)}
                      pathOptions={{
                        color: available > 0 ? "#22c55e" : "#f97316",
                        fillColor: available > 0 ? "#22c55e" : "#f97316",
                        fillOpacity: 0.35,
                        weight: 1.5,
                      }}
                    >
                      <Popup>
                        <div style={{ fontSize: 12 }}>
                          <b>{s.name}</b>
                          <br />
                          {available} of{" "}
                          {s.connectors.reduce((n, c) => n + c.count, 0)} guns
                          free
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-16">
          <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
            What's inside
          </div>
          <h2 className="text-3xl font-bold mt-1">More than charging</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "EV charging",
                body: "Reserve a plug before you leave. AC & DC, all major connectors, live availability.",
              },
              {
                icon: Car,
                title: "Parking rentals",
                body: "Covered bays, monthly & weekly, near work or home.",
              },
              {
                icon: Wrench,
                title: "On-demand mechanics",
                body: "In-shop bookings or a mobile mechanic to you. One receipt, one warranty.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="text-body font-bold mt-3">{s.title}</div>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-16">
          <div className="rounded-3xl bg-primary text-primary-foreground p-8 lg:p-12 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold">Download SmartPark</h2>
              <p className="mt-2 text-primary-foreground/80 max-w-xl">
                Reserve chargers, park by the month, book a mechanic — all in
                one app. Free to download.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-5 py-3 font-semibold"
              >
                <Smartphone className="w-4 h-4" />
                Get on Android
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-5 py-3 font-semibold"
              >
                <Smartphone className="w-4 h-4" />
                Get on iOS
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground">
          <div>
            © {new Date().getFullYear()} SmartPark · Live in {city.name}
          </div>
          <div className="flex gap-4">
            <Link to="/terms-privacy" className="hover:text-foreground">
              Terms & privacy
            </Link>
            <Link to="/about" className="hover:text-foreground">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CityLandingScreen;
