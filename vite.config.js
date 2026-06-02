import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// 部署到 GitHub Pages 项目站点：https://<用户名>.github.io/EasyMd/
// 因此 base 必须是 "/EasyMd/"。若改用 Vercel/Netlify 或根路径自定义域名，
// 把 base 改回 "/"，并把下方 manifest 的 start_url / scope 一并改回 "/"。
const base = "/EasyMd/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "EasyMd · Markdown 阅读",
        short_name: "EasyMd",
        description: "安静、舒适的 Markdown 阅读与文件管理工具",
        lang: "zh-CN",
        start_url: base,
        scope: base,
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
        navigateFallback: base + "index.html",
      },
    }),
  ],
  server: { host: true, port: 5173 },
});
