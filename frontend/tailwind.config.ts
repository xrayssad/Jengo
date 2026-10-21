import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7FBFD",
        surface: "#D6E6EF",
        primary: "#7FA6B8",
        dark: "#2A3E4B",
      },
      fontFamily: {
        sans: ["var(--font-quicksand)"],
        serif: ["var(--font-playfair)"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
export default config;
