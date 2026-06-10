import { create } from 'zustand';

interface ActiveChatState {
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  clearActiveChatId: () => void;
}

export const useActiveChatStore = create<ActiveChatState>((set) => ({
  activeChatId: null,
  setActiveChatId: (chatId) => set({ activeChatId: chatId }),
  clearActiveChatId: () => set({ activeChatId: null }),
}));
