import { createRoot } from "react-dom/client";
import App from "./App";
import { createAppKit } from "@reown/appkit/react";
import { ethersAdapter, networks, projectId } from "@/config/index";

createAppKit({
  adapters: [ethersAdapter],
  networks,
  projectId,
  themeMode: "light",
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    socials: false,
    email: false,
  },
  metadata: {
    name: "AppKit Vue Example",
    description: "AppKit Vue Example",
    url: window.location.origin,
    icons: ["https://avatars.githubusercontent.com/u/179229932?s=200&v=4"],
  },
});
// 从 localStorage 读取主题
createRoot(document.getElementById("root")!).render(<App />);
