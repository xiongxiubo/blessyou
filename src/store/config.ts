import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  currentLang: "zh-cn" | "en";
  dark: boolean;
  setCurrentLang: (lang: "zh-cn" | "en") => void;
  setDark: (dark: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    set => ({
      dark: false,
      currentLang: "zh-cn",
      setCurrentLang: (lang: "zh-cn" | "en") => set({ currentLang: lang }),
      setDark: (dark: boolean) => set({ dark }),
    }),
    {
      name: "config",
    },
  ),
);
