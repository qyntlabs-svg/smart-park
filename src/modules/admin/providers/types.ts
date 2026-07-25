// A-04 Provider Directory — domain types.

export type ProviderTab = "parking" | "ev" | "mechanic" | "tow";
export type ProviderState = "active" | "paused" | "suspended";

export interface ProviderRow {
  id: string;
  name: string;
  tab: ProviderTab;
  city: string;
  contact: string;
  listings: number;
  rating: number;
  gmv30d: number;
  state: ProviderState;
  onboardedAt: string;
}

export const TAB_LABEL: Record<ProviderTab, string> = {
  parking: "Parking Vendors",
  ev: "Charging Operators",
  mechanic: "Mechanic Shops",
  tow: "Tow Operators",
};

export const STATE_LABEL: Record<ProviderState, string> = {
  active: "Active",
  paused: "Paused",
  suspended: "Suspended",
};
