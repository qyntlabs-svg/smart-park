// AI Concierge types (C-43 chat, C-44 proactive feed).

export type ProactiveKind =
  | "charge_now"
  | "book_covered_parking"
  | "service_due"
  | "savings_recap"
  | "renew_pass";

export const PROACTIVE_KIND_LABEL: Record<ProactiveKind, string> = {
  charge_now:           "Reach with 12% — reserve a charger?",
  book_covered_parking: "Rain in 2h — book covered parking?",
  service_due:          "Service due in 400 km",
  savings_recap:        "You saved ₹1,240 this month",
  renew_pass:           "Monthly pass renews in 3 days",
};

export interface ProactiveSuggestion {
  id: string;
  kind: ProactiveKind;
  title: string;
  body: string;
  /** Route the primary CTA jumps to. */
  ctaRoute: string;
  /** Label for that CTA. */
  ctaLabel: string;
  /** Optional secondary label ("Dismiss" if omitted). */
  secondaryLabel?: string;
  createdAt: string;
  emoji: string;
}

// ---- Chat ----

export type ChatRole = "user" | "assistant";

export interface ChatCard {
  /** Small structured card the assistant can render inline. */
  title: string;
  subtitle?: string;
  /** Optional route the "Open" button navigates to. */
  route?: string;
  ctaLabel?: string;
  icon?: "zap" | "parking" | "wrench" | "car" | "route";
  detailLines?: string[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  cards?: ChatCard[];
  createdAt: string;
}
