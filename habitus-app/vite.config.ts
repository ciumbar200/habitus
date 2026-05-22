import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@habitus/core": path.resolve(__dirname, "../packages/habitus-core/src/index.ts"),
    },
  },
  optimizeDeps: {
    // Paquete local vía alias: no pre-bundlear (evita exports obsoletos en .vite/deps).
    exclude: ["@habitus/core"],
  },
  server: {
    fs: { allow: [".."] },
  },
});
