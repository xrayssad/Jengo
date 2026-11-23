/** One description of every category. Home tiles, wizard, cards and filters read this. */

export type CategoryId = "rooms-houses" | "apartment_airbnb" | "store_godown" | "frame" | "plots" | "vifaa";

export type PhotoSlot = { id: string; en: string; sw: string; required: boolean };

export type FilterKey =
  | "direct"
  | "free_viewing"
  | "costs"
  | "self"
  | "power"
  | "wifi"
  | "room"
  | "whole"
  | "sale"
  | "lease"
  | "surveyed"
  | "tarmac"
  | "murram"
  | "footpath"
  | "electricity"
  | "water"
  | "owner"
  | "agent"
  | "developer"
  | "use_residential"
  | "use_commercial"
  | "use_agricultural"
  | "use_industrial"
  | "use_mixed"
  | "tenure_gro"
  | "tenure_ccro"
  | "tenure_licence"
  | "tenure_village"
  | "tenure_other";

export type Copy = { en: string; sw: string };

export type CategoryConfig = {
  id: CategoryId;
  en: string;
  sw: string;
  /** One-line tile label. Change it here and every tile updates. */
  short: Copy;
  hint: Copy;
  dueKey: "movein" | "stay" | "start" | "total";
  photos: PhotoSlot[];
  photoTip: Copy;
  safety: Copy;
  filters: FilterKey[];
};

/** Tile label for Rooms & Houses. Change this constant to rename the tile everywhere. */
export const ROOMS_HOUSES_SHORT: Copy = { en: "Homes", sw: "Nyumba" };

const daylight: Copy = {
  en: "Use real photos in daylight. No text on the picture.",
  sw: "Tumia picha halisi mchana. Usiandike maandishi kwenye picha.",
};

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  "rooms-houses": {
    id: "rooms-houses",
    en: "Rooms & Houses",
    sw: "Vyumba na Nyumba",
    short: ROOMS_HOUSES_SHORT,
    hint: { en: "A room, house or compound", sw: "Chumba, nyumba au uwanja" },
    dueKey: "movein",
    photos: [
      { id: "bedroom", en: "Bedroom", sw: "Chumba", required: true },
      { id: "bathroom", en: "Bathroom", sw: "Bafu", required: true },
      { id: "kitchen", en: "Kitchen", sw: "Jiko", required: false },
      { id: "exterior", en: "Compound", sw: "Uwanja", required: true },
      { id: "street", en: "Entrance", sw: "Mlango", required: false },
    ],
    photoTip: daylight,
    safety: {
      en: "Do not pay before you view. Meet in daylight and confirm the owner.",
      sw: "Usilipe kabla hujaona. Onana mchana na uhakikishe mmiliki.",
    },
    filters: ["direct", "free_viewing", "costs", "room", "whole"],
  },
  apartment_airbnb: {
    id: "apartment_airbnb",
    en: "Apartment & Airbnb",
    sw: "Apartment na Airbnb",
    short: { en: "Apartments", sw: "Apartment" },
    hint: { en: "A stay charged by the night", sw: "Malazi ya usiku" },
    dueKey: "stay",
    photos: [
      { id: "bedroom", en: "Bedroom", sw: "Chumba", required: true },
      { id: "bathroom", en: "Bathroom", sw: "Bafu", required: true },
      { id: "kitchen", en: "Kitchen", sw: "Jiko", required: true },
      { id: "living", en: "Living room", sw: "Sebule", required: false },
      { id: "exterior", en: "Building", sw: "Jengo", required: true },
      { id: "view", en: "View", sw: "Mandhari", required: false },
    ],
    photoTip: daylight,
    safety: {
      en: "Read the total before you request. Pay only after the host confirms.",
      sw: "Soma jumla kabla hujaomba. Lipa baada ya mwenyeji kuthibitisha.",
    },
    filters: ["direct", "costs", "power", "wifi"],
  },
  store_godown: {
    id: "store_godown",
    en: "Shops, Store & Godown",
    sw: "Maduka, stoo na godown",
    short: { en: "Shops", sw: "Maduka" },
    hint: { en: "A shop, store or warehouse", sw: "Duka, stoo au ghala" },
    dueKey: "start",
    photos: [
      { id: "facade", en: "Front", sw: "Mbele", required: true },
      { id: "interior", en: "Interior", sw: "Ndani", required: true },
      { id: "access", en: "Access", sw: "Njia", required: false },
    ],
    photoTip: daylight,
    safety: {
      en: "Check the size, access road and what goods are allowed before you pay.",
      sw: "Angalia ukubwa, njia na bidhaa zinazoruhusiwa kabla hujalipa.",
    },
    filters: ["direct", "free_viewing", "costs"],
  },
  frame: {
    id: "frame",
    en: "Shop Frames",
    sw: "Fremu za maduka",
    short: { en: "Frames", sw: "Fremu" },
    hint: { en: "A frame inside a market", sw: "Fremu ndani ya soko" },
    dueKey: "start",
    photos: [
      { id: "facade", en: "Front", sw: "Mbele", required: true },
      { id: "interior", en: "Interior", sw: "Ndani", required: true },
      { id: "sign", en: "Signboard", sw: "Bango", required: false },
    ],
    photoTip: daylight,
    safety: {
      en: "Ask what the goodwill is for, and do not pay a viewing fee.",
      sw: "Uliza goodwill ni ya nini, wala usilipe ada ya kuona.",
    },
    filters: ["direct", "free_viewing", "costs"],
  },
  plots: {
    id: "plots",
    en: "Plots",
    sw: "Viwanja",
    short: { en: "Plots", sw: "Viwanja" },
    hint: { en: "Land for sale or long-term lease", sw: "Ardhi ya kuuza au kupanga kwa muda mrefu" },
    dueKey: "total",
    photos: [
      { id: "road", en: "Road or entrance", sw: "Barabara au mlango", required: true },
      { id: "overall", en: "Overall view", sw: "Muonekano wote", required: true },
      { id: "beacons", en: "Boundary markers", sw: "Alama za mipaka", required: true },
      { id: "landmark", en: "Nearby landmark", sw: "Alama ya karibu", required: true },
    ],
    photoTip: daylight,
    safety: {
      en: "Visit the plot before you pay. Documents listed here are declared by the seller. Jengo has not verified them.",
      sw: "Tembelea kiwanja kabla hujalipa. Nyaraka hapa zimethibitishwa na muuzaji. Jengo haijazihakiki.",
    },
    filters: [
      "sale",
      "lease",
      "surveyed",
      "tarmac",
      "murram",
      "footpath",
      "electricity",
      "water",
      "owner",
      "agent",
      "developer",
      "use_residential",
      "use_commercial",
      "use_agricultural",
      "use_industrial",
      "use_mixed",
      "tenure_gro",
      "tenure_ccro",
      "tenure_licence",
      "tenure_village",
      "tenure_other",
    ],
  },
  vifaa: {
    id: "vifaa",
    en: "Materials & goods",
    sw: "Vifaa na bidhaa",
    short: { en: "Materials", sw: "Vifaa" },
    hint: { en: "Cement, timber, steel and more", sw: "Simenti, mbao, chuma na zaidi" },
    dueKey: "total",
    photos: [
      { id: "front", en: "Item", sw: "Bidhaa", required: true },
      { id: "close", en: "Close-up", sw: "Karibu", required: true },
      { id: "label", en: "Label", sw: "Lebo", required: false },
    ],
    photoTip: daylight,
    safety: {
      en: "Agree the total with delivery before you send money. Keep the chat.",
      sw: "Kubalianeni na jumla na usafirishaji kabla hutumi pesa. Hifadhi mazungumzo.",
    },
    filters: ["costs"],
  },
};

/** Previous ids that now belong to Rooms & Houses. */
export const LEGACY_CATEGORY: Record<string, CategoryId> = {
  chumba_nyumba: "rooms-houses",
  rooms: "rooms-houses",
  room: "rooms-houses",
  houses: "rooms-houses",
  house: "rooms-houses",
  nyumba: "rooms-houses",
  chumba: "rooms-houses",
  vyumba: "rooms-houses",
  vyumba_na_nyumba: "rooms-houses",
};

export type TileAction = "filter" | "route" | "sheet";

export type HomeTile = {
  id: string;
  action: TileAction;
  href?: string;
  icon: "home" | "building" | "warehouse" | "store" | "land" | "boxes" | "hammer" | "all";
};

/** Home grid, in order. Listing categories stay in CATEGORIES; Jobs and All are navigation only. */
export const HOME_TILES: HomeTile[] = [
  { id: "rooms-houses", action: "filter", icon: "home" },
  { id: "apartment_airbnb", action: "filter", icon: "building" },
  { id: "plots", action: "filter", icon: "land" },
  { id: "store_godown", action: "filter", icon: "warehouse" },
  { id: "frame", action: "filter", icon: "store" },
  { id: "vifaa", action: "filter", icon: "boxes" },
  { id: "jobs", action: "route", href: "/kazi", icon: "hammer" },
  { id: "all", action: "sheet", icon: "all" },
];

const EXTRA_TILE: Record<string, { en: string; sw: string; shortEn: string; shortSw: string }> = {
  jobs: { en: "Construction Jobs", sw: "Kazi za ujenzi", shortEn: "Jobs", shortSw: "Kazi" },
  all: { en: "All categories", sw: "Makundi yote", shortEn: "All", shortSw: "Zote" },
};

export function canonicalCategory(id?: string | null): string {
  const key = String(id || "").trim();
  if (!key) return "";
  if (key in CATEGORIES) return key;
  return LEGACY_CATEGORY[key] || "";
}

export function categoryConfig(id?: string | null): CategoryConfig | null {
  const key = canonicalCategory(id);
  if (!key || !(key in CATEGORIES)) return null;
  return CATEGORIES[key as CategoryId];
}

/** A listing can go live with one photo. The grid stops at twenty. */
export const MIN_PHOTOS_TO_PUBLISH = 1;
export const MAX_PHOTOS = 20;

export type Deal = "rent" | "sale" | "lease";

/** Homes are live. Shops, frames and godowns stay rent-only until their sale flow is turned on. */
export function liveDeals(id?: string | null): Deal[] {
  const key = canonicalCategory(id);
  if (key === "rooms-houses") return ["rent", "sale"];
  if (key === "plots") return ["sale", "lease"];
  return [];
}

export function dealOf(item: { category?: string | null; period?: string | null; fit?: { listing_type?: string } | null }): Deal | "" {
  const modes = liveDeals(item.category);
  const raw = item.fit?.listing_type;
  if ((raw === "rent" || raw === "sale" || raw === "lease") && (!modes.length || modes.includes(raw))) return raw;
  if (modes.includes("rent") || item.period) {
    if (canonicalCategory(item.category) === "rooms-houses") return "rent";
  }
  if (canonicalCategory(item.category) === "plots") return raw === "lease" ? "lease" : "sale";
  return "";
}

export function photoMinimum(_id?: string | null): number {
  return MIN_PHOTOS_TO_PUBLISH;
}

export function tileCopy(id: string, lang: "en" | "sw"): { label: string; short: string } {
  const config = categoryConfig(id);
  if (config) {
    return { label: lang === "sw" ? config.sw : config.en, short: lang === "sw" ? config.short.sw : config.short.en };
  }
  const extra = EXTRA_TILE[id];
  if (!extra) return { label: id, short: id };
  return { label: lang === "sw" ? extra.sw : extra.en, short: lang === "sw" ? extra.shortSw : extra.shortEn };
}

/** Tiles in the All sheet: the home set, then any category added later that is not already a tile. */
export function sheetTiles(): HomeTile[] {
  const listed = new Set(HOME_TILES.map((tile) => tile.id));
  const later: HomeTile[] = Object.values(CATEGORIES)
    .filter((item) => !listed.has(item.id))
    .map((item) => ({ id: item.id, action: "filter", icon: "home" }));
  return [...HOME_TILES.filter((tile) => tile.action !== "sheet"), ...later];
}

export function isFilterTile(id: string): boolean {
  return HOME_TILES.some((tile) => tile.id === id && tile.action === "filter") || id in CATEGORIES;
}
