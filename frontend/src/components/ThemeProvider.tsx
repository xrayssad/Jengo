"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, readTheme, resolvedTheme, THEME_KEY, type ThemeChoice, type ThemeName } from "@/lib/theme";

const ThemeCtx = createContext<{
  theme: ThemeName;
  preference: ThemeChoice;
  setTheme: (next: ThemeChoice) => void;
}>({
  theme: "light",
  preference: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

function isChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("light");
  const [preference, setPreference] = useState<ThemeChoice>("light");

  useEffect(() => {
    const applyChoice = (choice: ThemeChoice) => {
      setPreference(choice);
      setThemeState(resolvedTheme(choice));
      applyTheme(choice);
    };
    applyChoice(readTheme());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_KEY || !isChoice(e.newValue)) return;
      applyChoice(e.newValue);
    };
    const onTheme = (e: Event) => {
      const nextTheme = (e as CustomEvent).detail;
      if (isChoice(nextTheme)) {
        setPreference(nextTheme);
        setThemeState(resolvedTheme(nextTheme));
      }
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMedia = () => {
      if (localStorage.getItem(THEME_KEY) !== "system") return;
      setThemeState(resolvedTheme("system"));
      applyTheme("system");
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("jengo-theme", onTheme);
    media.addEventListener("change", onMedia);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jengo-theme", onTheme);
      media.removeEventListener("change", onMedia);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setTheme: (next: ThemeChoice) => {
        setPreference(next);
        setThemeState(resolvedTheme(next));
        applyTheme(next);
      },
    }),
    [preference, theme],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
