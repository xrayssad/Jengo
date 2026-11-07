const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://jengo-qkq1.onrender.com";

export type Listing = {
  id: string;
  category?: string;
  title: string;
  description?: string;
  price: number | string;
  period?: string;
  location?: string;
  city?: string;
  status?: string;
  verified?: boolean;
  images?: string[];
  likes_count?: number;
  created_at?: string;
  unit?: string | null;
  stock?: number | null;
  owner_id?: string;
  owner_username?: string | null;
  owner_name?: string | null;
  phones?: string[];
  phone?: string;
};

const TOKEN_KEY = "jengo_token";
const USER_KEY = "jengo_user";

export type AuthUser = {
  access_token: string;
  refresh_token?: string;
  user_id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: "user" | "admin" | string;
  is_admin?: boolean;
  needs_username?: boolean;
};

export function afterAuthPath(user: AuthUser) {
  if (user.needs_username) return "/username";
  if (user.role === "admin" || user.is_admin) return "/admin";
  return "/home";
}

async function dropSupabaseSession() {
  try {
    const { getSupabase } = await import("./supabase");
    await getSupabase().auth.signOut({ scope: "local" });
  } catch {
    /* Google client may be missing */
  }
}

export function saveAuth(data: AuthUser) {
  if (typeof window === "undefined") return;
  const prev = getAuthUser();
  const next: AuthUser = {
    ...prev,
    ...data,
    access_token: data.access_token || prev?.access_token || "",
    refresh_token: data.refresh_token || prev?.refresh_token,
  };
  if (!next.access_token) return;
  localStorage.setItem(TOKEN_KEY, next.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(next));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  void dropSupabaseSession();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isSignedIn() {
  return Boolean(getAuthUser()?.access_token && getToken());
}

/** True when a local access or refresh token can still keep the user signed in. */
export function hasUsableSession() {
  const user = getAuthUser();
  if (!user) return false;
  return Boolean((user.access_token && getToken()) || user.refresh_token);
}

let renewing: Promise<AuthUser | null> | null = null;
let silentRenewTimer: number | null = null;
const SILENT_RENEW_MS = 48 * 60 * 1000;

async function parseJson(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { detail: text };
  }
}

function errorFrom(data: unknown, status: number) {
  const detail =
    typeof data === "object" && data && "detail" in data
      ? String((data as { detail: unknown }).detail)
      : `Error ${status}`;
  const err = new Error(detail) as Error & { status?: number };
  err.status = status;
  return err;
}

function isInvalidRefresh(status: number, data: unknown) {
  if (status === 401) return true;
  const detail =
    typeof data === "object" && data && "detail" in data
      ? String((data as { detail: unknown }).detail).toLowerCase()
      : "";
  return status === 400 && (detail.includes("session expired") || detail.includes("invalid") || detail.includes("refresh"));
}

async function renewSession(): Promise<AuthUser | null> {
  const current = getAuthUser();
  const refresh = current?.refresh_token;
  if (!refresh) return null;
  if (!renewing) {
    renewing = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        const data = await parseJson(await res.text());
        if (!res.ok) {
          // Only wipe the session on definitive refresh rejection — not on 5xx/network.
          if (isInvalidRefresh(res.status, data)) clearAuth();
          return null;
        }
        const next = data as AuthUser;
        if (!next?.access_token) {
          // Soft failure: keep existing tokens so a later renew can succeed.
          return null;
        }
        const admin = next.role === "admin" || Boolean(next.is_admin);
        const merged: AuthUser = {
          ...current,
          ...next,
          access_token: next.access_token,
          refresh_token: next.refresh_token || refresh,
          role: admin ? "admin" : "user",
          is_admin: admin,
        };
        saveAuth(merged);
        return merged;
      } catch {
        // Network/fetch blip — keep local session intact.
        return null;
      } finally {
        renewing = null;
      }
    })();
  }
  return renewing;
}

/** Quietly refresh access tokens while a refresh_token is stored. */
export function startSilentRenew() {
  if (typeof window === "undefined") return () => {};
  stopSilentRenew();
  silentRenewTimer = window.setInterval(() => {
    if (!getAuthUser()?.refresh_token) return;
    void renewSession();
  }, SILENT_RENEW_MS);
  return stopSilentRenew;
}

export function stopSilentRenew() {
  if (typeof window === "undefined") return;
  if (silentRenewTimer != null) {
    window.clearInterval(silentRenewTimer);
    silentRenewTimer = null;
  }
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await parseJson(await res.text());
  if (!res.ok) {
    if (res.status === 401 && !retried && path !== "/auth/refresh" && path !== "/auth/login") {
      const renewed = await renewSession();
      if (renewed) return request<T>(path, options, true);
    }
    throw errorFrom(data, res.status);
  }
  return data as T;
}

export async function register(body: {
  email?: string;
  phone?: string;
  password: string;
  username: string;
  full_name: string;
}) {
  await dropSupabaseSession();
  const data = await request<AuthUser & { ok?: boolean; email?: string; phone?: string; needs_verify?: boolean }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (data.access_token) saveAuth(data);
  return data;
}

export async function verifyOtp(ident: { email?: string; phone?: string }, code: string) {
  const data = await request<AuthUser>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email: ident.email || "", phone: ident.phone || "", code }),
  });
  saveAuth(data);
  return data;
}

export async function verifyEmail(email: string, code: string) {
  return verifyOtp({ email }, code);
}

export async function resendOtp(ident: string | { email?: string; phone?: string }) {
  const body = typeof ident === "string" ? { email: ident, phone: ident } : { email: ident.email || "", phone: ident.phone || "" };
  return request<{ ok: boolean; email?: string }>("/auth/resend", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function confirmEmailLink(tokenHash: string, type?: string) {
  const data = await request<AuthUser>("/auth/confirm", {
    method: "POST",
    body: JSON.stringify({ token_hash: tokenHash, type: type || "signup" }),
  });
  saveAuth(data);
  return data;
}

export async function login(ident: string, password: string) {
  await dropSupabaseSession();
  const data = await request<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: ident, password }),
  });
  // Email/password sessions must keep refresh_token for return visits.
  saveAuth(data);
  return getAuthUser() || data;
}

const GOOGLE_OFF = "Google is not connected in Supabase. Turn on the Google provider, or log in with email.";

function googleError(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("provider") || text.includes("not enabled") || text.includes("validation")) {
    return GOOGLE_OFF;
  }
  return raw || GOOGLE_OFF;
}

export async function startGoogle(redirectTo: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  await dropSupabaseSession();
  const { getSupabase } = await import("./supabase");
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw new Error(googleError(error?.message || GOOGLE_OFF));
  window.location.assign(data.url);
}

export async function adoptSession(accessToken: string, refreshToken?: string) {
  const data = await request<AuthUser>("/auth/session", {
    method: "POST",
    body: JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    }),
  });
  // Always persist Google/OAuth refresh when the client or server provides it.
  saveAuth({
    ...data,
    access_token: data.access_token || accessToken,
    refresh_token: data.refresh_token || refreshToken || undefined,
  });
  return getAuthUser() || data;
}

export async function setUsername(username: string, fullName?: string) {
  const data = await request<AuthUser>("/auth/username", {
    method: "POST",
    body: JSON.stringify({ username, full_name: fullName || "" }),
  });
  const current = getAuthUser();
  saveAuth({
    ...current,
    ...data,
    access_token: data.access_token || current?.access_token || "",
    refresh_token: data.refresh_token || current?.refresh_token,
    needs_username: data.needs_username ?? false,
  });
  return data;
}

export async function fetchMe() {
  return request<AuthUser>("/auth/me");
}

/**
 * Keep the browsing session alive when possible.
 * - If /auth/me works, merge profile and return.
 * - On 401, try refresh; only return null after definitive auth death (tokens cleared).
 * - On network/server blips, return the existing local session.
 */
export async function ensureFreshAuth(): Promise<AuthUser | null> {
  const current = getAuthUser();
  if (!current?.access_token && !current?.refresh_token) return null;

  if (!current.access_token && current.refresh_token) {
    const renewed = await renewSession();
    return renewed || getAuthUser();
  }

  try {
    const data = await fetchMe();
    // Re-read after request() may have renewed the session mid-call.
    const latest = getAuthUser() || current;
    const admin = data.role === "admin" || Boolean(data.is_admin);
    const next: AuthUser = {
      ...latest,
      ...data,
      access_token: latest.access_token,
      refresh_token: latest.refresh_token || current.refresh_token,
      role: admin ? "admin" : "user",
      is_admin: admin,
    };
    saveAuth(next);
    return next;
  } catch (err) {
    const status = err && typeof err === "object" && "status" in err ? Number((err as { status?: number }).status) : 0;
    if (status === 401) {
      // request() already attempted renew; try once more, then keep local if still present.
      const renewed = await renewSession();
      if (renewed) return renewed;
      return getAuthUser();
    }
    // Keep the local session if the network blips; stay signed in.
    return getAuthUser() || current;
  }
}

export async function refreshAuth(): Promise<AuthUser | null> {
  return ensureFreshAuth();
}

export type AdminStats = {
  users: number;
  listings: number;
  bookings: number;
  commission: number;
};

export type AdminUser = {
  id: string;
  username?: string | null;
  email?: string | null;
  role?: string;
  status?: string;
  full_name?: string | null;
};

export type AdminBooking = {
  id: string;
  listing_id: string;
  listing_title?: string;
  message?: string;
  status?: string;
  created_at?: string;
  quantity?: number | null;
  user_id?: string;
  commission_amount?: number | null;
};

export async function fetchAdminStats() {
  return request<AdminStats>("/admin/stats");
}

export async function fetchAdminUsers() {
  return request<{ items: AdminUser[] }>("/admin/users");
}

export async function fetchAdminListings() {
  return request<{ items: Listing[] }>("/admin/listings");
}

export async function fetchAdminBookings() {
  return request<{ items: AdminBooking[] }>("/admin/bookings");
}

export async function setAdminListingStatus(id: string, status: "active" | "hidden") {
  return request<Listing>(`/admin/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function setAdminUserStatus(id: string, status: "active" | "suspended") {
  return request<AdminUser>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchListings(params?: {
  category?: string;
  q?: string;
  sort?: string;
  status?: string;
  mine?: boolean;
  limit?: number;
}): Promise<{ items: Listing[] }> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.q) sp.set("q", params.q);
  if (params?.mine) sp.set("mine", "true");
  else sp.set("status", params?.status || "active");
  if (params?.sort) sp.set("sort", params.sort);
  sp.set("limit", String(params?.limit || 40));
  const data = await request<{ items?: Listing[] }>(`/listings?${sp}`);
  return { items: data.items || [] };
}

const HOME_LISTINGS_KEY = "jengo_home_listings";

export function readHomeListingsCache(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HOME_LISTINGS_KEY);
    const items = raw ? (JSON.parse(raw) as Listing[]) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function writeHomeListingsCache(items: Listing[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HOME_LISTINGS_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {
    /* quota */
  }
}

export async function fetchListing(id: string): Promise<Listing> {
  return request<Listing>(`/listings/${id}`);
}

export async function setListingStatus(id: string, status: "active" | "hidden" | "rejected") {
  return request<Listing>(`/listings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function createListing(body: {
  category: string;
  title: string;
  description?: string;
  price: number;
  period?: string;
  location: string;
  city?: string;
  images?: string[];
  likes_count?: number;
  unit?: string;
  stock?: number;
  lat?: number | null;
  lng?: number | null;
  phones?: string[];
}): Promise<Listing> {
  return request<Listing>("/listings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function formatPrice(price: number | string) {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(n)) return String(price);
  return n.toLocaleString("en-TZ");
}

export function periodLabel(period?: string) {
  const map: Record<string, string> = {
    mwezi: "/month",
    miezi_3: "/3 months",
    miezi_6: "/6 months",
    mwaka: "/year",
    usiku: "/night",
    siku: "/day",
    wiki: "/week",
  };
  return period ? map[period] || `/${period}` : "";
}

export const catLabel: Record<string, string> = {
  chumba_nyumba: "Rooms & Houses",
  apartment_airbnb: "Apartment & Airbnb",
  store_godown: "Shops Store & Godown",
  frame: "Shop Frames",
  vifaa: "Building Materials",
};

/** Short type labels for card / stat chips */
export const catShort: Record<string, string> = {
  chumba_nyumba: "Room",
  apartment_airbnb: "Airbnb",
  store_godown: "Godown",
  frame: "Shop",
  vifaa: "Materials",
};

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const shopCategories = ["frame"];

export function listingPhones(item: { phones?: string[]; phone?: string; description?: string } | null | undefined): string[] {
  if (!item) return [];
  const raw = item.phones?.length ? item.phones : item.phone ? [item.phone] : [];
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (n: string) => {
    const s = String(n || "").trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  for (const n of raw) push(n);
  if (!out.length && item.description) {
    const m = item.description.match(/(?:Simu|Phone):\s*(.+)$/m);
    if (m) for (const n of m[1].split(",")) push(n);
  }
  return out;
}

export function phoneTelHref(n: string) {
  const trimmed = n.trim();
  if (trimmed.startsWith("+")) return `tel:${trimmed}`;
  return `tel:${trimmed.replace(/\D/g, "")}`;
}

export function phoneWaHref(n: string) {
  let d = n.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 10) d = `255${d.slice(1)}`;
  return `https://wa.me/${d}`;
}

const RENTAL_PERIODS = new Set(["mwezi", "miezi_3", "miezi_6", "mwaka", "usiku", "siku", "wiki"]);

export function unitLabel(unit?: string | null) {
  const map: Record<string, string> = {
    mfuko: "bag",
    tani: "tonne",
    kipande: "piece",
    dei: "day",
  };
  if (!unit) return "";
  return map[unit] || unit;
}

export function listingUnit(item: { category?: string; unit?: string | null; period?: string }) {
  if (item.unit) return item.unit;
  if (item.category === "vifaa" && item.period && !RENTAL_PERIODS.has(item.period)) return item.period;
  return "";
}

export async function likeListing(id: string, on: boolean): Promise<number> {
  const data = await request<{ likes_count: number }>(`/listings/${id}/like`, {
    method: "POST",
    body: JSON.stringify({ on }),
  });
  return data.likes_count;
}

export type Reel = {
  id: string;
  caption?: string;
  video_url: string;
  thumb_url?: string;
  public_id?: string;
  likes_count?: number;
  created_at?: string;
  owner_id?: string;
  owner_username?: string | null;
  owner_name?: string | null;
};

export async function fetchReels(limit = 40) {
  return request<{ items: Reel[] }>(`/reels?limit=${limit}`);
}

export async function fetchMyReels(limit = 40) {
  return request<{ items: Reel[] }>(`/reels/mine?limit=${limit}`);
}

export async function fetchReel(id: string) {
  return request<Reel>(`/reels/${id}`);
}

export async function likeReel(id: string, on: boolean): Promise<number> {
  const data = await request<{ likes_count: number }>(`/reels/${id}/like`, {
    method: "POST",
    body: JSON.stringify({ on }),
  });
  return data.likes_count;
}

export async function createReel(body: { caption: string; video_url: string; public_id: string; thumb_url?: string }) {
  return request<Reel>("/reels", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const REEL_MAX_BYTES = 250 * 1024 * 1024;
export const REEL_MAX_SECONDS = 180;
const REEL_CHUNK = 6 * 1024 * 1024;

export type ReelUploadSign = {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
  upload_url: string;
  max_bytes: number;
  max_seconds?: number;
  eager?: string;
  eager_async?: boolean;
};

export async function signReelUpload() {
  return request<ReelUploadSign>("/reels/sign");
}

function reelUploadError(raw: string, status = 0) {
  const text = (raw || "").toLowerCase();
  if (text.includes("too large") || text.includes("file size") || status === 413) {
    return "This reel could not post. Use a video under 250MB";
  }
  if (text.includes("timeout") || text.includes("timed out") || status === 408) {
    return "This reel could not post. Try again on a stronger network";
  }
  if (text.includes("signature")) {
    return "This reel could not post. Check your connection and try again";
  }
  if (
    text.includes("unsupported") ||
    text.includes("codec") ||
    text.includes("format") ||
    text.includes("video file")
  ) {
    return "This reel could not post. Use an MP4 or MOV from the camera roll";
  }
  if (text.includes("duration") || text.includes("too long")) {
    return "This reel could not post. Keep it under 3 minutes";
  }
  return "This reel could not post. Check your connection and try again";
}

function cloudinaryMessage(parsed: Record<string, unknown>, fallback: string) {
  const err = parsed.error;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message || fallback);
  }
  if (typeof parsed.error === "string") return parsed.error;
  return fallback;
}

function guessVideoName(file: File) {
  const name = (file.name || "").trim();
  if (name && /\.[a-z0-9]{2,5}$/i.test(name)) return name;
  const type = (file.type || "").toLowerCase();
  if (type.includes("quicktime") || type.includes("mov")) return "reel.mov";
  if (type.includes("webm")) return "reel.webm";
  if (type.includes("3gpp") || type.includes("3gp")) return "reel.3gp";
  return "reel.mp4";
}

function normalizeReelFile(file: File) {
  const type = (file.type || "").trim() || "video/mp4";
  const name = guessVideoName(file);
  if (file.type === type && file.name === name) return file;
  return new File([file], name, { type, lastModified: file.lastModified });
}

function postCloudinaryChunk(opts: {
  url: string;
  body: FormData;
  uploadId?: string;
  range?: string;
  onProgress?: (loaded: number, total: number) => void;
}) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", opts.url);
    if (opts.uploadId) xhr.setRequestHeader("X-Unique-Upload-Id", opts.uploadId);
    if (opts.range) xhr.setRequestHeader("Content-Range", opts.range);
    xhr.timeout = 120000;
    xhr.upload.onprogress = (ev) => {
      if (!opts.onProgress || !ev.lengthComputable) return;
      opts.onProgress(ev.loaded, ev.total);
    };
    xhr.onerror = () => reject(new Error(reelUploadError("network")));
    xhr.ontimeout = () => reject(new Error(reelUploadError("timeout", 408)));
    xhr.onload = () => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(xhr.responseText || "{}") as Record<string, unknown>;
      } catch {
        reject(new Error(reelUploadError("", xhr.status)));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsed);
        return;
      }
      reject(new Error(reelUploadError(cloudinaryMessage(parsed, ""), xhr.status)));
    };
    xhr.send(opts.body);
  });
}

function reelForm(sign: ReelUploadSign, chunk: Blob, filename: string) {
  const body = new FormData();
  body.append("file", chunk, filename);
  body.append("api_key", sign.api_key);
  body.append("timestamp", String(sign.timestamp));
  body.append("signature", sign.signature);
  body.append("folder", sign.folder);
  if (sign.eager) body.append("eager", sign.eager);
  if (sign.eager_async) body.append("eager_async", "true");
  return body;
}

async function sendReelChunk(
  sign: ReelUploadSign,
  chunk: Blob,
  filename: string,
  headers: { uploadId?: string; range?: string },
  onProgress?: (loaded: number, total: number) => void,
) {
  let last: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await postCloudinaryChunk({
        url: sign.upload_url,
        body: reelForm(sign, chunk, filename),
        uploadId: headers.uploadId,
        range: headers.range,
        onProgress,
      });
    } catch (err) {
      last = err instanceof Error ? err : new Error(reelUploadError("network"));
      const msg = last.message.toLowerCase();
      if (msg.includes("mp4 or mov") || msg.includes("under 250mb") || msg.includes("under 3 minutes")) {
        throw last;
      }
      await new Promise((ok) => window.setTimeout(ok, 500 * (attempt + 1)));
    }
  }
  throw last || new Error(reelUploadError("network"));
}

export async function uploadReelVideo(file: File, onProgress?: (pct: number) => void) {
  const sign = await signReelUpload();
  const cap = Math.max(Number(sign.max_bytes) || 0, REEL_MAX_BYTES);
  if (file.size > cap) {
    throw new Error("This reel could not post. Use a video under 250MB");
  }
  const ready = normalizeReelFile(file);
  const mark = (pct: number) => onProgress?.(Math.max(0, Math.min(100, Math.round(pct))));
  let data: Record<string, unknown>;
  if (ready.size <= REEL_CHUNK) {
    data = await sendReelChunk(sign, ready, ready.name, {}, (loaded, total) => {
      mark((loaded / Math.max(total, 1)) * 100);
    });
  } else {
    const uploadId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let start = 0;
    data = {};
    while (start < ready.size) {
      const end = Math.min(start + REEL_CHUNK, ready.size) - 1;
      const slice = ready.slice(start, end + 1);
      data = await sendReelChunk(
        sign,
        slice,
        ready.name,
        { uploadId, range: `bytes ${start}-${end}/${ready.size}` },
        (loaded) => mark(((start + loaded) / ready.size) * 100),
      );
      start = end + 1;
    }
  }
  if (!data.secure_url || !data.public_id) {
    throw new Error(reelUploadError("network"));
  }
  const publicId = String(data.public_id);
  const cloud = sign.cloud_name;
  return {
    video_url: String(data.secure_url),
    public_id: publicId,
    thumb_url: cloud
      ? `https://res.cloudinary.com/${cloud}/video/upload/c_fill,f_jpg,g_center,h_1280,q_auto,so_0,w_720/${publicId}.jpg`
      : String(data.secure_url || "").replace("/video/upload/", "/video/upload/c_fill,f_jpg,g_center,h_1280,q_auto,so_0,w_720/").replace(/\.[a-z0-9]+$/i, ".jpg"),
  };
}

export type Booking = {
  id: string;
  listing_id: string;
  message?: string;
  status?: string;
  created_at?: string;
  quantity?: number | null;
  user_id?: string;
  commission_amount?: number | null;
  commission_rate?: number | null;
  review?: { rating: number; comment?: string } | null;
};

export async function createBooking(body: { listing_id: string; message?: string; quantity?: number }) {
  return request<Booking>("/bookings", { method: "POST", body: JSON.stringify(body) });
}

export async function fetchBookings(listingId?: string, mine?: "sent" | "incoming") {
  const sp = new URLSearchParams();
  if (listingId) sp.set("listing_id", listingId);
  if (mine) sp.set("mine", mine);
  const q = sp.toString();
  return request<{ items: Booking[] }>(`/bookings${q ? `?${q}` : ""}`);
}

export async function setBookingStatus(id: string, status: "accepted" | "rejected" | "moved_in") {
  return request<Booking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export type Review = {
  booking_id: string;
  listing_id?: string;
  rating: number;
  comment?: string;
};

export async function createReview(body: { booking_id: string; rating: number; comment?: string }) {
  return request<Review>("/reviews", { method: "POST", body: JSON.stringify(body) });
}

export async function fetchReviews(params?: { listing_id?: string; booking_id?: string }) {
  const sp = new URLSearchParams();
  if (params?.listing_id) sp.set("listing_id", params.listing_id);
  if (params?.booking_id) sp.set("booking_id", params.booking_id);
  const q = sp.toString();
  return request<{ items: Review[] }>(`/reviews${q ? `?${q}` : ""}`);
}

export type ChatMessage = {
  id: string;
  thread_key?: string;
  kind?: string;
  booking_id?: string | null;
  listing_id?: string | null;
  sender_id?: string;
  body: string;
  created_at?: string;
  mine?: boolean;
  sender_name?: string;
  title?: string;
  href?: string;
};

export async function fetchInbox() {
  return request<{ items: ChatMessage[] }>("/inbox");
}

export async function fetchBookingMessages(bookingId: string) {
  return request<{ items: ChatMessage[] }>(`/bookings/${bookingId}/messages`);
}

export async function sendBookingMessage(bookingId: string, body: string) {
  return request<ChatMessage>(`/bookings/${bookingId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function fetchListingDm(listingId: string, peer?: string) {
  const q = peer ? `?peer=${encodeURIComponent(peer)}` : "";
  return request<{ items: ChatMessage[]; title?: string; owner_id?: string }>(`/listings/${listingId}/dm${q}`);
}

export async function sendListingDm(listingId: string, body: string, peer?: string) {
  return request<ChatMessage>(`/listings/${listingId}/dm`, {
    method: "POST",
    body: JSON.stringify({ body, peer_id: peer || "" }),
  });
}

export type PlaceHit = {
  label: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  place_id?: string;
};

export async function suggestPlaces(q: string) {
  const sp = new URLSearchParams({ q });
  return request<{ items: PlaceHit[] }>(`/places?${sp}`);
}

export async function placeDetails(placeId: string) {
  const sp = new URLSearchParams({ place_id: placeId });
  return request<PlaceHit>(`/places/details?${sp}`);
}

export async function fetchMqttSession() {
  return request<{ url: string; topic: string; client_id: string; listing_prefix?: string }>("/realtime/mqtt");
}

export type JobOffer = {
  id: string;
  job_id?: string;
  worker_name: string;
  contact?: string;
  amount: number | string;
  message?: string;
  status?: "submitted" | "awarded" | "rejected" | string;
  created_at?: string;
};

export type Job = {
  id: string;
  owner_id?: string;
  title: string;
  description?: string;
  location?: string;
  city?: string;
  budget: number | string;
  deadline?: string;
  status?: "open" | "closed" | "awarded" | string;
  created_at?: string;
  images?: string[];
  connection_fee?: number | string;
  fee_size?: string;
  fee_label?: string;
  fee_range?: string;
  fee_status?: string;
  offers_count?: number;
  offers?: JobOffer[];
};

export type MyPostSkip = {
  id: string;
  kind?: string;
  reason?: string;
};

export async function fetchMyPosts(listingIds?: string[], reelIds?: string[]) {
  return request<{ listings: Listing[]; reels: Reel[]; jobs: Job[]; skipped?: MyPostSkip[] }>("/posts/mine", {
    method: "POST",
    body: JSON.stringify({ listing_ids: listingIds || [], reel_ids: reelIds || [] }),
  });
}

export async function fetchJobs(status = "open") {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  const data = await request<{ items?: Job[] }>(`/jobs?${sp}`);
  return { items: data.items || [] };
}

export async function fetchJob(id: string) {
  return request<Job>(`/jobs/${id}`);
}

export async function createJob(body: {
  title: string;
  description?: string;
  location: string;
  city?: string;
  budget?: number;
  deadline: string;
  images?: string[];
}) {
  return request<Job>("/jobs", { method: "POST", body: JSON.stringify(body) });
}

export async function createJobOffer(jobId: string, body: {
  worker_name: string;
  contact: string;
  amount: number;
  message?: string;
}) {
  return request<JobOffer>(`/jobs/${jobId}/offers`, { method: "POST", body: JSON.stringify(body) });
}

export async function awardJob(jobId: string, offerId: string) {
  return request<Job>(`/jobs/${jobId}/award`, { method: "POST", body: JSON.stringify({ offer_id: offerId }) });
}

export async function uploadPhoto(file: File, retried = false) {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_URL}/uploads`, { method: "POST", headers, body });
  const data = await parseJson(await res.text());
  if (!res.ok) {
    if (res.status === 401 && !retried) {
      const renewed = await renewSession();
      if (renewed) return uploadPhoto(file, true);
    }
    throw errorFrom(data, res.status);
  }
  return data as { url: string };
}

