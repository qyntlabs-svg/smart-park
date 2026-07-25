// Screen: C-43 · Primitives: Location, Availability, Pricing, Provider, Reservation
//
// Chat UI backed by mockAssistantReply(). Pattern-matches "cheapest charger",
// "parking near <place>", "when should I service" — returns structured cards
// with CTAs into other screens.
//
// Route: /ai/chat

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  Zap,
  ParkingCircle,
  Wrench,
  Car,
  Route as RouteIcon,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  useChatHistory,
  useClearChat,
  useSendChatMessage,
} from "@/modules/consumer/ai/hooks";
import type { ChatCard } from "@/modules/consumer/ai/types";

const SUGGESTED = [
  "Cheapest charger near me",
  "Parking near Marina beach",
  "When should I service?",
  "Plan a trip to Bangalore",
];

const AiConciergeChatScreen = () => {
  const navigate = useNavigate();
  const { data: messages = [], isLoading } = useChatHistory();
  const send = useSendChatMessage();
  const clear = useClearChat();

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, send.isPending]);

  const submit = async (raw?: string) => {
    const t = (raw ?? text).trim();
    if (!t || send.isPending) return;
    setText("");
    try {
      await send.mutateAsync(t);
    } catch {
      /* toast handled elsewhere */
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-bold text-foreground truncate">
            AI Concierge
          </p>
          <p className="text-caption text-muted-foreground truncate">
            Ask about chargers, parking, service
          </p>
        </div>
        <button
          onClick={() => clear.mutate()}
          className="text-caption text-destructive font-semibold px-2 py-1 rounded-lg active:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPick={submit} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <p className="text-body-sm whitespace-pre-wrap">{m.text}</p>
                  {m.cards && m.cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.cards.map((c, i) => (
                        <AssistantCard key={i} card={c} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {send.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl px-3 py-2 bg-card border border-border">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "120ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "240ms" }}
                />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested chips */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="shrink-0 h-8 px-3 rounded-full border border-border bg-card text-caption font-semibold text-foreground active:scale-[0.97]"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="bg-card border-t border-border px-4 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything…"
            className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-body-sm outline-none"
          />
          <button
            onClick={() => submit()}
            disabled={!text.trim() || send.isPending}
            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-[0.97]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Sub-components ----------

const EmptyState = ({ onPick }: { onPick: (t: string) => void }) => (
  <div className="pt-6 pb-10 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
      <Sparkles className="w-7 h-7 text-primary" />
    </div>
    <p className="mt-3 text-body font-bold text-foreground">
      Hi, I'm your concierge
    </p>
    <p className="mt-1 text-body-sm text-muted-foreground">
      Try one of these to get started:
    </p>
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {SUGGESTED.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="h-9 px-3 rounded-full border border-border bg-card text-body-sm text-foreground active:scale-[0.97]"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

const AssistantCard = ({ card }: { card: ChatCard }) => {
  const navigate = useNavigate();
  const Icon =
    card.icon === "zap"
      ? Zap
      : card.icon === "parking"
        ? ParkingCircle
        : card.icon === "wrench"
          ? Wrench
          : card.icon === "route"
            ? RouteIcon
            : Car;
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-foreground">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-bold truncate">{card.title}</p>
          {card.subtitle && (
            <p className="text-caption text-muted-foreground truncate">
              {card.subtitle}
            </p>
          )}
          {card.detailLines && (
            <ul className="mt-1 text-caption text-muted-foreground">
              {card.detailLines.map((l, i) => (
                <li key={i}>• {l}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {card.route && (
        <button
          onClick={() => navigate(card.route!)}
          className="mt-2 w-full h-9 rounded-lg border border-primary/30 text-primary text-body-sm font-semibold flex items-center justify-center gap-1 active:scale-[0.97]"
        >
          {card.ctaLabel ?? "Open"}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AiConciergeChatScreen;
