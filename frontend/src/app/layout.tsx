import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import AppShell from "@/components/AppShell";
import ThemeProvider from "@/components/ThemeProvider";
import { THEME_BOOT } from "@/lib/theme";
import "./globals.css";

const playfair = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jengo",
  description: "Rooms, houses, apartments, stores and shop frames",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Script id="jengo-theme" strategy="beforeInteractive">
          {THEME_BOOT}
        </Script>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
