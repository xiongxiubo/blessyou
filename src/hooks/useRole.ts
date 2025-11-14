import czImg from "@/assets/roles/cz.png";
import tolyImg from "@/assets/roles/toly.png";

export const useRole = () => {
  const roles: Role[] = [
    {
      name: "cz",
      img: czImg,
      modelurl: "/model/cz.glb",
      enableStrongLight: false,
      vehicleurl: "/model/bic_car.glb",
      chain: "bsc",
      theme: "",
    },
    {
      name: "toly",
      img: tolyImg,
      modelurl: "/model/toly.glb",
      enableStrongLight: true,
      vehicleurl: "/model/air.glb",
      vehiclepos: { x: 0, y: 3, z: 0 },
      vehiclerot: { x: -1, y: 0.5, z: -2 },
      chain: "solana",
      theme: "solana",
    },
  ];
  const { role, setRole } = useRoleStore();

  return { role, roles, setRole };
};
