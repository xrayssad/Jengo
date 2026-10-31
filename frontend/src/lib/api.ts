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
  phones?: string[];
  phone?: string;
};

const TOKEN_KEY = "jengo_token";
const USER_KEY = "jengo_user";

export type AuthUser = {
  access_token: string;
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

export function saveAuth(data: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Error ${res.status}`;
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
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
  return request<{ ok: boolean }>("/auth/resend", {
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
  const data = await request<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ident, phone: ident, password }),
  });
  saveAuth(data);
  return data;
}

const GOOGLE_OFF = "Google is not connected in Supabase. Turn on the Google provider, or log in with email.";

function googleError(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("provider") || text.includes("not enabled") || text.includes("validation")) {
    return GOOGLE_OFF;
  }
  return raw || GOOGLE_OFF;
}

async function googleClientId(redirectTo: string) {
  const envId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  let clientId = envId;
  let authorizeUrl = "";
  try {
    const res = await request<{ url: string; client_id?: string }>(
      `/auth/google?redirect_to=${encodeURIComponent(redirectTo)}`,
    );
    authorizeUrl = res.url || "";
    clientId = res.client_id || envId;
  } catch (err) {
    if (!clientId) throw new Error(googleError(err instanceof Error ? err.message : GOOGLE_OFF));
  }
  if (!clientId && authorizeUrl) {
    try {
      const probe = await fetch(`/api/google-client?url=${encodeURIComponent(authorizeUrl)}`);
      const body = (await probe.json()) as { client_id?: string };
      clientId = body.client_id || "";
    } catch {
      clientId = "";
    }
  }
  return clientId;
}

async function finishGoogleToken(token: string, nonce: string) {
  const { getSupabase } = await import("./supabase");
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token,
    nonce,
  });
  if (error || !data.session?.access_token) {
    throw new Error(error?.message || GOOGLE_OFF);
  }
  const user = await adoptSession(data.session.access_token);
  window.location.href = afterAuthPath(user);
}

async function googleOAuthRedirect(redirectTo: string) {
  const { getSupabase } = await import("./supabase");
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw new Error(googleError(error.message));
}

export async function startGoogle(redirectTo: string) {
  const { googleClosed, originBlocked, requestGoogleIdToken } = await import("./googleAuth");
  const clientId = await googleClientId(redirectTo);
  if (clientId) {
    try {
      const { token, nonce } = await requestGoogleIdToken(clientId);
      await finishGoogleToken(token, nonce);
      return;
    } catch (err) {
      if (googleClosed(err)) return;
      if (!originBlocked(err)) {
        throw err instanceof Error ? err : new Error(GOOGLE_OFF);
      }
    }
  }
  await googleOAuthRedirect(redirectTo);
}

export async function adoptSession(accessToken: string) {
  const data = await request<AuthUser>("/auth/session", {
    method: "POST",
    body: JSON.stringify({ access_token: accessToken }),
  });
  saveAuth(data);
  return data;
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
    needs_username: data.needs_username ?? false,
  });
  return data;
}

export async function fetchMe() {
  return request<AuthUser>("/auth/me");
}

export async function refreshAuth(): Promise<AuthUser | null> {
  const current = getAuthUser();
  if (!current?.access_token) return null;
  const data = await fetchMe();
  const admin = data.role === "admin" || Boolean(data.is_admin);
  const next: AuthUser = {
    ...current,
    ...data,
    access_token: current.access_token,
    role: admin ? "admin" : "user",
    is_admin: admin,
  };
  saveAuth(next);
  return next;
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
  chumba_nyumba: "Houses / Rooms",
  apartment_airbnb: "Apartment & Airbnb",
  store_godown: "Godown / Store",
  frame: "Shop frames",
  vifaa: "Building materials",
};

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

export async function uploadPhoto(file: File) {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_URL}/uploads`, { method: "POST", headers, body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Error ${res.status}`;
    throw new Error(detail);
  }
  return data as { url: string };
}

