import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LoadingState {
  loading: boolean;
  tip: string;
  setLoading: (loading: boolean) => void;
  setTip: (tip: string) => void;
}

export const useLoadingStore = create<LoadingState>()(
  persist(
    set => ({
      loading: false,
      tip: "",
      setLoading: (loading: boolean) => set({ loading }),
      setTip: (tip: string) => set({ tip }),
    }),
    {
      name: "loading",
    },
  ),
);
