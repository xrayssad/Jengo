import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import AppShell from "@/components/AppShell";
import BootSplash from "@/components/BootSplash";
import ThemeProvider from "@/components/ThemeProvider";
import { I18nProvider, LANG_BOOT } from "@/lib/i18n";
import { DEVICE_BOOT } from "@/lib/device";
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
  description: "Rooms & Houses, Apartment & Airbnb, Shop Frames and Building Materials",
  applicationName: "Jengo",
  appleWebApp: { capable: true, title: "Jengo", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Jengo",
    description: "Rooms & Houses, Apartment & Airbnb, Shop Frames and Building Materials",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Jengo" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4E7C9" },
    { media: "(prefers-color-scheme: dark)", color: "#14231A" },
  ],
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <BootSplash />
        <Script id="jengo-boot" strategy="beforeInteractive">
          {`setTimeout(function(){if(document.documentElement.getAttribute("data-app")==="1")return;var n=document.getElementById("boot-splash");if(!n)return;n.classList.add("is-failed");n.removeAttribute("aria-hidden");},12000);`}
        </Script>
        <Script id="jengo-theme" strategy="beforeInteractive">
          {THEME_BOOT}
        </Script>
        <Script id="jengo-device" strategy="beforeInteractive">
          {DEVICE_BOOT}
        </Script>
        <Script id="jengo-lang" strategy="beforeInteractive">
          {LANG_BOOT}
        </Script>
        <ThemeProvider>
          <I18nProvider>
            <AppShell>
              {children}
              {modal}
            </AppShell>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
