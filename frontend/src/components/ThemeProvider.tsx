"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, readTheme, THEME_KEY, type ThemeName } from "@/lib/theme";

const ThemeCtx = createContext<{
  theme: ThemeName;
  setTheme: (next: ThemeName) => void;
}>({
  theme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

function firstTheme(): ThemeName {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(firstTheme);

  useEffect(() => {
    const next = readTheme();
    setThemeState(next);
    applyTheme(next);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_KEY) return;
      if (e.newValue === "dark" || e.newValue === "light") {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };
    const onTheme = (e: Event) => {
      const nextTheme = (e as CustomEvent).detail;
      if (nextTheme === "dark" || nextTheme === "light") setThemeState(nextTheme);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("jengo-theme", onTheme);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jengo-theme", onTheme);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next: ThemeName) => {
        setThemeState(next);
        applyTheme(next);
      },
    }),
    [theme],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
