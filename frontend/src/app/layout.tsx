import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jengo",
  description: "Chumba, nyumba, apartment, store na frame",
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
