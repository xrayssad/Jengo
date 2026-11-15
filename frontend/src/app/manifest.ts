import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jengo",
    short_name: "Jengo",
    description: "Rooms, stays, shops and materials",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#F2EDE4",
    theme_color: "#4F5A3A",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
