import type { MetadataRoute } from "next";

/**
 * Next.js 16 App Router Web App Manifest (FR-070)
 * Compliant with W3C Web App Manifest specification for PWA installability.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PageCast — Low-Bandwidth Teletext",
    short_name: "PageCast",
    description: "AI-powered, ultra-low-bandwidth, offline-first Teletext broadcast platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#000000",
    orientation: "any",
    scope: "/",
    categories: ["news", "magazines", "utilities"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
