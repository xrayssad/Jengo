/**
 * Product search over listings already loaded in the browser.
 *
 * GET /listings?q= on the API matches location and city only. It does not
 * search titles, descriptions, categories, or attributes, and it has no
 * trigram, synonym, or suggest route. Passing a product word to that
 * parameter would hide the right listings, so the home screen scores the
 * cached feed here and does not send q to that endpoint.
 *
 * Server contract, when search moves off the device:
 * - GET /search/suggest?q= → { listings, categories, locations, completions }
 * - GET /search/popular → { items: string[] }
 * - GET /listings?q=&category=&region= uses unaccent + full text and pg_trgm
 *   on title, description, and attribute text. Region stays a filter, not a
 *   text match, when the query is a known city.
 * - synonym(term, group_id) holds the groups in SYNONYM_GROUPS.
 * - A zero-result log stores query, region, and time.
 * Weights must stay aligned with scoreListing() so both sides rank the same way.
 */

import { canonicalCategory } from "./categories.config";
import { readScoped, removeScoped, writeScoped } from "./userScope";

export const SYNONYM_GROUPS: string[][] = [
  ["chumba", "room", "rooms"],
  ["nyumba", "house", "houses"],
  ["duka", "shop", "shops", "store", "stores", "fremu", "frame", "frames", "maduka"],
  ["godown", "ghala", "warehouse", "stoo", "storage"],
  ["simenti", "cement"],
  ["bati", "iron sheet", "ironsheet"],
  ["vigae", "tiles", "tile"],
  ["rangi", "paint"],
  ["taa", "light", "lamp", "lights"],
  ["mlango", "door", "doors"],
  ["dirisha", "window", "windows"],
  ["kupanga", "kodi", "kupangisha", "rent", "rental"],
  ["kuuza", "inauzwa", "nunua", "sale", "buy"],
  ["apartment", "apato"],
  ["airbnb", "short stay", "stay"],
  ["self-contained", "self contained", "selfcontained"],
  ["kiwanja", "viwanja", "plot", "plots", "land", "shamba", "ardhi", "hati", "survey", "upimaji", "kujenga"],
];

export const POPULAR_SEARCHES = [
  "chumba self-contained",
  "fremu ya duka",
  "godown Pugu",
  "simenti",
  "vigae",
];

const STOPWORDS = new Set([
  "ya", "na", "of", "the", "a", "an", "kwa", "la", "wa", "for", "in", "and", "ni", "za", "to",
]);

const NEAR_WORDS = ["near", "near me", "karibu", "karibu nami"];
const RECENT_KEY = "jengo_recent_searches";

export type SearchListing = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  city?: string;
  images?: string[];
  created_at?: string;
  price?: number | string;
  owner_verified?: boolean;
  is_verified?: boolean;
  verified?: boolean;
  owner?: { verified?: boolean; is_verified?: boolean } | null;
  lat?: number | null;
  lng?: number | null;
  amenities?: string[] | null;
  attributes?: unknown;
};

export type CategoryChoice = { id: string; label: string };

export type RankResult<T> = {
  exact: T[];
  related: T[];
  correction: string | null;
};

export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = new Array<number>(b.length + 1);
  const cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > 2) return 3;
    for (let j = 0; j <= b.length; j += 1) prev[j] = cur[j];
  }
  return prev[b.length] > 2 ? 3 : prev[b.length];
}

function tokens(value: string): string[] {
  return fold(value).split(" ").filter((word) => word && !STOPWORDS.has(word));
}

function groupOf(word: string): string[] {
  for (const group of SYNONYM_GROUPS) {
    const parts = group.flatMap((term) => fold(term).split(" ")).filter((part) => part && !STOPWORDS.has(part));
    if (parts.includes(word)) return parts;
  }
  return [word];
}

function literalHit(word: string, hay: string[]): "exact" | "prefix" | "fuzzy" | null {
  if (hay.includes(word)) return "exact";
  if (word.length >= 3 && hay.some((piece) => piece.startsWith(word) || (piece.length >= 3 && word.startsWith(piece) && piece.length + 1 >= word.length))) {
    return "prefix";
  }
  if (word.length >= 4 && hay.some((piece) => piece.length >= 4 && editDistance(word, piece) <= 2)) return "fuzzy";
  return null;
}

function synonymHit(word: string, hay: string[]): boolean {
  return groupOf(word).some((alt) => alt !== word && (hay.includes(alt) || (alt.length >= 4 && hay.some((piece) => piece.startsWith(alt)))));
}

function blob(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => blob(item)).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map((item) => blob(item)).join(" ");
  return "";
}

function verified(item: SearchListing): boolean {
  if (item.is_verified) return true;
  if (item.owner_verified) return true;
  if (item.verified) return true;
  if (item.owner?.is_verified || item.owner?.verified) return true;
  return false;
}

function coordsOf(item: SearchListing): { lat: number; lng: number } | null {
  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const radius = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function categoryText(item: SearchListing, categories: CategoryChoice[]): string {
  const id = canonicalCategory(item.category) || item.category;
  return categories.filter((entry) => entry.id === id || entry.id === item.category).map((entry) => entry.label).join(" ");
}

type Scored<T> = { item: T; base: number; score: number; exact: boolean };

function scoreListing<T extends SearchListing>(
  item: T,
  query: string,
  opts: { now: number; origin?: { lat: number; lng: number } | null; categories: CategoryChoice[] },
): Scored<T> | null {
  const qTokens = tokens(query);
  if (!qTokens.length) return null;
  const titleTokens = tokens(item.title || "");
  const descTokens = tokens([item.description, blob(item.amenities), blob(item.attributes)].filter(Boolean).join(" "));
  const locTokens = tokens([item.location, item.city].filter(Boolean).join(" "));
  const catTokens = tokens(categoryText(item, opts.categories));
  const phrase = qTokens.join(" ");
  const titlePhrase = titleTokens.join(" ");
  let base = 0;
  let exact = false;
  if (phrase && titlePhrase === phrase) {
    base += 120;
    exact = true;
  } else if (phrase && (titlePhrase.startsWith(phrase) || titlePhrase.includes(` ${phrase}`) || titlePhrase.includes(phrase))) {
    base += 90;
    exact = true;
  }
  for (const word of qTokens) {
    const title = literalHit(word, titleTokens);
    if (title === "exact") {
      base += 40;
      exact = true;
    } else if (title === "prefix") {
      base += 28;
      exact = true;
    } else if (title === "fuzzy") base += 14;
    else if (synonymHit(word, titleTokens)) base += 22;

    const cat = literalHit(word, catTokens);
    if (cat === "exact" || cat === "prefix") base += 24;
    else if (cat === "fuzzy") base += 8;
    else if (synonymHit(word, catTokens)) base += 18;

    const desc = literalHit(word, descTokens);
    if (desc === "exact" || desc === "prefix") base += 16;
    else if (desc === "fuzzy") base += 6;
    else if (synonymHit(word, descTokens)) base += 12;

    const loc = literalHit(word, locTokens);
    if (loc === "exact" || loc === "prefix") base += 10;
    else if (synonymHit(word, locTokens)) base += 8;
  }
  const deal = String((item as { fit?: { listing_type?: string } }).fit?.listing_type || "");
  const home = canonicalCategory(item.category) === "rooms-houses";
  for (const word of qTokens) {
    const rentWord = word === "kodi" || word === "kupanga" || word === "kupangisha" || word === "rent" || word === "rental";
    const saleWord = word === "kuuza" || word === "inauzwa" || word === "nunua" || word === "sale" || word === "buy";
    if (rentWord && (deal === "rent" || (home && !deal))) {
      base += 36;
      exact = true;
    }
    if (saleWord && deal === "sale") {
      base += 36;
      exact = true;
    }
  }
  if (base <= 0) return null;
  let score = base;
  if (verified(item)) score += 8;
  if (item.images?.length) score += 6;
  const created = item.created_at ? Date.parse(item.created_at) : 0;
  if (created && opts.now - created < 14 * 24 * 60 * 60 * 1000) score += 4;
  const point = coordsOf(item);
  if (opts.origin && point) {
    const km = distanceKm(opts.origin.lat, opts.origin.lng, point.lat, point.lng);
    if (km <= 25) score += 5;
  }
  return { item, base, score, exact };
}

function vocabulary(): string[] {
  const words = new Set<string>();
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      for (const part of fold(term).split(" ")) {
        if (part.length >= 4 && !STOPWORDS.has(part)) words.add(part);
      }
    }
  }
  for (const popular of POPULAR_SEARCHES) {
    for (const part of tokens(popular)) {
      if (part.length >= 4) words.add(part);
    }
  }
  return [...words];
}

export function correctionFor(query: string): string | null {
  const words = fold(query).split(" ").filter(Boolean);
  if (!words.length) return null;
  const known = vocabulary();
  let changed = false;
  const next = words.map((word) => {
    if (STOPWORDS.has(word) || known.includes(word)) return word;
    let best: string | null = null;
    let bestD = 3;
    for (const candidate of known) {
      const distance = editDistance(word, candidate);
      if (distance > 0 && distance < bestD) {
        best = candidate;
        bestD = distance;
      }
    }
    if (best && bestD <= 2) {
      changed = true;
      return best;
    }
    return word;
  });
  return changed ? next.join(" ") : null;
}

export function rankListings<T extends SearchListing>(
  items: T[],
  query: string,
  opts?: { now?: number; origin?: { lat: number; lng: number } | null; categories?: CategoryChoice[] },
): RankResult<T> {
  const settings = {
    now: opts?.now ?? Date.now(),
    origin: opts?.origin,
    categories: opts?.categories || [],
  };
  const scored = items
    .map((item) => scoreListing(item, query, settings))
    .filter((row): row is Scored<T> => Boolean(row))
    .sort((a, b) => b.score - a.score || (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0));
  const exact = scored.filter((row) => row.exact).map((row) => row.item);
  const exactIds = new Set(exact.map((item) => item.id));
  const exactCats = new Set(exact.map((item) => item.category).filter(Boolean));
  const relatedScored = scored.filter((row) => !row.exact).map((row) => row.item);
  const relatedIds = new Set(relatedScored.map((item) => item.id));
  const sameCategory = exact.length
    ? items.filter((item) => item.category && exactCats.has(item.category) && !exactIds.has(item.id) && !relatedIds.has(item.id))
    : [];
  return {
    exact,
    related: [...relatedScored, ...sameCategory],
    correction: exact.length ? null : correctionFor(query),
  };
}

/** Keep a visible order when the same query is scored again after a refresh. */
export function stickOrder<T extends { id: string }>(previous: string[] | null, next: T[]): T[] {
  if (!previous) return next;
  const byId = new Map(next.map((item) => [item.id, item]));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of previous) {
    const item = byId.get(id);
    if (!item || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  for (const item of next) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export function matchRegion(query: string, regions: readonly string[]): string | null {
  const q = fold(query);
  if (q.length < 3) return null;
  return regions.find((name) => {
    const folded = fold(name);
    return folded === q || folded.startsWith(q) || (q.length >= 4 && q.startsWith(folded));
  }) || null;
}

export function wantsNear(query: string): boolean {
  const q = fold(query);
  return NEAR_WORDS.some((word) => {
    const folded = fold(word);
    return folded === q || (q.length >= 4 && folded.startsWith(q));
  });
}

export function matchCategories(query: string, categories: CategoryChoice[]): CategoryChoice[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const words = tokens(query);
  return categories.filter((entry) => {
    const hay = tokens(entry.label);
    if (fold(entry.label).includes(q)) return true;
    return words.some((word) => literalHit(word, hay) || synonymHit(word, hay));
  }).slice(0, 6);
}

export function completionsFor(query: string): string[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const seeds = [...POPULAR_SEARCHES, ...SYNONYM_GROUPS.flat()];
  const out: string[] = [];
  for (const seed of seeds) {
    const folded = fold(seed);
    if (!folded.startsWith(q) || folded === q || out.some((item) => fold(item) === folded)) continue;
    out.push(seed);
    if (out.length >= 5) break;
  }
  return out;
}

export function highlightTitle(title: string, query: string): { text: string; mark: boolean }[] {
  const source = query.trim();
  if (!source) return [{ text: title, mark: false }];
  const safe = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(safe, "i").exec(title);
  if (!match) {
    const word = tokens(query)[0];
    if (!word) return [{ text: title, mark: false }];
    const loose = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").exec(title);
    if (!loose) return [{ text: title, mark: false }];
    return splitMark(title, loose.index, loose[0].length);
  }
  return splitMark(title, match.index, match[0].length);
}

function splitMark(title: string, index: number, length: number): { text: string; mark: boolean }[] {
  return [
    { text: title.slice(0, index), mark: false },
    { text: title.slice(index, index + length), mark: true },
    { text: title.slice(index + length), mark: false },
  ].filter((part) => part.text);
}

export function readRecent(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(readScoped("recent_search") || "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(query: string): string[] {
  const text = query.trim();
  const current = readRecent();
  if (!text || typeof localStorage === "undefined") return current;
  const next = [text, ...current.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, 8);
  writeScoped("recent_search", JSON.stringify(next));
  return next;
}

export function removeRecent(query: string): string[] {
  const next = readRecent().filter((item) => item !== query);
  if (typeof localStorage !== "undefined") writeScoped("recent_search", JSON.stringify(next));
  return next;
}

export function clearRecent(): string[] {
  if (typeof localStorage !== "undefined") removeScoped("recent_search");
  return [];
}
