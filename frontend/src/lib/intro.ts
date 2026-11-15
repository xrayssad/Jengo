/** Login sets this before the full-page redirect. The intro clears it when it finishes. */
export const INTRO_PENDING_KEY = "jengo_intro_pending";

export function isListingDeepLink(path: string) {
  return path.startsWith("/tangazo/") || path.startsWith("/listing/");
}

export function markIntroPending() {
  try {
    sessionStorage.setItem(INTRO_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("jengo-intro"));
}

export function introPending() {
  try {
    return sessionStorage.getItem(INTRO_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearIntroPending() {
  try {
    sessionStorage.removeItem(INTRO_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** Full page loads and a fresh login. Not back/forward, deep links, or a silent token refresh. */
export function introShouldPlay() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  if (isListingDeepLink(path)) return false;
  const pending = introPending();
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type === "back_forward" && !pending) return false;
  return true;
}
