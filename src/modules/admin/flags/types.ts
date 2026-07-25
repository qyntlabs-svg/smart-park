// A-10 Feature Flags — domain types.

export type FlagKind = "boolean" | "rollout" | "city_list";

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  kind: FlagKind;
  enabled: boolean;
  rolloutPct?: number;
  cities?: string[];
  updatedAt: string;
  updatedBy?: string;
}

export const ALL_CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi-NCR", "Pune"];
