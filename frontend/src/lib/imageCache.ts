const CACHE = "jengo-images-v1";
const META = "jengo_image_lru";
const MAX_COUNT = 60;
const MAX_BYTES = 30 * 1024 * 1024;

type Row = { url: string; bytes: number; at: number };

function readMeta(): Row[] {
  try {
    const raw = JSON.parse(localStorage.getItem(META) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((row): row is Row => Boolean(row) && typeof row.url === "string" && typeof row.bytes === "number");
  } catch {
    return [];
  }
}

function writeMeta(rows: Row[]) {
  try {
    localStorage.setItem(META, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

function cacheable(url: string) {
  return Boolean(url) && !url.startsWith("blob:") && !url.startsWith("data:");
}

export async function cachedImage(url: string): Promise<string | null> {
  if (!cacheable(url) || typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(url);
    if (!hit) return null;
    const blob = await hit.blob();
    if (!blob.size || (blob.type && !blob.type.startsWith("image/"))) return null;
    const rows = readMeta().filter((row) => row.url !== url);
    rows.push({ url, bytes: blob.size, at: Date.now() });
    writeMeta(rows);
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export function rememberImage(url: string) {
  if (!cacheable(url) || typeof caches === "undefined") return;
  void (async () => {
    try {
      const cache = await caches.open(CACHE);
      if (await cache.match(url)) {
        const rows = readMeta().map((row) => (row.url === url ? { ...row, at: Date.now() } : row));
        writeMeta(rows);
        return;
      }
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return;
      const blob = await res.blob();
      if (!blob.size || (blob.type && !blob.type.startsWith("image/"))) return;
      const rows = readMeta().filter((row) => row.url !== url).sort((a, b) => a.at - b.at);
      rows.push({ url, bytes: blob.size, at: Date.now() });
      let total = rows.reduce((sum, row) => sum + row.bytes, 0);
      const dropped: string[] = [];
      while (rows.length > MAX_COUNT || total > MAX_BYTES) {
        const oldest = rows.shift();
        if (!oldest) break;
        total -= oldest.bytes;
        dropped.push(oldest.url);
      }
      await Promise.all(dropped.map((item) => cache.delete(item)));
      await cache.put(url, new Response(blob, { headers: { "Content-Type": blob.type || "image/jpeg" } }));
      writeMeta(rows);
    } catch {
      /* a failed store must not replace a photo that already loaded */
    }
  })();
}
