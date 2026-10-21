import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nyumba Marketplace",
  description: "Nyumba, Maduka na Vifaa vya Ujenzi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sw" className={playfair.variable}>
      <body
        className="antialiased"
        style={{
          backgroundColor: "#FFF6ED",
          color: "#2E1A0F",
          fontFamily: "var(--font-playfair), Georgia, serif",
        }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
