import { create } from "zustand";
import czImg from "@/assets/roles/cz.png";

interface RoleState {
  role: Role; //当前角色
  setRole: (role: Role) => void; //设置角色
}
export interface Role {
  name: string;
  img: string;
  modelurl: string;
  enableStrongLight: boolean;
  chain: "bsc" | "solana";
  vehicleurl?: string;
  vehiclepos?: { x: number; y: number; z: number };
  vehiclerot?: { x: number; y: number; z: number };
  theme: string;
}

// 角色状态管理
export const useRoleStore = create<RoleState>()(set => ({
  role: {
    name: "cz",
    img: czImg,
    modelurl: "/model/cz.glb",
    enableStrongLight: false,
    vehicleurl: "/model/bic_car.glb",
    chain: "bsc",
    theme: "",
  },
  setRole: (role: Role) => set({ role }),
}));
