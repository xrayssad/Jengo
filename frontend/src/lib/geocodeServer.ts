import { buildPlaceLabel, type AddressParts, type ReversePlace } from "./geo";

type ProviderName = "photon" | "google" | "nominatim";

const DAY = 24 * 60 * 60 * 1000;
const CACHE_MS = 30 * DAY;
const cache = new Map<string, { at: number; row: ReversePlace }>();
const hits = new Map<string, number[]>();
let nominatimAt = 0;

function provider(): ProviderName {
  const chosen = (process.env.GEOCODER_PROVIDER || "").trim().toLowerCase();
  if (chosen === "photon" || chosen === "google" || chosen === "nominatim") return chosen;
  return process.env.GOOGLE_MAPS_API_KEY ? "google" : "photon";
}

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export function takeCached(lat: number, lng: number) {
  const row = cache.get(cacheKey(lat, lng));
  if (!row) return null;
  if (Date.now() - row.at > CACHE_MS) {
    cache.delete(cacheKey(lat, lng));
    return null;
  }
  return row.row;
}

export function allow(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((at) => now - at < 60_000);
  if (recent.length >= 30) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

async function readJson(url: string, headers?: HeadersInit) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<Record<string, unknown>>;
}

function fromPhoton(data: Record<string, unknown>): AddressParts {
  const feature = (data.features as { properties?: Record<string, unknown> }[] | undefined)?.[0];
  const props = feature?.properties || {};
  const text = (key: string) => String(props[key] || "").trim();
  return {
    street: text("street") || text("name"),
    neighbourhood: text("district"),
    ward: text("district"),
    district: text("county") || text("city"),
    region: text("state"),
  };
}

function fromGoogle(data: Record<string, unknown>): AddressParts {
  const result = ((data.results as { address_components?: { long_name?: string; types?: string[] }[] }[]) || [])[0];
  const parts = result?.address_components || [];
  const pick = (...types: string[]) => {
    for (const type of types) {
      const hit = parts.find((part) => (part.types || []).includes(type));
      if (hit?.long_name) return hit.long_name;
    }
    return "";
  };
  return {
    street: pick("route"),
    neighbourhood: pick("neighborhood", "sublocality", "sublocality_level_1"),
    ward: pick("administrative_area_level_3", "sublocality_level_1"),
    district: pick("administrative_area_level_2", "locality"),
    region: pick("administrative_area_level_1"),
  };
}

function fromNominatim(data: Record<string, unknown>): AddressParts {
  const addr = (data.address as Record<string, unknown>) || {};
  const text = (key: string) => String(addr[key] || "").trim();
  return {
    street: text("road") || text("pedestrian"),
    neighbourhood: text("suburb") || text("neighbourhood") || text("quarter"),
    ward: text("suburb") || text("city_district"),
    district: text("county") || text("state_district") || text("city") || text("town"),
    region: text("state"),
  };
}

function pack(parts: AddressParts): ReversePlace {
  const label = buildPlaceLabel(parts);
  const names = [parts.ward, parts.neighbourhood, parts.district, parts.region, parts.street]
    .map((bit) => String(bit || "").trim())
    .filter((bit, index, all) => bit && !/^(tanzania|tz)$/i.test(bit) && all.indexOf(bit) === index);
  return {
    ...parts,
    label,
    names,
    city: parts.region || parts.district || "",
  };
}

async function lookup(lat: number, lng: number, lang: string): Promise<ReversePlace> {
  const name = provider();
  if (name === "google") {
    const key = process.env.GOOGLE_MAPS_API_KEY || "";
    if (!key) throw new Error("missing key");
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lng}`)}&language=${encodeURIComponent(lang)}&region=tz&key=${encodeURIComponent(key)}`;
    return pack(fromGoogle(await readJson(url)));
  }
  if (name === "nominatim") {
    const wait = 1100 - (Date.now() - nominatimAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    nominatimAt = Date.now();
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=jsonv2&addressdetails=1&accept-language=${encodeURIComponent(lang)}`;
    return pack(fromNominatim(await readJson(url, {
      "User-Agent": "Jengo/1.0 (nyumba marketplace)",
      Referer: process.env.GEOCODER_REFERER || "https://jengo.app",
    })));
  }
  const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&lang=${encodeURIComponent(lang === "sw" ? "en" : lang)}`;
  return pack(fromPhoton(await readJson(url, { "User-Agent": "Jengo/1.0 (nyumba marketplace)" })));
}

export async function reverseServer(lat: number, lng: number, lang: string) {
  const cached = takeCached(lat, lng);
  if (cached) return cached;
  const row = await lookup(lat, lng, lang);
  cache.set(cacheKey(lat, lng), { at: Date.now(), row });
  return row;
}
