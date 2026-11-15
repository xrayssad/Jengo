/** One description of every category. Wizard tips, cards and filters read this. */

export type CategoryId = "chumba_nyumba" | "apartment_airbnb" | "store_godown" | "frame" | "vifaa";

export type PhotoSlot = { id: string; en: string; sw: string; required: boolean };

export type CategoryConfig = {
  id: CategoryId;
  en: string;
  sw: string;
  dueKey: "movein" | "stay" | "start" | "total";
  photos: PhotoSlot[];
  photoTip: { en: string; sw: string };
  safety: { en: string; sw: string };
  filters: Array<"direct" | "free_viewing" | "costs" | "self" | "power" | "wifi">;
};

const daylight = {
  en: "Use real photos in daylight. No text on the picture.",
  sw: "Tumia picha halisi mchana. Usiandike maandishi kwenye picha.",
};

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  chumba_nyumba: {
    id: "chumba_nyumba",
    en: "Rooms & Houses",
    sw: "Vyumba na nyumba",
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
    filters: ["direct", "free_viewing", "costs", "self"],
  },
  apartment_airbnb: {
    id: "apartment_airbnb",
    en: "Apartment & Airbnb",
    sw: "Apartment na Airbnb",
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
    en: "Shops & Godown",
    sw: "Maduka na godown",
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
  vifaa: {
    id: "vifaa",
    en: "Materials & goods",
    sw: "Vifaa na bidhaa",
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

export function categoryConfig(id?: string | null): CategoryConfig | null {
  if (!id || !(id in CATEGORIES)) return null;
  return CATEGORIES[id as CategoryId];
}

export function photoMinimum(id?: string | null): number {
  const config = categoryConfig(id);
  if (!config) return 1;
  return config.photos.filter((slot) => slot.required).length;
}
