import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  currentLang: string;
  dark: boolean;
  setCurrentLang: (lang: string) => void;
  setDark: (dark: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    set => ({
      dark: false,
      currentLang: "zh-cn",
      setCurrentLang: (lang: string) => set({ currentLang: lang }),
      setDark: (dark: boolean) => set({ dark }),
    }),
    {
      name: "config",
    },
  ),
);
