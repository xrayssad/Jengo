"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "./ThemeProvider";

export function ThemeCircle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const night = theme === "dark";
  const Icon = night ? Sun : Moon;
  return (
    <button
      type="button"
      className="soft-icon-btn home-icon-btn"
      aria-label={night ? t("theme.light") : t("theme.dark")}
      onClick={() => setTheme(night ? "light" : "dark")}
    >
      <Icon size={18} color="currentColor" />
    </button>
  );
}

export function LangCircle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const next: Lang = lang === "sw" ? "en" : "sw";
  return (
    <button
      type="button"
      className={`soft-icon-btn home-icon-btn header-lang ${className}`.trim()}
      aria-label={t("language")}
      onClick={() => setLang(next)}
    >
      <span className="header-lang-label">{lang === "sw" ? "SW" : "EN"}</span>
    </button>
  );
}

export function LangDrawer() {
  const { lang, setLang, t } = useI18n();
  const pick = (next: Lang) => () => setLang(next);
  return (
    <div className="lang-in-drawer">
      <span className="text-sm">{t("language")}</span>
      <span className="lang-pair">
        <button type="button" aria-pressed={lang === "sw"} onClick={pick("sw")}>SW</button>
        <button type="button" aria-pressed={lang === "en"} onClick={pick("en")}>EN</button>
      </span>
    </div>
  );
}
