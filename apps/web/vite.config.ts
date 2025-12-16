import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({}),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SYNERGY-GY",
        short_name: "SYNERGY-GY",
        description: "SYNERGY-GY - PWA Application",
        theme_color: "#0c0c0c",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true },
      workbox: {
        // Exclude API routes from service worker interception
        // This ensures credentials are properly passed to the server
        navigateFallbackDenylist: [/^\/api/, /^\/rpc/],
        // Don't cache API/RPC responses
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/(api|rpc)\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
