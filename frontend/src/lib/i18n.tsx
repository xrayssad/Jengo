"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en.json";
import sw from "@/locales/sw.json";
import { readScoped, writeScoped } from "./userScope";

export const LANG_KEY = "jengo_lang";
export type Lang = "en" | "sw";

const dictionaries: Record<Lang, Record<string, string>> = { en, sw };

export const LANG_BOOT = `(function(){try{var id="guest";var raw=localStorage.getItem("jengo_user");if(raw){var u=JSON.parse(raw);if(u&&u.user_id)id=u.user_id}var s=localStorage.getItem("jengo:"+id+":lang");if(s==null&&id==="guest")s=localStorage.getItem("${LANG_KEY}");var nav=(navigator.languages&&navigator.languages[0])||navigator.language||"";var l=s==="sw"||s==="en"?s:(String(nav).toLowerCase().indexOf("sw")===0?"sw":"en");document.documentElement.lang=l==="sw"?"sw":"en";document.documentElement.setAttribute("data-lang",l)}catch(e){}})();`;

export function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = readScoped("lang");
    if (saved === "en" || saved === "sw") return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  return nav.toLowerCase().startsWith("sw") ? "sw" : "en";
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let text = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

type I18nValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nCtx = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => dictionaries.en[key] ?? key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const apply = () => {
      const next = detectLang();
      setLangState(next);
      document.documentElement.lang = next === "sw" ? "sw" : "en";
      document.documentElement.setAttribute("data-lang", next);
    };
    apply();
    window.addEventListener("jengo-user-reset", apply);
    window.addEventListener("jengo-prefs", apply);
    return () => {
      window.removeEventListener("jengo-user-reset", apply);
      window.removeEventListener("jengo-prefs", apply);
    };
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      writeScoped("lang", next);
      void import("./api").then((api) => api.pushPreferences({ language: next }));
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next === "sw" ? "sw" : "en";
    document.documentElement.setAttribute("data-lang", next);
  };

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}

export function useT() {
  return useContext(I18nCtx).t;
}
