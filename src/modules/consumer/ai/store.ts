// AI mock store (C-43 / C-44). Two responsibilities:
//   1) Serve canned proactive suggestions (used by HomeScreen carousel + C-44).
//   2) Pattern-match user chat text and return a structured mock response.

import { makeId, readJson, writeJson } from "@/shared/lib/storage";
import type {
  ChatCard,
  ChatMessage,
  ProactiveSuggestion,
} from "./types";

const CHAT_KEY = "consumerAiChat";
const DISMISSED_KEY = "consumerAiDismissed";

// ---------- Proactive suggestions ----------

/** Canned 3 suggestions. Returned in the order most useful *right now*. */
export async function getProactiveSuggestions(): Promise<ProactiveSuggestion[]> {
  const dismissed = new Set(readJson<string[]>(DISMISSED_KEY, []));
  const all: ProactiveSuggestion[] = [
    {
      id: "ai-p-charge",
      kind: "charge_now",
      title: "You'll reach with 12%",
      body: "Based on today's trip, a top-up now saves you a scramble later.",
      ctaRoute: "/ev",
      ctaLabel: "Find a charger",
      secondaryLabel: "Not now",
      createdAt: new Date().toISOString(),
      emoji: "⚡",
    },
    {
      id: "ai-p-rain",
      kind: "book_covered_parking",
      title: "Rain forecast this evening",
      body: "Covered parking bays at T Nagar are 40% cheaper before 6pm.",
      ctaRoute: "/home",
      ctaLabel: "See covered spots",
      secondaryLabel: "Skip",
      createdAt: new Date().toISOString(),
      emoji: "🌧️",
    },
    {
      id: "ai-p-service",
      kind: "service_due",
      title: "Service due in 400 km",
      body: "Book a slot at a partner shop this week and get 10% off.",
      ctaRoute: "/mechanics",
      ctaLabel: "Book service",
      secondaryLabel: "Later",
      createdAt: new Date().toISOString(),
      emoji: "🛠️",
    },
    {
      id: "ai-p-savings",
      kind: "savings_recap",
      title: "You saved ₹1,240 this month",
      body: "Compared to petrol at ₹6/km. Tap to see the full breakdown.",
      ctaRoute: "/insights/savings",
      ctaLabel: "View savings",
      secondaryLabel: "Dismiss",
      createdAt: new Date().toISOString(),
      emoji: "🎉",
    },
  ];
  return all.filter((s) => !dismissed.has(s.id));
}

export async function dismissProactiveSuggestion(id: string): Promise<void> {
  const dismissed = readJson<string[]>(DISMISSED_KEY, []);
  if (dismissed.includes(id)) return;
  writeJson(DISMISSED_KEY, [...dismissed, id]);
}

export async function resetDismissedSuggestions(): Promise<void> {
  writeJson(DISMISSED_KEY, []);
}

// ---------- Chat ----------

export async function getChatHistory(): Promise<ChatMessage[]> {
  const existing = readJson<ChatMessage[]>(CHAT_KEY, []);
  if (existing.length > 0) return existing;
  const seed: ChatMessage = {
    id: makeId("aim"),
    role: "assistant",
    text:
      "Hi! I'm your mobility concierge. Ask me things like " +
      "\"cheapest charger near me\", \"parking near Marina beach\", " +
      "or \"when should I service my car?\"",
    createdAt: new Date().toISOString(),
  };
  writeJson(CHAT_KEY, [seed]);
  return [seed];
}

/**
 * Chat history is capped at the last {@link MAX_CHAT_MESSAGES} entries to keep
 * localStorage bounded even after long conversations. When the limit is
 * exceeded we drop the oldest messages first.
 */
const MAX_CHAT_MESSAGES = 200;

export async function appendChatMessage(msg: ChatMessage): Promise<ChatMessage[]> {
  const list = readJson<ChatMessage[]>(CHAT_KEY, []);
  const combined = [...list, msg];
  const next =
    combined.length > MAX_CHAT_MESSAGES
      ? combined.slice(combined.length - MAX_CHAT_MESSAGES)
      : combined;
  writeJson(CHAT_KEY, next);
  return next;
}

export async function clearChat(): Promise<void> {
  writeJson(CHAT_KEY, []);
}

/**
 * Fake LLM. Pattern-matches on the user query and returns a canned but
 * structured reply with 0-2 cards + CTAs into other screens.
 */
export function mockAssistantReply(userText: string): ChatMessage {
  const q = userText.toLowerCase();
  const now = new Date().toISOString();
  const id = makeId("aim");

  if (q.includes("cheap") && (q.includes("charg") || q.includes("kwh") || q.includes("ev"))) {
    const cards: ChatCard[] = [
      {
        title: "Auto Doc EcoCharge — Velachery",
        subtitle: "₹15 / kWh · 7.4 kW Type 2",
        route: "/ev",
        ctaLabel: "See on map",
        icon: "zap",
        detailLines: ["3.1 km away", "4 slots free"],
      },
      {
        title: "Auto Doc Volt Hub — T Nagar",
        subtitle: "₹18 / kWh · 60 kW CCS",
        route: "/ev",
        ctaLabel: "Reserve",
        icon: "zap",
        detailLines: ["2.4 km away", "2 slots free"],
      },
    ];
    return {
      id,
      role: "assistant",
      text: "Here are the cheapest fast chargers near you right now:",
      cards,
      createdAt: now,
    };
  }

  if (q.includes("parking") && (q.includes("near") || q.includes("beach") || q.includes("marina"))) {
    return {
      id,
      role: "assistant",
      text: "I found 2 well-rated parking spots near your area:",
      cards: [
        {
          title: "Marina Beach Public Lot",
          subtitle: "₹30/hr · 12 slots free",
          route: "/home",
          ctaLabel: "View on map",
          icon: "parking",
          detailLines: ["Open 24×7", "CCTV, attendant"],
        },
        {
          title: "Anna Square Parking",
          subtitle: "₹40/hr · covered · 4 slots",
          route: "/home",
          ctaLabel: "View on map",
          icon: "parking",
          detailLines: ["Shaded bays", "Walking distance to beach"],
        },
      ],
      createdAt: now,
    };
  }

  if (q.includes("service") || q.includes("mechanic")) {
    return {
      id,
      role: "assistant",
      text:
        "Based on your last service and daily use, your next service is due " +
        "in about 400 km. Here's a nearby partner shop with weekend slots:",
      cards: [
        {
          title: "SmartFix Auto — Adyar",
          subtitle: "Full service ₹2,999 · 4.6★",
          route: "/mechanics",
          ctaLabel: "Book slot",
          icon: "wrench",
          detailLines: ["Genuine parts", "Free pickup within 3 km"],
        },
      ],
      createdAt: now,
    };
  }

  if (q.includes("plan") || q.includes("trip") || q.includes("journey")) {
    return {
      id,
      role: "assistant",
      text: "I can auto-plan your journey with charging + parking stops.",
      cards: [
        {
          title: "Plan a journey",
          subtitle: "From, to, and I'll handle the stops",
          route: "/journey",
          ctaLabel: "Open planner",
          icon: "route",
        },
      ],
      createdAt: now,
    };
  }

  if (q.includes("sos") || q.includes("help") || q.includes("stuck") || q.includes("tow")) {
    return {
      id,
      role: "assistant",
      text: "If you need help right now, open SOS — I'll dispatch the nearest operator.",
      cards: [
        {
          title: "SOS assistance",
          subtitle: "Breakdown, tow, flat tyre…",
          route: "/sos",
          ctaLabel: "Open SOS",
          icon: "car",
        },
      ],
      createdAt: now,
    };
  }

  return {
    id,
    role: "assistant",
    text:
      "I can help with chargers, parking, service bookings, and journey plans. " +
      "Try asking: \"cheapest charger before airport\" or \"book service this weekend\".",
    createdAt: now,
  };
}
