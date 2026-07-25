// Geographic helpers shared across modules (extracted from src/lib/mechanic.ts).
// Kept in shared/ so consumer/partner/mechanic/ev/rental modules can all import from
// a single canonical location without cross-module dependencies.

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance between two coordinates, in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Round to one decimal place for display. */
export function formatKm(km: number): string {
  return `${Math.round(km * 10) / 10} km`;
}

/** Default dispatch radius used by the mobile-mechanic + EV/rental discovery flows. */
export const DEFAULT_DISCOVERY_RADIUS_KM = 12;
