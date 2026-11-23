import { readScoped, writeScoped } from "./userScope";

export const THEME_KEY = "jengo_theme";
export const OTP_LEN = 8;

export type ThemeName = "light" | "dark";
export type ThemeChoice = ThemeName | "system";

export const THEME_BOOT = `(function(){try{var id="guest";var raw=localStorage.getItem("jengo_user");if(raw){var u=JSON.parse(raw);if(u&&u.user_id)id=u.user_id}var t=localStorage.getItem("jengo:"+id+":theme");if(t==null&&id==="guest")t=localStorage.getItem("${THEME_KEY}");var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",dark?"dark":"light");document.documentElement.classList.toggle("dark",dark)}catch(e){}})();`;

export function readTheme(): ThemeChoice {
  if (typeof window === "undefined") return "light";
  const saved = readScoped("theme");
  if (saved === "dark" || saved === "light" || saved === "system") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolvedTheme(choice: ThemeChoice): ThemeName {
  if (typeof window === "undefined") return choice === "dark" ? "dark" : "light";
  if (choice === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return choice;
}

export function applyTheme(choice: ThemeChoice) {
  const dark = resolvedTheme(choice) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  try {
    writeScoped("theme", choice);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("jengo-theme", { detail: choice }));
}
