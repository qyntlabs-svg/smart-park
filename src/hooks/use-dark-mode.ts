import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DarkModeStore {
  isDark: boolean;
  toggle: () => void;
}

export const useDarkMode = create<DarkModeStore>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const next = !get().isDark;
        document.documentElement.classList.toggle("dark", next);
        set({ isDark: next });
      },
    }),
    {
      name: "dark-mode",
      onRehydrateStorage: () => (state) => {
        if (state?.isDark) {
          document.documentElement.classList.add("dark");
        }
      },
    }
  )
);
