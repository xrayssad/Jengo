import type { Listing } from "@/lib/api";

const LIKED = "jengo_liked_ids";
const SAVED = "jengo_saved_posts";

export type SavedPost = {
  id: string;
  title: string;
  price: number;
  period: string;
  location: string;
  city?: string;
  category?: string;
  description?: string;
  images?: string[];
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
  const cur = readJson<SavedPost[]>(SAVED, []);
  const exists = cur.some((p) => p.id === item.id);
  const next = exists
    ? cur.filter((p) => p.id !== item.id)
    : [
        {
          id: item.id,
          title: item.title,
          price: item.price,
          period: item.period,
          location: item.location,
          city: item.city,
          category: item.category,
          description: item.description,
          images: item.images,
          saved_at: new Date().toISOString(),
        },
        ...cur,
      ];
  localStorage.setItem(SAVED, JSON.stringify(next.slice(0, 200)));
  return !exists;
}

export function readSaved(): SavedPost[] {
  return readJson<SavedPost[]>(SAVED, []);
}
