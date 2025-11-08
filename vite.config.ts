import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";
import { fileURLToPath, URL } from "node:url";
// import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    // mkcert(),
    AutoImport({
      imports: ["react", "react-router-dom"],
      dirs: ["src/hooks/**", "src/store/**", "src/api/**", "src/utils/**"],
      dts: "src/types/auto-imports.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const name = id.toString().split("node_modules/")[1].split("/")[0].toString();
            return `vendor-${name}`;
          }
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },
});
