import type { NextConfig } from "next";
import { SHOW_LANDING_PAGE } from "./src/lib/productFlags";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    const rules: { source: string; destination: string; permanent: boolean }[] = [
      { source: "/matangazo-yangu", destination: "/mypost", permanent: true },
      { source: "/listing/:id", destination: "/tangazo/:id", permanent: false },
      { source: "/nyumba", destination: "/home?category=rooms-houses", permanent: false },
      { source: "/rooms", destination: "/home?category=rooms-houses", permanent: false },
      { source: "/houses", destination: "/home?category=rooms-houses", permanent: false },
      { source: "/chumba", destination: "/home?category=rooms-houses", permanent: false },
      { source: "/viwanja", destination: "/home?category=plots", permanent: false },
      { source: "/plots", destination: "/home?category=plots", permanent: false },
    ];
    if (!SHOW_LANDING_PAGE) {
      rules.unshift({ source: "/", destination: "/home", permanent: false });
    }
    return rules;
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
