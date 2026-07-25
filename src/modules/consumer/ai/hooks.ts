// Hooks for AI Concierge (C-43 chat, C-44 proactive).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appendChatMessage,
  clearChat,
  dismissProactiveSuggestion,
  getChatHistory,
  getProactiveSuggestions,
  mockAssistantReply,
  resetDismissedSuggestions,
} from "./store";
import type { ChatMessage } from "./types";
import { makeId } from "@/shared/lib/storage";

const KEYS = {
  chat: ["ai-chat"] as const,
  proactive: ["ai-proactive"] as const,
};

export const useProactiveSuggestions = () =>
  useQuery({
    queryKey: KEYS.proactive,
    queryFn: () => getProactiveSuggestions(),
  });

export const useDismissProactiveSuggestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dismissProactiveSuggestion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.proactive }),
  });
};

export const useResetProactiveDismissals = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetDismissedSuggestions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.proactive }),
  });
};

export const useChatHistory = () =>
  useQuery({
    queryKey: KEYS.chat,
    queryFn: () => getChatHistory(),
  });

export const useSendChatMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const userMsg: ChatMessage = {
        id: makeId("aim"),
        role: "user",
        text,
        createdAt: new Date().toISOString(),
      };
      await appendChatMessage(userMsg);
      // Fake ~250ms latency to feel like it's thinking.
      await new Promise((r) => setTimeout(r, 250));
      const reply = mockAssistantReply(text);
      const final = await appendChatMessage(reply);
      return final;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.chat }),
  });
};

export const useClearChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearChat(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.chat }),
  });
};
