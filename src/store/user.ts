import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  token: string;
  user: any;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      token: "",
      user: {
        ID: 0,
        username: "",
        address: "",
        email: "",
        twitter: "",
        Role: "",
      },
      setToken: (token: string) => set({ token }),
      setUser: (user: any) => set({ user }),
    }),
    {
      name: "user",
    },
  ),
);
