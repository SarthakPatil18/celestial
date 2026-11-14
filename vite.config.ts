import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api/dsn": {
        target: "https://eyes.nasa.gov",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dsn/, "/apps/dsn-now/data"),
      },
      "/api/trek": {
        target: "https://trek.nasa.gov",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trek/, ""),
      },
    },
  },
});