/** Per-account browser storage. Guest data never becomes another user's data. */

export type AccountShape = {
  user_id?: string;
  access_token?: string;
  refresh_token?: string;
  phone?: string | null;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  role?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  verified_type?: "individual" | "business" | null;
  [key: string]: unknown;
};

const USER_KEY = "jengo_user";

const LEGACY: Record<string, string> = {
  theme: "jengo_theme",
  lang: "jengo_lang",
  region: "jengo_region",
  recent_regions: "jengo_recent_regions",
  profile_name: "jengo_profile_name",
  liked: "jengo_liked_ids",
  saved: "jengo_saved_posts",
  searches: "jengo_saved_searches",
  recent_search: "jengo_recent_searches",
  feed: "jengo_feed_cache_v1",
  inbox: "jengo_inbox_cache",
  draft: "jengo_listing_draft",
  saved_images: "jengo_saved_images",
  chat_index: "jengo_chat_index",
  inbox_hidden: "jengo_inbox_hidden",
  inbox_archived: "jengo_inbox_archived",
  view: "jengo_listing_view",
  jobs: "jengo_jobs_cache",
};

/** The signed-in person already on this device claims the old shared keys once. */
function claimLegacy(id: string) {
  if (id === "guest") return;
  const flag = "jengo_scope_claimed";
  if (localStorage.getItem(flag)) return;
  localStorage.setItem(flag, id);
  for (const [name, legacy] of Object.entries(LEGACY)) {
    const own = scopedStorageKey(name, id);
    if (localStorage.getItem(own) != null) continue;
    const old = localStorage.getItem(legacy);
    if (old == null) continue;
    localStorage.setItem(own, old);
    localStorage.removeItem(legacy);
  }
}

export function scopeIdFrom(rawUser: string | null): string {
  if (!rawUser) return "guest";
  try {
    const id = (JSON.parse(rawUser) as { user_id?: unknown }).user_id;
    return typeof id === "string" && id ? id : "guest";
  } catch {
    return "guest";
  }
}

export function scopeId(): string {
  if (typeof window === "undefined") return "guest";
  try {
    return scopeIdFrom(localStorage.getItem(USER_KEY));
  } catch {
    return "guest";
  }
}

export function scopedStorageKey(name: string, id = scopeId()): string {
  return `jengo:${id}:${name}`;
}

/** Logged-in accounts never fall back to the guest or legacy key. */
export function readScoped(name: string): string | null {
  if (typeof window === "undefined") return null;
  const id = scopeId();
  try {
    claimLegacy(id);
  } catch {
    /* ignore */
  }
  const own = localStorage.getItem(scopedStorageKey(name, id));
  if (own != null) return own;
  if (id !== "guest") return null;
  const legacy = LEGACY[name];
  if (!legacy) return null;
  const old = localStorage.getItem(legacy);
  if (old == null) return null;
  try {
    localStorage.setItem(scopedStorageKey(name, "guest"), old);
  } catch {
    /* ignore */
  }
  return old;
}

export function writeScoped(name: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(scopedStorageKey(name), value);
}

export function removeScoped(name: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(scopedStorageKey(name));
}

/** A different account replaces the previous one. Missing fields stay empty. */
export function mergeAccount<T extends AccountShape>(prev: T | null, data: T): T {
  const switching = Boolean(prev?.user_id && data.user_id && prev.user_id !== data.user_id);
  if (!prev || switching) {
    return { ...data, access_token: data.access_token || "", refresh_token: data.refresh_token };
  }
  return {
    ...prev,
    ...data,
    access_token: data.access_token || prev.access_token || "",
    refresh_token: data.refresh_token || prev.refresh_token,
  };
}

export function clearSharedSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("jengo_shown_v1");
    sessionStorage.removeItem("jengo_home_listings");
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("jengo_browse:")) sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
