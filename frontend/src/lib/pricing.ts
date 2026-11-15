/** Total-cost formulas. The server recomputes the same numbers before a booking is accepted. */

export type PosterRole = "owner" | "agent" | "caretaker" | "business";
export type VatMode = "included" | "excluded";

export type Fit = {
  poster_role?: PosterRole;
  free_viewing?: boolean;
  direct_owner?: boolean;
  costs_confirmed?: boolean;
  months_advance?: number;
  deposit?: number;
  agent_fee?: number;
  other_fee?: number;
  cleaning_fee?: number;
  extra_guest_fee?: number;
  goodwill?: number;
  nights?: number;
  guests?: number;
  included_guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  room_type?: string;
  water?: string;
  electricity?: string;
  amenities?: string[];
  landmark?: string;
  directions?: string;
  whatsapp?: string;
  size_m2?: number;
  price_per_sqm?: number;
  vat?: VatMode;
  currency?: "TZS" | "USD";
  subtype?: string;
  truck?: string;
  cancellation?: "flexible" | "moderate" | "strict";
  min_nights?: number;
  max_nights?: number;
  power_backup?: string;
  floor?: string;
  suitable?: string;
  condition?: string;
  allowed_goods?: string;
  delivery_note?: string;
  ceiling?: string;
  license_note?: string;
  delivery_fee?: number;
  min_order?: number;
  available_from?: string;
  last_confirmed_at?: string;
  reply_within?: "hour" | "day" | "";
  negotiable?: boolean;
  instant_book?: boolean;
};

export type CostLine = { key: string; amount: number };
export type Quote = { lines: CostLine[]; due: number; deposit: number; total: number };

export type Priced = {
  category?: string;
  price?: number | string;
  fit?: Fit | null;
  attributes?: Fit | null;
};

const ROLES = new Set<PosterRole>(["owner", "agent", "caretaker", "business"]);

export function money(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 1e12) return 0;
  return Math.round(n);
}

function count(value: unknown, fallback: number, min: number, max: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function readFit(item: Priced | null | undefined): Fit {
  const raw = item?.fit && typeof item.fit === "object" ? item.fit : item?.attributes;
  return raw && typeof raw === "object" ? raw : {};
}

export function quoteStay(item: Priced, stay?: { nights?: number; guests?: number; quantity?: number }): Quote {
  const fit = readFit(item);
  const price = money(item.price);
  const category = item.category || "";
  const subtype = fit.subtype || "";
  const deposit = money(fit.deposit);
  const lines: CostLine[] = [];

  const push = (key: string, amount: number) => {
    if (amount > 0) lines.push({ key, amount });
  };

  if (category === "apartment_airbnb") {
    const nights = count(stay?.nights ?? fit.nights, 1, 1, 90);
    const guests = count(stay?.guests ?? fit.guests, fit.included_guests || 1, 1, 30);
    const included = count(fit.included_guests, guests, 1, 30);
    const extra = Math.max(0, guests - included);
    push("nights", price * nights);
    push("cleaning", money(fit.cleaning_fee));
    push("extra_guests", money(fit.extra_guest_fee) * extra * nights);
    const due = lines.reduce((sum, line) => sum + line.amount, 0);
    return { lines, due, deposit, total: due };
  }

  if (category === "vifaa") {
    const qty = count(stay?.quantity ?? fit.min_order, 1, 1, 100000);
    push("goods", price * qty);
    push("delivery", money(fit.delivery_fee));
    const due = lines.reduce((sum, line) => sum + line.amount, 0);
    return { lines, due, deposit: 0, total: due };
  }

  const months = count(fit.months_advance, 1, 1, 24);
  const godown = category === "store_godown" && (subtype === "godown" || money(fit.price_per_sqm) > 0);
  if (godown && money(fit.size_m2) > 0) {
    const sqm = money(fit.size_m2);
    const rate = money(fit.price_per_sqm) || price;
    let month = rate * sqm;
    if (fit.vat === "excluded") month = Math.round(month * 1.18);
    push("rent", month * months);
    push("deposit", deposit);
    const due = lines.reduce((sum, line) => sum + line.amount, 0);
    return { lines, due, deposit, total: due };
  }

  push("rent", price * months);
  push("deposit", deposit);
  push("agent_fee", money(fit.agent_fee));
  push("other_fee", money(fit.other_fee));
  if (category === "frame" || category === "store_godown") push("goodwill", money(fit.goodwill));
  const due = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, due, deposit, total: due };
}

/** What a card should call the amount due before anyone moves in or stays one night. */
export function moveInAmount(item: Priced): number {
  return quoteStay(item).due;
}

export function isRole(value: unknown): value is PosterRole {
  return ROLES.has(value as PosterRole);
}
