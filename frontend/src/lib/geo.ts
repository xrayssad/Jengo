/** Precise GPS and place labels. Leaflet wants [lat, lng]. GeoJSON wants [lng, lat]. */

export type PreciseFix = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

export type LocationSource = "gps" | "pin" | "search" | "manual";

export type AddressParts = {
  street?: string;
  neighbourhood?: string;
  ward?: string;
  district?: string;
  region?: string;
};

export type ReversePlace = AddressParts & {
  label: string;
  names: string[];
  city: string;
};

export type GeoLog = {
  lat: number;
  lng: number;
  order: "lat,lng";
  accuracy?: number;
  source?: string;
  at: number;
  geocoderMs?: number;
};

export const APPROXIMATE_PUBLIC_LOCATION_DEFAULT = true;
export const APPROXIMATE_RADIUS_M = 300;

export const TZ_BOX = { latMin: -11.8, latMax: -0.9, lngMin: 29.3, lngMax: 40.5 };

export const KNOWN_POINTS = {
  "Dar es Salaam": { lat: -6.79, lng: 39.21 },
  Zanzibar: { lat: -6.16, lng: 39.2 },
  Dodoma: { lat: -6.17, lng: 35.74 },
  Mwanza: { lat: -2.52, lng: 32.9 },
  Arusha: { lat: -3.37, lng: 36.68 },
  Mbeya: { lat: -8.91, lng: 33.46 },
} as const;

const BANNED = /^(my current location|use my current location|pinned location|tumia eneo langu|eneo langu|eneo la sasa)$/i;
const RESOLVING = /^(inatafuta jina la eneo|finding the place name)\.{0,3}$/i;

export function roundCoord(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

export function inTanzania(lat: number, lng: number) {
  return lat >= TZ_BOX.latMin && lat <= TZ_BOX.latMax && lng >= TZ_BOX.lngMin && lng <= TZ_BOX.lngMax;
}

/** Leaflet and the API use latitude first. */
export function leafletPair(lat: number, lng: number): [number, number] {
  return [roundCoord(lat), roundCoord(lng)];
}

/** GeoJSON positions are longitude first. */
export function geoJsonPair(lat: number, lng: number): [number, number] {
  return [roundCoord(lng), roundCoord(lat)];
}

export function approximateCenter(lat: number, lng: number) {
  const step = 0.003;
  return {
    lat: roundCoord(Math.round(lat / step) * step),
    lng: roundCoord(Math.round(lng / step) * step),
  };
}

export function pickBestFix(current: PreciseFix | null, next: PreciseFix) {
  if (!current || next.accuracy < current.accuracy) return next;
  return current;
}

export function buildPlaceLabel(parts: AddressParts) {
  const local = clean(parts.street) || clean(parts.neighbourhood) || clean(parts.ward);
  const district = clean(parts.district);
  const region = clean(parts.region);
  const bits = [local, district, region].filter((bit, index, all) => bit && all.indexOf(bit) === index);
  if (bits.length) return bits.join(", ");
  return [clean(parts.ward), clean(parts.district), clean(parts.region)].filter((bit, index, all) => bit && all.indexOf(bit) === index).join(", ");
}

export function coordLabel(lat: number, lng: number, lang: "sw" | "en" = "sw") {
  const point = `${roundCoord(lat).toFixed(4)}, ${roundCoord(lng).toFixed(4)}`;
  return lang === "en" ? `Selected place (${point})` : `Eneo lililochaguliwa (${point})`;
}

export function bannedLocation(location: string) {
  return BANNED.test(location.trim());
}

export function resolvingLocation(location: string) {
  return RESOLVING.test(location.trim());
}

export function needsLandmark(location: string) {
  return /^(Eneo lililochaguliwa|Selected place)\b/i.test(location.trim());
}

export function publicMapIsApproximate(category: string, showExact: boolean, isOwner: boolean) {
  if (!APPROXIMATE_PUBLIC_LOCATION_DEFAULT || isOwner || showExact) return false;
  const key = category.trim().toLowerCase();
  return key === "rooms-houses" || key === "apartment_airbnb" || key === "chumba_nyumba" || key === "nyumba" || key === "house" || key === "houses";
}

function clean(value?: string) {
  const text = String(value || "").trim();
  if (!text || /^(tanzania|tz)$/i.test(text)) return "";
  return text;
}

type GeoPosition = { coords: { latitude: number; longitude: number; accuracy: number }; timestamp: number };
type GeoOptions = { enableHighAccuracy: boolean; maximumAge: number; timeout: number };

export type GeoWatch = {
  watchPosition: (
    success: (pos: GeoPosition) => void,
    error: (err: { code?: number }) => void,
    options: GeoOptions,
  ) => number;
  clearWatch: (id: number) => void;
  getCurrentPosition?: (
    success: (pos: GeoPosition) => void,
    error: (err: { code?: number }) => void,
    options: GeoOptions,
  ) => void;
};

export function getPreciseLocation({
  targetAccuracyM = 50,
  timeoutMs = 15000,
  onFix,
  watch,
  secure = typeof window === "undefined" ? true : window.isSecureContext,
}: {
  targetAccuracyM?: number;
  timeoutMs?: number;
  onFix?: (fix: PreciseFix) => void;
  watch?: GeoWatch;
  secure?: boolean;
} = {}): Promise<PreciseFix> {
  return new Promise((resolve, reject) => {
    const geo = watch || (typeof navigator === "undefined" ? null : navigator.geolocation);
    if (!geo) {
      reject(Object.assign(new Error("unsupported"), { code: 0 }));
      return;
    }
    if (!secure) {
      reject(Object.assign(new Error("https"), { code: 0 }));
      return;
    }
    let best: PreciseFix | null = null;
    let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
    let settled = false;
    let lowStarted = false;
    const ids: number[] = [];
    const stop = () => {
      settled = true;
      if (timer) globalThis.clearTimeout(timer);
      for (const id of ids.splice(0)) geo.clearWatch(id);
    };
    const succeed = (fix: PreciseFix) => {
      if (settled) return;
      stop();
      resolve(fix);
    };
    const fail = (err: { code?: number }) => {
      if (settled) return;
      if (best) succeed(best);
      else {
        stop();
        reject(err);
      }
    };
    const take = (pos: { coords: { latitude: number; longitude: number; accuracy: number }; timestamp: number }) => {
      if (settled) return;
      const next: PreciseFix = {
        lat: roundCoord(pos.coords.latitude),
        lng: roundCoord(pos.coords.longitude),
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp || Date.now(),
      };
      best = pickBestFix(best, next);
      onFix?.(best);
      writeGeoLog({ lat: best.lat, lng: best.lng, order: "lat,lng", accuracy: best.accuracy, source: "gps", at: best.timestamp });
      if (best.accuracy <= targetAccuracyM) succeed(best);
    };
    const listen = (high: boolean) => {
      const id = geo.watchPosition(
        take,
        (err) => {
          if (settled) return;
          if (err?.code === 1) {
            fail(err);
            return;
          }
          if (high && !lowStarted) {
            lowStarted = true;
            listen(false);
          }
        },
        { enableHighAccuracy: high, maximumAge: 0, timeout: timeoutMs },
      );
      ids.push(id);
      if (settled) geo.clearWatch(id);
    };
    listen(true);
    geo.getCurrentPosition?.(take, () => {}, { enableHighAccuracy: false, maximumAge: 0, timeout: timeoutMs });
    timer = globalThis.setTimeout(() => fail(Object.assign(new Error("timeout"), { code: 3 })), timeoutMs);
  });
}

/** @deprecated Use getPreciseLocation. Kept so older calls still ask for a fresh fix. */
export function readAccuratePosition() {
  return getPreciseLocation().then((fix) => ({
    coords: { latitude: fix.lat, longitude: fix.lng, accuracy: fix.accuracy },
    timestamp: fix.timestamp,
  }));
}

export async function reverseGeocode(lat: number, lng: number, lang: "sw" | "en" = "sw"): Promise<ReversePlace> {
  const started = Date.now();
  const sp = new URLSearchParams({
    lat: String(roundCoord(lat)),
    lng: String(roundCoord(lng)),
    lang,
  });
  const res = await fetch(`/api/geo/reverse?${sp}`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error("geocoder");
  const data = (await res.json()) as ReversePlace;
  writeGeoLog({
    lat: roundCoord(lat),
    lng: roundCoord(lng),
    order: "lat,lng",
    source: "reverse",
    at: Date.now(),
    geocoderMs: Date.now() - started,
  });
  return data;
}

export async function describePosition(lat: number, lng: number): Promise<{ label: string; city: string }> {
  const row = await reverseGeocode(lat, lng);
  return { label: row.label, city: row.city || row.region || row.district || "" };
}

let lastLog: GeoLog | null = null;

export function writeGeoLog(log: GeoLog) {
  lastLog = log;
  if (debugGeoEnabled()) console.info("[geo]", log);
}

export function readGeoLog() {
  return lastLog;
}

export function debugGeoEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugGeo") === "1";
}
