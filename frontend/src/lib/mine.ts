import { getAuthUser } from "@/lib/api";

const LISTINGS_KEY = "jengo_my_listings";
const BOOKINGS_KEY = "jengo_my_bookings";

export type SavedBooking = {
  listing_id: string;
  title: string;
  message: string;
  created_at: string;
};

function scopedKey(base: string) {
  const uid = getAuthUser()?.user_id || "";
  return uid ? `${base}:${uid}` : "";
}

function readStringList(key: string) {
  if (typeof window === "undefined" || !key) return [];
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function rememberListing(id: string) {
  const key = scopedKey(LISTINGS_KEY);
  if (typeof window === "undefined" || !id || !key) return;
  const cur = readStringList(key);
  if (!cur.includes(id)) cur.unshift(id);
  localStorage.setItem(key, JSON.stringify(cur.slice(0, 100)));
}

export function readIds(): string[] {
  return readStringList(scopedKey(LISTINGS_KEY));
}

export function rememberBooking(b: SavedBooking) {
  const key = scopedKey(BOOKINGS_KEY);
  if (typeof window === "undefined" || !key) return;
  const cur = readBookings();
  cur.unshift(b);
  localStorage.setItem(key, JSON.stringify(cur.slice(0, 100)));
}

export function readBookings(): SavedBooking[] {
  const key = scopedKey(BOOKINGS_KEY);
  if (typeof window === "undefined" || !key) return [];
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
