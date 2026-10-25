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
};

const TOKEN_KEY = "jengo_token";
const USER_KEY = "jengo_user";

export type AuthUser = {
  access_token: string;
  user_id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
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
        : `Hitilafu ${res.status}`;
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export async function register(body: {
  email: string;
  password: string;
  username: string;
  full_name: string;
}) {
  return request<{ ok: boolean; email: string; needs_verify?: boolean }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyEmail(email: string, code: string) {
  const data = await request<AuthUser>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  saveAuth(data);
  return data;
}

export async function resendOtp(email: string) {
  return request<{ ok: boolean }>("/auth/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
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

export async function login(email: string, password: string) {
  const data = await request<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveAuth(data);
  return data;
}

const GOOGLE_OFF = "Google haijaunganishwa kwenye Supabase. Washa provider ya Google, au ingia kwa barua pepe.";

function googleError(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("provider") || text.includes("not enabled") || text.includes("validation")) {
    return GOOGLE_OFF;
  }
  return raw || GOOGLE_OFF;
}

export async function startGoogle(redirectTo: string) {
  try {
    await request<{ url: string }>(`/auth/google?redirect_to=${encodeURIComponent(redirectTo)}`);
  } catch (err) {
    throw new Error(googleError(err instanceof Error ? err.message : GOOGLE_OFF));
  }
  const { getSupabase } = await import("./supabase");
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw new Error(googleError(error.message));
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
}): Promise<{ items: Listing[] }> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.q) sp.set("q", params.q);
  if (params?.mine) sp.set("mine", "true");
  else sp.set("status", params?.status || "active");
  if (params?.sort) sp.set("sort", params.sort);
  const data = await request<{ items?: Listing[] }>(`/listings?${sp}`);
  return { items: data.items || [] };
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
    mwezi: "/mwezi",
    miezi_3: "/miezi 3",
    miezi_6: "/miezi 6",
    mwaka: "/mwaka",
    usiku: "/usiku",
    siku: "/siku",
    wiki: "/wiki",
  };
  return period ? map[period] || `/${period}` : "";
}

export const catLabel: Record<string, string> = {
  chumba_nyumba: "Chumba & Nyumba",
  apartment_airbnb: "Apartment & Airbnb",
  store_godown: "Store & Godown",
  frame: "Frame za Maduka",
  vifaa: "Vifaa vya Ujenzi",
};

const RENTAL_PERIODS = new Set(["mwezi", "miezi_3", "miezi_6", "mwaka", "usiku", "siku", "wiki"]);

export function unitLabel(unit?: string | null) {
  const map: Record<string, string> = {
    mfuko: "mfuko",
    tani: "tani",
    kipande: "kipande",
    dei: "dei",
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
