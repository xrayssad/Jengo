const LISTINGS_KEY = "jengo_my_listings";
const BOOKINGS_KEY = "jengo_my_bookings";

export type SavedBooking = {
  listing_id: string;
  title: string;
  message: string;
  created_at: string;
};

export function rememberListing(id: string) {
  if (typeof window === "undefined" || !id) return;
  const cur = readIds();
  if (!cur.includes(id)) cur.unshift(id);
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(cur.slice(0, 100)));
}

export function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function rememberBooking(b: SavedBooking) {
  if (typeof window === "undefined") return;
  const cur = readBookings();
  cur.unshift(b);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cur.slice(0, 100)));
}

export function readBookings(): SavedBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
