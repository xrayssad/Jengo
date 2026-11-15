/** Pure view-count helpers. The server decides whether a dwell is a new view. */

export type Counted = {
  id: string;
  views_count?: number | null;
  views?: number | null;
  view_count?: number | null;
  views_7d?: number | null;
};

export function dwellReached(elapsedMs: number, dwellMs = 1500) {
  return elapsedMs >= dwellMs;
}

export function countOf(item: Counted): number | null {
  const raw = item.views_count ?? item.views ?? item.view_count;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function withCount<T extends Counted>(item: T, views: number): T {
  return { ...item, views_count: views, views };
}

/** Copy newer counts onto the cards already on screen. Order stays put. */
export function mergeCounts<T extends Counted>(shown: T[], fresh: T[]): T[] {
  const byId = new Map(fresh.filter((item) => item?.id).map((item) => [item.id, item]));
  return shown.map((item) => {
    const next = byId.get(item.id);
    if (!next) return item;
    const incoming = countOf(next);
    const current = countOf(item);
    const views = incoming == null ? current : current == null ? incoming : Math.max(current, incoming);
    if (views == null) return item;
    return { ...item, views_count: views, views, views_7d: next.views_7d ?? item.views_7d };
  });
}

/** New rows go in front. Rows already visible keep their order, with fresh counts. */
export function mergeRefresh<T extends Counted>(shown: T[], fresh: T[]): T[] {
  const updated = mergeCounts(shown, fresh);
  const seen = new Set(updated.map((item) => item.id));
  const added = fresh.filter((item) => item?.id && !seen.has(item.id));
  return [...added, ...updated];
}
