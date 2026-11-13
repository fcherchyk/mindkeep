import type { ManifestOptions } from "vite-plugin-pwa";

/** The web app manifest: what the browser needs to install MindKeep as an app. */
export const manifest: Partial<ManifestOptions> = {
  name: "MindKeep",
  short_name: "MindKeep",
  description: "Calm daily exercises for memory and attention.",
  lang: "en",
  display: "standalone",
  start_url: "./",
  background_color: "#f7f5f0",
  theme_color: "#1f4e79",
  icons: [
    { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
