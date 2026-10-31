import type { Listing, Reel } from "@/lib/api";

const LIKED = "jengo_liked_ids";
const SAVED = "jengo_saved_posts";

export type SavedPost = {
  id: string;
  kind?: "listing" | "reel";
  title: string;
  price?: number | string;
  period?: string;
  location?: string;
  city?: string;
  category?: string;
  description?: string;
  images?: string[];
  video_url?: string;
  thumb_url?: string;
  owner_name?: string | null;
  owner_username?: string | null;
  saved_at: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function isLiked(id: string): boolean {
  return readJson<string[]>(LIKED, []).includes(id);
}

export function setLiked(id: string, on: boolean) {
  const cur = readJson<string[]>(LIKED, []).filter((x) => x !== id);
  if (on) cur.unshift(id);
  localStorage.setItem(LIKED, JSON.stringify(cur.slice(0, 500)));
}

export function isSaved(id: string): boolean {
  return readJson<SavedPost[]>(SAVED, []).some((p) => p.id === id);
}

export function toggleSaved(item: Listing): boolean {
  return writeSaved({
    id: item.id,
    kind: "listing",
    title: item.title,
    price: item.price,
    period: item.period,
    location: item.location,
    city: item.city,
    category: item.category,
    description: item.description,
    images: item.images,
    saved_at: new Date().toISOString(),
  });
}

export function toggleSavedReel(item: Reel): boolean {
  return writeSaved({
    id: item.id,
    kind: "reel",
    title: (item.caption || "").trim() || "Reel",
    description: item.caption,
    images: item.thumb_url ? [item.thumb_url] : [],
    video_url: item.video_url,
    thumb_url: item.thumb_url,
    owner_name: item.owner_name,
    owner_username: item.owner_username,
    saved_at: new Date().toISOString(),
  });
}

function writeSaved(item: SavedPost): boolean {
  const cur = readJson<SavedPost[]>(SAVED, []);
  const exists = cur.some((p) => p.id === item.id);
  const next = exists ? cur.filter((p) => p.id !== item.id) : [item, ...cur];
  localStorage.setItem(SAVED, JSON.stringify(next.slice(0, 200)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("jengo-saved"));
  }
  return !exists;
}

export function readSaved(): SavedPost[] {
  return readJson<SavedPost[]>(SAVED, []);
}
