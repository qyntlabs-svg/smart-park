// Insights module types: covers health score (C-47), energy insights (C-48),
// savings summary (C-49), streaks/milestones (C-50).

export interface HealthScore {
  vehicleId: string;
  score: number;                 // 0-100
  band: "poor" | "fair" | "good" | "excellent";
  updatedAt: string;
  categories: HealthCategory[];
  recommendations: HealthRecommendation[];
}

export interface HealthCategory {
  key: string;                   // "brakes", "battery", "service", "tyres"…
  label: string;
  score: number;                 // 0-100
  note?: string;
}

export interface HealthRecommendation {
  id: string;
  title: string;
  body: string;
  cta?: { label: string; route: string };
}

export interface EnergyMonth {
  month: string;                 // "Apr", "May"…
  kwh: number;
  cost: number;
  costPerKm: number;
}

export interface CityAverage {
  kwh: number;
  cost: number;
  costPerKm: number;
}

export interface SavingsMonth {
  month: string;
  saved: number;                 // ₹ vs petrol
}

export interface StreakState {
  weeksActive: number;
  currentWeekActive: boolean;
  lastActiveWeek: string;         // ISO date
  badges: Badge[];
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  unlockedAt?: string;            // undefined = still locked
  emoji: string;
}
