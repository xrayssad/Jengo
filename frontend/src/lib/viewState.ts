/** A full load starts with no region. A reload also drops saved scroll and filters. */

const BROWSE_PREFIX = "jengo_browse:";
const LIST_KEY = "jengo_list_session_v1";

let prepared = false;

export function prepareFreshView() {
  if (prepared || typeof window === "undefined") return;
  prepared = true;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") {
      sessionStorage.removeItem(LIST_KEY);
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith(BROWSE_PREFIX)) sessionStorage.removeItem(key);
      }
    }
    const url = new URL(window.location.href);
    if (!url.searchParams.has("region")) return;
    url.searchParams.delete("region");
    const state = { ...(window.history.state || {}) } as Record<string, unknown>;
    delete state.jengoRegion;
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(state, "", next);
  } catch {
    /* private mode */
  }
}

if (typeof window !== "undefined") prepareFreshView();
