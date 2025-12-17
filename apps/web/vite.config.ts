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
        // Skip waiting and claim clients immediately for faster updates
        // This ensures users get the latest version without needing incognito
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old caches on new version
        cleanupOutdatedCaches: true,
        // Allow larger JS bundles to be precached (default is 2MB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Exclude API routes from service worker interception
        // This ensures credentials are properly passed to the server
        navigateFallbackDenylist: [/^\/api/, /^\/rpc/],
        // Don't cache API/RPC responses - match all HTTP methods including POST
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/(api|rpc)\/.*/,
            handler: "NetworkOnly",
            method: "POST",
          },
          {
            urlPattern: /^https?:\/\/.*\/(api|rpc)\/.*/,
            handler: "NetworkOnly",
            method: "GET",
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
