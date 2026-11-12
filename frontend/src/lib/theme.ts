export const THEME_KEY = "jengo_theme";
export const OTP_LEN = 8;

export type ThemeName = "light" | "dark";

export const THEME_BOOT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",dark?"dark":"light");document.documentElement.classList.toggle("dark",dark)}catch(e){}})();`;

export function readTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: ThemeName) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("jengo-theme", { detail: theme }));
}
