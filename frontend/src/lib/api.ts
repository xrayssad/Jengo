const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type AuthUser = {
  access_token: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
};

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
  created_at?: string;
};

const TOKEN_KEY = "jengo_token";
const USER_KEY = "jengo_user";

export function demoLogin(email: string, full_name?: string): AuthUser {
  const data: AuthUser = {
    access_token: "demo-token",
    user_id: "demo-user",
    email: email || "demo@jengo.app",
    full_name: full_name || "Mtumiaji Demo",
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
  }
  return data;
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

export async function register(email: string, _p: string, full_name: string) {
  return demoLogin(email, full_name);
}

export async function login(email: string, _p: string) {
  return demoLogin(email);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token && token !== "demo-token") {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
    throw new Error(detail);
  }
  return data as T;
}

export async function fetchListings(params?: {
  category?: string;
  q?: string;
  status?: string;
}): Promise<{ items: Listing[] }> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.q) sp.set("q", params.q);
  sp.set("status", params?.status || "active");
  const qs = sp.toString();
  try {
    const data = await request<{ items?: Listing[]; error?: string }>(
      `/listings?${qs}`
    );
    return { items: data.items || [] };
  } catch {
    return { items: [] };
  }
}

export async function createListing(body: {
  category: string;
  title: string;
  description?: string;
  price: number;
  period: string;
  location: string;
  city?: string;
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
