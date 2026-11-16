import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/home",
    name: "Jengo",
    short_name: "Jengo",
    description: "Nyumba, malazi, maduka na vifaa. Rooms, stays, shops and materials.",
    lang: "sw",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#14231A",
    theme_color: "#4F5A3A",
    categories: ["shopping", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Post a listing",
        short_name: "Post",
        description: "Weka tangazo jipya",
        url: "/weka-tangazo",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Search",
        short_name: "Search",
        description: "Tafuta nyumba, duka au malazi",
        url: "/search",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Home",
        description: "Browse rooms, shops and stays on Jengo",
      },
      {
        src: "/screenshots/listing.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Listing",
        description: "Open a listing, see the price, and contact the owner",
      },
    ] as unknown as MetadataRoute.Manifest["screenshots"],
  };
}
