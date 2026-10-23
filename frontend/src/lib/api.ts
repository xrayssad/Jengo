const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type AuthUser = {
  access_token: string;
  user_id: string;
  full_name?: string | null;
  phone?: string | null;
};

const TOKEN_KEY = "jengo_token";
const USER_KEY = "jengo_user";

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

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

export async function register(phone: string, password: string, full_name: string) {
  const data = await request<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ phone, password, full_name }),
  });
  saveAuth(data);
  return data;
}

export async function login(phone: string, password: string) {
  const data = await request<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
  saveAuth(data);
  return data;
}

export async function fetchListings(params?: { category?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.q) sp.set("q", params.q);
  const qs = sp.toString();
  return request<{ items: unknown[] }>(`/listings${qs ? `?${qs}` : ""}`);
}

export async function createListing(body: {
  category: string;
  title: string;
  description?: string;
  price: number;
  period: string;
  location: string;
  city?: string;
}) {
  return request("/listings", { method: "POST", body: JSON.stringify(body) });
}
