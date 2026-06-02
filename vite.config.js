import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/easy-md/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/apple-touch-icon.png", "favicon.svg"],
      manifest: {
        name: "EasyMd · Markdown 阅读",
        short_name: "EasyMd",
        description: "安静、舒适的 Markdown 阅读与文件管理工具",
        lang: "zh-CN",
        start_url: "/easy-md/",
        scope: "/easy-md/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FAF9F6",
        theme_color: "#FAF9F6",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: { host: true, port: 5173 },
});
