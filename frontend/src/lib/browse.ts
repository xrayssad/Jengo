import type { Listing } from "./api";

export const REGIONS = [
  "Dar es Salaam",
  "Mwanza",
  "Arusha",
  "Dodoma",
  "Mbeya",
  "Morogoro",
  "Zanzibar",
] as const;

export type SortKey = "new" | "price_asc" | "price_desc" | "views" | "featured";
export type ViewMode = "grid" | "list";

export const VIEW_KEY = "jengo_listing_view";
const STATE_PREFIX = "jengo_browse:";

export type BrowsePersist = {
  region: string;
  sort: SortKey;
  view: ViewMode;
  y: number;
  nearLat?: number | null;
  nearLng?: number | null;
};

export type NearPoint = { lat: number; lng: number };

const SORTS = new Set<SortKey>(["new", "price_asc", "price_desc", "views", "featured"]);

export function readView(): ViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function writeView(mode: ViewMode) {
  try {
    localStorage.setItem(VIEW_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function browseKey(path: string) {
  return `${STATE_PREFIX}${path || "/"}`;
}

export function readBrowse(path: string): BrowsePersist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(browseKey(path));
    if (!raw) return null;
    const data = JSON.parse(raw) as BrowsePersist;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function writeBrowse(path: string, data: BrowsePersist) {
  try {
    sessionStorage.setItem(browseKey(path), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function isSortKey(value: string): value is SortKey {
  return SORTS.has(value as SortKey);
}

export function sellerVerified(item: Listing): boolean {
  if (item.owner && typeof item.owner.verified === "boolean") return item.owner.verified;
  if (typeof item.owner_verified === "boolean") return item.owner_verified;
  return item.verified === true;
}

function asCount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function viewCount(item: Listing): number | null {
  return asCount(item.views ?? item.views_count ?? item.view_count);
}

export function formatViews(n: number): string {
  if (n > 999) {
    const k = n / 1000;
    const text = k >= 10 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, "");
    return `${text}k`;
  }
  return String(Math.max(0, Math.round(n)));
}

export function bedCount(item: Listing): number | null {
  if (item.category !== "chumba_nyumba" && item.category !== "apartment_airbnb") return null;
  return asCount(item.bedrooms ?? item.beds ?? item.rooms);
}

export function shortPlace(item: Listing): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  const push = (value?: string | null) => {
    for (const bit of String(value || "").split(",")) {
      const text = bit.trim();
      if (!text) continue;
      const key = text.toLowerCase();
      if (key === "tanzania" || key === "tz" || seen.has(key)) continue;
      seen.add(key);
      parts.push(text);
    }
  };
  push(item.location);
  push(item.city);
  return parts.slice(0, 2).join(", ");
}

export function regionsFor(items: Listing[]): string[] {
  const known = REGIONS.map((region) => region.toLowerCase());
  const extra: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const city = (item.city || "").trim();
    if (!city || city.length > 32) continue;
    const key = city.toLowerCase();
    if (seen.has(key)) continue;
    if (known.some((region) => key === region || key.includes(region) || region.includes(key))) continue;
    seen.add(key);
    extra.push(city);
  }
  extra.sort((a, b) => a.localeCompare(b));
  return [...REGIONS, ...extra];
}

export function inRegion(item: Listing, region: string): boolean {
  const blob = `${item.city || ""} ${item.location || ""}`.toLowerCase();
  return blob.includes(region.toLowerCase());
}

export function priceOf(item: Listing): number {
  const n = typeof item.price === "string" ? parseFloat(item.price) : Number(item.price);
  return Number.isFinite(n) ? n : 0;
}

export function createdAt(item: Listing): number {
  const t = item.created_at ? Date.parse(item.created_at) : 0;
  return Number.isNaN(t) ? 0 : t;
}

function asCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function pointOf(item: Listing): { lat: number; lng: number } | null {
  const lat = asCoord(item.lat);
  const lng = asCoord(item.lng);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function hasCoords(item: Listing): boolean {
  return pointOf(item) != null;
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const radius = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const h = s1 * s1 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * s2 * s2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function anyFeatured(items: Listing[]): boolean {
  return items.some((item) => item.featured === true);
}

export function sortListings(items: Listing[], sort: SortKey): Listing[] {
  const next = items.slice();
  next.sort((a, b) => {
    if (sort === "price_asc") return priceOf(a) - priceOf(b) || createdAt(b) - createdAt(a);
    if (sort === "price_desc") return priceOf(b) - priceOf(a) || createdAt(b) - createdAt(a);
    if (sort === "views") return (viewCount(b) || 0) - (viewCount(a) || 0) || createdAt(b) - createdAt(a);
    if (sort === "featured") return Number(b.featured === true) - Number(a.featured === true) || createdAt(b) - createdAt(a);
    return createdAt(b) - createdAt(a);
  });
  return next;
}

/** Keep listings we can place, nearest first. Prefer a local radius when any fall inside it. */
export function nearListings(items: Listing[], near: NearPoint): Listing[] {
  const ranked = items.flatMap((item) => {
    const point = pointOf(item);
    if (!point) return [];
    return [{ item, distance: distanceKm(near.lat, near.lng, point.lat, point.lng) }];
  });
  ranked.sort((a, b) => a.distance - b.distance);
  const close = ranked.filter((row) => row.distance <= 80);
  return (close.length ? close : ranked).map((row) => row.item);
}
