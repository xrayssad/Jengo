export type SavedImage = {
  id: string;
  listing_id: string;
  title: string;
  url: string;
  saved_at: string;
};

const KEY = "jengo_saved_images";

export function readSavedImages(): SavedImage[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function isImageSaved(listingId: string, url: string) {
  return readSavedImages().some((x) => x.listing_id === listingId && x.url === url);
}

export function toggleSavedImage(listingId: string, title: string, url: string): boolean {
  const cur = readSavedImages();
  const exists = cur.some((x) => x.listing_id === listingId && x.url === url);
  const next = exists
    ? cur.filter((x) => !(x.listing_id === listingId && x.url === url))
    : [{ id: crypto.randomUUID(), listing_id: listingId, title, url, saved_at: new Date().toISOString() }, ...cur];
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, 200)));
  return !exists;
}
