/** Plot size, price-per-area and the attribute payload the wizard sends. */

import type { Fit } from "./pricing";

export type PlotUnit = "m2" | "acre" | "ha";
export type ListingType = "sale" | "lease";
export type PlotPayment = "full" | "installments" | "deposit";

export const M2_PER_ACRE = 4046.8564224;
export const M2_PER_HA = 10000;

export const PLOT_DOCS = [
  "title",
  "survey_plan",
  "official_search",
  "land_rent",
  "sale_agreements",
  "seller_id",
  "family_consent",
  "mtaa_letter",
] as const;

export type PlotDoc = (typeof PLOT_DOCS)[number];

export type PlotDraft = {
  listingType: ListingType;
  size: string;
  unit: PlotUnit;
  width: string;
  length: string;
  payment: PlotPayment;
  paymentNote: string;
  bookingDeposit: string;
  landUse: string;
  tenure: string;
  landCategory: string;
  documents: string[];
  surveyed: boolean;
  plotNumber: string;
  blockNumber: string;
  road: string;
  roadDistance: string;
  electricity: boolean;
  water: string;
  townDistance: string;
  terrain: string;
  flood: string;
  fenced: boolean;
  structures: string;
  boundary: [number, number][];
  video: string;
};

export const emptyPlot = (): PlotDraft => ({
  listingType: "sale",
  size: "",
  unit: "m2",
  width: "",
  length: "",
  payment: "full",
  paymentNote: "",
  bookingDeposit: "",
  landUse: "",
  tenure: "",
  landCategory: "",
  documents: [],
  surveyed: false,
  plotNumber: "",
  blockNumber: "",
  road: "",
  roadDistance: "",
  electricity: false,
  water: "",
  townDistance: "",
  terrain: "",
  flood: "",
  fenced: false,
  structures: "",
  boundary: [],
  video: "",
});

export function asPlotUnit(value: unknown): PlotUnit {
  return value === "acre" || value === "ha" || value === "m2" ? value : "m2";
}

export function sizeInM2(size: number, unit: PlotUnit): number {
  if (!Number.isFinite(size) || size <= 0) return 0;
  if (unit === "acre") return size * M2_PER_ACRE;
  if (unit === "ha") return size * M2_PER_HA;
  return size;
}

export function pricePerM2(price: number, size: number, unit: PlotUnit): number {
  const area = sizeInM2(size, unit);
  if (!area || !Number.isFinite(price) || price <= 0) return 0;
  return Math.round(price / area);
}

export function pricePerAcre(price: number, size: number, unit: PlotUnit): number {
  const area = sizeInM2(size, unit);
  if (!area || !Number.isFinite(price) || price <= 0) return 0;
  const acres = area / M2_PER_ACRE;
  if (acres <= 0) return 0;
  return Math.round(price / acres);
}

type PricedPlot = {
  price?: number | string;
  fit?: Fit | null;
  attributes?: Fit | null;
};

function fitOf(item: PricedPlot): Fit {
  const raw = item.fit && typeof item.fit === "object" ? item.fit : item.attributes;
  return raw && typeof raw === "object" ? raw : {};
}

export function pricePerM2Of(item: PricedPlot): number {
  const fit = fitOf(item);
  if (typeof fit.price_per_m2 === "number" && fit.price_per_m2 > 0) return fit.price_per_m2;
  const size = Number(fit.plot_size);
  const price = typeof item.price === "string" ? Number(item.price) : Number(item.price);
  return pricePerM2(price, size, asPlotUnit(fit.plot_unit));
}

export function sizeM2Of(item: PricedPlot): number {
  const fit = fitOf(item);
  if (typeof fit.size_m2 === "number" && fit.size_m2 > 0) return fit.size_m2;
  return sizeInM2(Number(fit.plot_size), asPlotUnit(fit.plot_unit));
}

export function formatMeasure(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
  return rounded.toLocaleString("en-TZ");
}

export function sizeLabel(fit: Fit, lang: "en" | "sw"): string {
  const size = Number(fit.plot_size);
  if (!Number.isFinite(size) || size <= 0) return "";
  const unit = asPlotUnit(fit.plot_unit);
  const name = unit === "m2" ? "m²" : unit === "acre" ? (lang === "sw" ? "ekari" : "acres") : (lang === "sw" ? "hektari" : "ha");
  const dims = Number(fit.plot_width) > 0 && Number(fit.plot_length) > 0
    ? ` (${formatMeasure(Number(fit.plot_width))} x ${formatMeasure(Number(fit.plot_length))} m)`
    : "";
  return `${formatMeasure(size)} ${name}${dims}`;
}

function num(value: string): number {
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function plotPayload(plot: PlotDraft, price: number): Record<string, unknown> {
  const size = num(plot.size);
  const unit = plot.unit;
  const perM2 = pricePerM2(price, size, unit);
  const perAcre = pricePerAcre(price, size, unit);
  const boundary = plot.boundary
    .filter((pair) => pair.length === 2 && pair.every((n) => Number.isFinite(n)))
    .slice(0, 40);
  const docs = plot.documents.filter((id) => (PLOT_DOCS as readonly string[]).includes(id)).slice(0, 12);
  const out: Record<string, unknown> = {
    listing_type: plot.listingType,
    plot_size: size,
    plot_unit: unit,
    size_m2: Math.round(sizeInM2(size, unit)),
    payment: plot.payment,
    surveyed: plot.surveyed,
    electricity_nearby: plot.electricity,
    fenced: plot.fenced,
  };
  if (perM2) out.price_per_m2 = perM2;
  if ((unit === "acre" || unit === "ha") && perAcre) out.price_per_acre = perAcre;
  if (num(plot.width) > 0) out.plot_width = num(plot.width);
  if (num(plot.length) > 0) out.plot_length = num(plot.length);
  if (plot.paymentNote.trim()) out.payment_note = plot.paymentNote.trim().slice(0, 160);
  if (num(plot.bookingDeposit) > 0) out.booking_deposit = Math.round(num(plot.bookingDeposit));
  if (plot.landUse) out.land_use = plot.landUse;
  if (plot.tenure) out.tenure = plot.tenure;
  if (plot.landCategory) out.land_category = plot.landCategory;
  if (docs.length) out.documents = docs;
  if (plot.plotNumber.trim()) out.plot_number = plot.plotNumber.trim().slice(0, 40);
  if (plot.blockNumber.trim()) out.block_number = plot.blockNumber.trim().slice(0, 40);
  if (plot.road) out.road = plot.road;
  if (plot.roadDistance.trim()) out.road_distance = plot.roadDistance.trim().slice(0, 40);
  if (plot.water) out.water_nearby = plot.water;
  if (plot.townDistance.trim()) out.town_distance = plot.townDistance.trim().slice(0, 40);
  if (plot.terrain) out.terrain = plot.terrain;
  if (plot.flood) out.flood = plot.flood;
  if (plot.structures) out.structures = plot.structures;
  if (boundary.length >= 3) out.boundary = boundary;
  if (plot.video.trim()) out.video_url = plot.video.trim().slice(0, 400);
  return out;
}

export function plotReady(plot: PlotDraft): boolean {
  return num(plot.size) > 0 && Boolean(plot.landUse) && Boolean(plot.tenure);
}
