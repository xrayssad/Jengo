"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Building2, Camera, Check, Home, ImagePlus, LandPlot, Store, Warehouse } from "lucide-react";
import JengoLoader from "@/components/JengoLoader";
import { queueInstallNudge } from "@/lib/install";
import { createListing, fetchListings, formatPrice, uploadPhoto, type Listing } from "@/lib/api";
import { canonicalCategory, categoryConfig, photoMinimum, MAX_PHOTOS, CATEGORIES, type CategoryId } from "@/lib/categories.config";
import { readScoped, removeScoped, writeScoped } from "@/lib/userScope";
import { rememberListing } from "@/lib/mine";
import { useI18n } from "@/lib/i18n";
import { emptyPlot, plotPayload, plotReady, type PlotDraft } from "@/lib/plots";
import PlotFields from "@/components/PlotFields";
import { usePrefersReducedMotion } from "@/lib/motion";
import AuthGate from "@/components/AuthGate";
import ListingCard from "@/components/ListingCard";
import PlacePicker, { type PlaceValue } from "@/components/PlacePicker";
import { bannedLocation, coordLabel, needsLandmark, resolvingLocation, reverseGeocode, roundCoord } from "@/lib/geo";
import ScreenHeader from "@/components/ScreenHeader";
import DateStrip from "@/components/DateStrip";

const HOME_TENURE = ["gro", "cro", "licence", "other"] as const;
const HOME_DOCS = ["title", "survey", "search", "receipts", "seller_id"] as const;
const HOME_PAY = ["full", "installments", "booking"] as const;

const CATEGORY_ICONS = {
  "rooms-houses": Home,
  apartment_airbnb: Building2,
  store_godown: Warehouse,
  frame: Store,
  plots: LandPlot,
  vifaa: Boxes,
} as const;

const units = [
  { id: "mfuko", label: "bag" },
  { id: "tani", label: "tonne" },
  { id: "kipande", label: "piece" },
  { id: "dei", label: "day" },
];

const periods: Record<string, { id: string; label: string }[]> = {
  "rooms-houses": [
    { id: "mwezi", label: "Month" },
    { id: "miezi_3", label: "3 months" },
    { id: "miezi_6", label: "6 months" },
    { id: "mwaka", label: "Year" },
  ],
  apartment_airbnb: [
    { id: "usiku", label: "Night" },
    { id: "siku", label: "Day" },
    { id: "wiki", label: "Week" },
    { id: "mwezi", label: "Month" },
  ],
  store_godown: [
    { id: "mwezi", label: "Month" },
    { id: "miezi_3", label: "3 months" },
    { id: "miezi_6", label: "6 months" },
    { id: "mwaka", label: "Year" },
  ],
  frame: [
    { id: "mwezi", label: "Month" },
    { id: "miezi_3", label: "3 months" },
    { id: "miezi_6", label: "6 months" },
    { id: "mwaka", label: "Year" },
  ],
};

const roomTypes = [
  { id: "single", label: "Single room" },
  { id: "master", label: "Master" },
  { id: "self", label: "Self-contained" },
  { id: "apartment", label: "Apartment unit" },
  { id: "house", label: "Whole house" },
];

const amenitySets: Record<string, string[]> = {
  "rooms-houses": ["Water", "Electricity", "Fence", "Security", "Parking", "Wi-Fi", "Furnished", "Tiled"],
  apartment_airbnb: ["Water", "Electricity", "Security", "Parking", "Wi-Fi", "Furnished", "Tiled"],
  store_godown: ["Water", "Electricity", "Security", "Parking", "Road access"],
  frame: ["Electricity", "Security", "Water"],
  vifaa: ["Delivery", "Parking"],
};

type Pending = { id: string; preview: string; file: File; error: boolean; progress: number };

type Draft = {
  step: number;
  category: string;
  title: string;
  description: string;
  price: string;
  negotiable: boolean;
  period: string;
  unit: string;
  stock: string;
  bedrooms: number;
  bathrooms: number;
  roomType: string;
  homeDeal: "rent" | "sale";
  tenure: string;
  homeDocs: string[];
  landM2: string;
  builtM2: string;
  homePay: string;
  houseRules: string;
  deposit: string;
  available: string;
  guests: number;
  minNights: number;
  size: string;
  frontage: string;
  market: string;
  frameSize: string;
  minOrder: string;
  amenities: string[];
  photos: string[];
  place: PlaceValue;
  phones: string[];
  whatsapp: string;
  sameWa: boolean;
  posterRole: string;
  freeViewing: boolean;
  directOwner: boolean;
  costsOk: boolean;
  advance: string;
  agentFee: string;
  cleaning: string;
  extraGuest: string;
  goodwill: string;
  landmark: string;
  showExact: boolean;
  directions: string;
  water: string;
  power: string;
  cancelPolicy: string;
  subtype: string;
  floor: string;
  suitable: string;
  condition: string;
  truck: string;
  allowedGoods: string;
  deliveryNote: string;
  ceiling: string;
  licenseNote: string;
  plot: PlotDraft;
};

function digits(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 12);
}

function grouped(value: string) {
  if (!value) return "";
  return Number(value).toLocaleString("en-TZ");
}

function tzPhone(value: string) {
  const clean = value.replace(/[\s-]/g, "");
  return /^(\+255|0)[67]\d{8}$/.test(clean);
}

async function compress(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    bitmap.close?.();
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

const emptyPlace: PlaceValue = { location: "", city: "", lat: null, lng: null };

export default function WekaTangazoPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const reduce = usePrefersReducedMotion();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [category, setCategory] = useState<CategoryId>("rooms-houses");
  const [plot, setPlot] = useState<PlotDraft>(emptyPlot);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [period, setPeriod] = useState("mwezi");
  const [unit, setUnit] = useState("mfuko");
  const [stock, setStock] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [roomType, setRoomType] = useState("single");
  const [homeDeal, setHomeDeal] = useState<"rent" | "sale">("rent");
  const [tenure, setTenure] = useState("");
  const [homeDocs, setHomeDocs] = useState<string[]>([]);
  const [landM2, setLandM2] = useState("");
  const [builtM2, setBuiltM2] = useState("");
  const [homePay, setHomePay] = useState("full");
  const [houseRules, setHouseRules] = useState("");
  const [deposit, setDeposit] = useState("");
  const [available, setAvailable] = useState("");
  const [guests, setGuests] = useState(2);
  const [minNights, setMinNights] = useState(1);
  const [size, setSize] = useState("");
  const [frontage, setFrontage] = useState("");
  const [market, setMarket] = useState("");
  const [frameSize, setFrameSize] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [place, setPlace] = useState<PlaceValue>(emptyPlace);
  const [phones, setPhones] = useState<string[]>([""]);
  const [whatsapp, setWhatsapp] = useState("");
  const [sameWa, setSameWa] = useState(false);
  const [posterRole, setPosterRole] = useState("owner");
  const [freeViewing, setFreeViewing] = useState(true);
  const [directOwner, setDirectOwner] = useState(true);
  const [costsOk, setCostsOk] = useState(false);
  const [advance, setAdvance] = useState("1");
  const [agentFee, setAgentFee] = useState("");
  const [cleaning, setCleaning] = useState("");
  const [extraGuest, setExtraGuest] = useState("");
  const [goodwill, setGoodwill] = useState("");
  const [landmark, setLandmark] = useState("");
  const [showExact, setShowExact] = useState(false);
  const [directions, setDirections] = useState("");
  const [water, setWater] = useState("");
  const [power, setPower] = useState("");
  const [cancelPolicy, setCancelPolicy] = useState("flexible");
  const [subtype, setSubtype] = useState("shop");
  const [floor, setFloor] = useState("");
  const [suitable, setSuitable] = useState("");
  const [condition, setCondition] = useState("new");
  const [truck, setTruck] = useState("");
  const [allowedGoods, setAllowedGoods] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [ceiling, setCeiling] = useState("");
  const [licenseNote, setLicenseNote] = useState("");
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState<Listing | null>(null);
  const [pool, setPool] = useState<Listing[]>([]);
  const [askDraft, setAskDraft] = useState(false);
  const [preview, setPreview] = useState<"card" | "detail">("card");
  const draftRaw = useRef<string | null>(null);
  const lock = useRef(false);
  const plotPinTimer = useRef(0);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = readScoped("draft");
      if (raw) {
        draftRaw.current = raw;
        setAskDraft(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchListings({ status: "active", limit: 40, category })
      .then((res) => setPool(res.items || []))
      .catch(() => setPool([]));
  }, [category]);

  const draft = useMemo<Draft>(
    () => ({
      step,
      category,
      title,
      description,
      price,
      negotiable,
      period,
      unit,
      stock,
      bedrooms,
      bathrooms,
      roomType,
      homeDeal,
      tenure,
      homeDocs,
      landM2,
      builtM2,
      homePay,
      houseRules,
      deposit,
      available,
      guests,
      minNights,
      size,
      frontage,
      market,
      frameSize,
      minOrder,
      amenities,
      photos,
      place,
      phones,
      whatsapp,
      sameWa,
      posterRole,
      freeViewing,
      directOwner,
      costsOk,
      advance,
      agentFee,
      cleaning,
      extraGuest,
      goodwill,
      landmark,
      showExact,
      directions,
      water,
      power,
      cancelPolicy,
      subtype,
      floor,
      suitable,
      condition,
      truck,
      allowedGoods,
      deliveryNote,
      ceiling,
      licenseNote,
      plot,
    }),
    [
      step, category, title, description, price, negotiable, period, unit, stock, bedrooms, bathrooms,
      roomType, homeDeal, tenure, homeDocs, landM2, builtM2, homePay, houseRules, deposit, available, guests, minNights, size, frontage, market, frameSize, minOrder,
      amenities, photos, place, phones, whatsapp, sameWa, posterRole, freeViewing, directOwner, costsOk,
      advance, agentFee, cleaning, extraGuest, goodwill, landmark, showExact, directions, water, power, cancelPolicy,
      subtype, floor, suitable, condition, truck, allowedGoods, deliveryNote, ceiling, licenseNote, plot,
    ],
  );

  useEffect(() => {
    if (askDraft || done) return;
    const id = window.setTimeout(() => {
      try {
        writeScoped("draft", JSON.stringify(draft));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [askDraft, done, draft]);

  const applyDraft = () => {
    try {
      const saved = JSON.parse(draftRaw.current || "") as Partial<Draft>;
      if (saved.category) {
        const next = canonicalCategory(saved.category);
        if (next) setCategory(next as CategoryId);
      }
      if (saved.plot && typeof saved.plot === "object") setPlot({ ...emptyPlot(), ...saved.plot });
      if (typeof saved.title === "string") setTitle(saved.title);
      if (typeof saved.description === "string") setDescription(saved.description);
      if (typeof saved.price === "string") setPrice(saved.price);
      if (typeof saved.negotiable === "boolean") setNegotiable(saved.negotiable);
      if (typeof saved.period === "string") setPeriod(saved.period);
      if (typeof saved.unit === "string") setUnit(saved.unit);
      if (typeof saved.stock === "string") setStock(saved.stock);
      if (typeof saved.bedrooms === "number") setBedrooms(saved.bedrooms);
      if (typeof saved.bathrooms === "number") setBathrooms(saved.bathrooms);
      if (typeof saved.roomType === "string") setRoomType(saved.roomType);
      if (saved.homeDeal === "rent" || saved.homeDeal === "sale") setHomeDeal(saved.homeDeal);
      if (typeof saved.tenure === "string") setTenure(saved.tenure);
      if (Array.isArray(saved.homeDocs)) setHomeDocs(saved.homeDocs.filter((item) => typeof item === "string"));
      if (typeof saved.landM2 === "string") setLandM2(saved.landM2);
      if (typeof saved.builtM2 === "string") setBuiltM2(saved.builtM2);
      if (typeof saved.homePay === "string") setHomePay(saved.homePay);
      if (typeof saved.houseRules === "string") setHouseRules(saved.houseRules);
      if (typeof saved.deposit === "string") setDeposit(saved.deposit);
      if (typeof saved.available === "string") setAvailable(saved.available);
      if (typeof saved.guests === "number") setGuests(saved.guests);
      if (typeof saved.minNights === "number") setMinNights(saved.minNights);
      if (typeof saved.size === "string") setSize(saved.size);
      if (typeof saved.frontage === "string") setFrontage(saved.frontage);
      if (typeof saved.market === "string") setMarket(saved.market);
      if (typeof saved.frameSize === "string") setFrameSize(saved.frameSize);
      if (typeof saved.minOrder === "string") setMinOrder(saved.minOrder);
      if (Array.isArray(saved.amenities)) setAmenities(saved.amenities.filter((item) => typeof item === "string"));
      if (Array.isArray(saved.photos)) setPhotos(saved.photos.filter((item) => typeof item === "string").slice(0, MAX_PHOTOS));
      if (saved.place) setPlace({ ...emptyPlace, ...saved.place });
      if (Array.isArray(saved.phones) && saved.phones.length) setPhones(saved.phones.slice(0, 3));
      if (typeof saved.whatsapp === "string") setWhatsapp(saved.whatsapp);
      if (typeof saved.sameWa === "boolean") setSameWa(saved.sameWa);
      if (typeof saved.posterRole === "string") setPosterRole(saved.posterRole);
      if (typeof saved.freeViewing === "boolean") setFreeViewing(saved.freeViewing);
      if (typeof saved.directOwner === "boolean") setDirectOwner(saved.directOwner);
      if (typeof saved.costsOk === "boolean") setCostsOk(saved.costsOk);
      if (typeof saved.advance === "string") setAdvance(saved.advance);
      if (typeof saved.agentFee === "string") setAgentFee(saved.agentFee);
      if (typeof saved.cleaning === "string") setCleaning(saved.cleaning);
      if (typeof saved.extraGuest === "string") setExtraGuest(saved.extraGuest);
      if (typeof saved.goodwill === "string") setGoodwill(saved.goodwill);
      if (typeof saved.landmark === "string") setLandmark(saved.landmark);
      if (typeof saved.showExact === "boolean") setShowExact(saved.showExact);
      if (typeof saved.directions === "string") setDirections(saved.directions);
      if (typeof saved.water === "string") setWater(saved.water);
      if (typeof saved.power === "string") setPower(saved.power);
      if (typeof saved.cancelPolicy === "string") setCancelPolicy(saved.cancelPolicy);
      if (typeof saved.subtype === "string") setSubtype(saved.subtype);
      if (typeof saved.floor === "string") setFloor(saved.floor);
      if (typeof saved.suitable === "string") setSuitable(saved.suitable);
      if (typeof saved.condition === "string") setCondition(saved.condition);
      if (typeof saved.truck === "string") setTruck(saved.truck);
      if (typeof saved.allowedGoods === "string") setAllowedGoods(saved.allowedGoods);
      if (typeof saved.deliveryNote === "string") setDeliveryNote(saved.deliveryNote);
      if (typeof saved.ceiling === "string") setCeiling(saved.ceiling);
      if (typeof saved.licenseNote === "string") setLicenseNote(saved.licenseNote);
      if (typeof saved.step === "number") setStep(Math.min(5, Math.max(1, saved.step)));
    } catch {
      try {
        removeScoped("draft");
      } catch {
        /* ignore */
      }
    }
    setAskDraft(false);
  };

  const movePlotPin = (lat: number, lng: number) => {
    const nextLat = roundCoord(lat);
    const nextLng = roundCoord(lng);
    const speech = lang === "sw" ? "sw" : "en";
    setPlace((cur) => ({
      ...cur,
      lat: nextLat,
      lng: nextLng,
      location_source: "pin",
      confirmed: false,
      accuracy_m: null,
    }));
    window.clearTimeout(plotPinTimer.current);
    plotPinTimer.current = window.setTimeout(() => {
      void reverseGeocode(nextLat, nextLng, speech)
        .then((described) => {
          const label = described.label && !bannedLocation(described.label) ? described.label : coordLabel(nextLat, nextLng, speech);
          setPlace((cur) => {
            if (cur.lat !== nextLat || cur.lng !== nextLng) return cur;
            return {
              ...cur,
              location: label,
              city: described.city || cur.city,
              region: described.region || "",
              district: described.district || "",
              ward: described.ward || "",
              location_source: "pin",
              confirmed: false,
            };
          });
        })
        .catch(() => {
          setPlace((cur) => {
            if (cur.lat !== nextLat || cur.lng !== nextLng) return cur;
            return { ...cur, location: coordLabel(nextLat, nextLng, speech), location_source: "pin", confirmed: false };
          });
        });
    }, 600);
  };

  useEffect(() => () => window.clearTimeout(plotPinTimer.current), []);

  const dropDraft = () => {
    draftRaw.current = null;
    try {
      removeScoped("draft");
    } catch {
      /* ignore */
    }
    setAskDraft(false);
  };

  const phoneErrors = phones.map((value) => (value.trim() && !tzPhone(value) ? "Use 07xx, 06xx or +255." : ""));
  const waError = !sameWa && whatsapp.trim() && !tzPhone(whatsapp) ? "Use 07xx, 06xx or +255." : "";

  const stepValid = (() => {
    if (step === 1) return true;
    if (step === 2) {
      if (title.trim().length < 3 || !price) return false;
      if (category === "vifaa" && (stock === "" || Number(stock) < 0)) return false;
      if (posterRole === "agent" && category !== "plots" && !(category === "rooms-houses" && homeDeal === "sale") && !agentFee) return false;
      if (category === "plots" && !plotReady(plot)) return false;
      return true;
    }
    if (step === 3) return photos.length >= photoMinimum(category) && pending.every((item) => item.error);
    if (step === 4) {
      const label = place.location.trim();
      if (label.length < 2 || bannedLocation(label) || resolvingLocation(label)) return false;
      if (needsLandmark(label) && !(landmark.trim() || place.landmark)) return false;
      if (place.lat != null && place.location_source && place.location_source !== "manual" && !place.confirmed) return false;
      if (category === "plots" && (place.lat == null || place.lng == null)) return false;
      if (phoneErrors.some(Boolean) || waError) return false;
      return true;
    }
    return true;
  })();

  const band = useMemo(() => {
    const needle = (place.city || place.location).trim().toLowerCase();
    const match = pool.filter((item) => {
      if (canonicalCategory(item.category) !== category && item.category !== category) return false;
      if (!needle) return true;
      return `${item.city || ""} ${item.location || ""}`.toLowerCase().includes(needle.split(",")[0]);
    });
    const prices = match.map((item) => Number(item.price)).filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length < 3) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [pool, category, place.city, place.location]);

  const go = (next: number) => {
    setDir(next > step ? "fwd" : "back");
    setTried(false);
    setStep(next);
  };

  const forward = () => {
    if (!stepValid) {
      setTried(true);
      return;
    }
    go(Math.min(5, step + 1));
  };

  const addFiles = async (files: FileList | null) => {
    const room = MAX_PHOTOS - photos.length - pending.filter((item) => !item.error).length;
    const batch = Array.from(files || []).slice(0, Math.max(0, room));
    if (!batch.length) return;
    for (const file of batch) {
      const id = `${Date.now()}-${file.name}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      setPending((cur) => [...cur, { id, preview, file, error: false, progress: 0 }]);
      const ready = await compress(file);
      try {
        const res = await uploadPhoto(ready, false, (value) => {
          setPending((cur) => cur.map((item) => (item.id === id ? { ...item, progress: value } : item)));
        });
        if (res.url) setPhotos((cur) => (cur.length >= MAX_PHOTOS ? cur : [...cur, res.url]));
        setPending((cur) => cur.filter((item) => item.id !== id));
        URL.revokeObjectURL(preview);
      } catch {
        setPending((cur) => cur.map((item) => (item.id === id ? { ...item, error: true, file: ready } : item)));
      }
    }
  };

  const retry = async (item: Pending) => {
    setPending((cur) => cur.map((row) => (row.id === item.id ? { ...row, error: false } : row)));
    try {
      const res = await uploadPhoto(item.file, false, (value) => {
        setPending((cur) => cur.map((row) => (row.id === item.id ? { ...row, progress: value } : row)));
      });
      if (res.url) setPhotos((cur) => (cur.length >= MAX_PHOTOS ? cur : [...cur, res.url]));
      setPending((cur) => cur.filter((row) => row.id !== item.id));
      URL.revokeObjectURL(item.preview);
    } catch {
      setPending((cur) => cur.map((row) => (row.id === item.id ? { ...row, error: true } : row)));
    }
  };

  const hold = (index: number) => (event: React.PointerEvent) => {
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    let target = index;
    const timer = window.setTimeout(() => {
      dragging = true;
    }, 380);
    const move = (e: PointerEvent) => {
      if (!dragging && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) window.clearTimeout(timer);
      if (!dragging) return;
      const node = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-shot]");
      const next = Number(node?.dataset.shot);
      if (Number.isInteger(next)) target = next;
    };
    const up = () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setPhotos((cur) => {
        if (dragging) {
          if (target === index || target < 0 || target >= cur.length) return cur;
          const copy = cur.slice();
          const [item] = copy.splice(index, 1);
          copy.splice(target, 0, item);
          return copy;
        }
        if (index <= 0 || index >= cur.length) return cur;
        const copy = cur.slice();
        const [item] = copy.splice(index, 1);
        copy.unshift(item);
        return copy;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const optional = () => {
    const extra: Record<string, unknown> = {};
    extra.poster_role = posterRole;
    extra.free_viewing = category !== "vifaa" && category !== "apartment_airbnb" && category !== "plots" && freeViewing;
    extra.direct_owner = posterRole === "owner" || directOwner;
    extra.costs_confirmed = costsOk;
    if (advance) extra.months_advance = Number(advance) || 1;
    if (agentFee) extra.agent_fee = Number(agentFee);
    if (cleaning) extra.cleaning_fee = Number(cleaning);
    if (extraGuest) extra.extra_guest_fee = Number(extraGuest);
    if (goodwill) extra.goodwill = Number(goodwill);
    if (landmark.trim() || place.landmark) extra.landmark = (landmark.trim() || place.landmark || "").trim();
    if (place.accuracy_m != null) extra.accuracy_m = place.accuracy_m;
    if (place.location_source) extra.location_source = place.location_source;
    if (place.region) extra.region = place.region;
    if (place.district) extra.district = place.district;
    if (place.ward) extra.ward = place.ward;
    extra.location_text = place.location.trim();
    if (category === "rooms-houses" || category === "apartment_airbnb") extra.show_exact = showExact;
    if (directions.trim()) extra.directions = directions.trim();
    if (water) extra.water = water;
    if (power) extra.electricity = power;
    if (category === "apartment_airbnb") extra.cancellation = cancelPolicy;
    if (category === "store_godown") extra.subtype = subtype;
    if (floor.trim()) extra.floor = floor.trim();
    if (suitable.trim()) extra.suitable = suitable.trim();
    if (category === "vifaa") extra.condition = condition;
    if (truck.trim()) extra.truck = truck.trim();
    if (allowedGoods.trim()) extra.allowed_goods = allowedGoods.trim();
    if (deliveryNote.trim()) extra.delivery_note = deliveryNote.trim();
    if (ceiling.trim()) extra.ceiling = ceiling.trim();
    if (licenseNote.trim()) extra.license_note = licenseNote.trim();
    if (negotiable) extra.negotiable = true;
    if (amenities.length) extra.amenities = amenities;
    if (category === "rooms-houses") {
      extra.listing_type = homeDeal;
      extra.bedrooms = bedrooms;
      extra.bathrooms = bathrooms;
      extra.room_type = roomType;
      extra.property_type = roomType;
      if (homeDeal === "sale") {
        if (tenure) extra.tenure = tenure;
        if (homeDocs.length) extra.documents = homeDocs;
        if (landM2) extra.land_m2 = Number(landM2);
        if (builtM2) extra.built_m2 = Number(builtM2);
        extra.payment = homePay;
        extra.condition = condition === "new" ? "new" : "used";
      } else {
        if (deposit) extra.deposit = Number(deposit);
        if (available) extra.available_from = available;
        if (houseRules.trim()) extra.house_rules = houseRules.trim();
      }
    }
    if (category === "apartment_airbnb") {
      extra.guests = guests;
      extra.bedrooms = bedrooms;
      extra.min_nights = minNights;
    }
    if (category === "store_godown") {
      if (size) extra.size_m2 = Number(size);
      if (frontage.trim()) extra.frontage = frontage.trim();
    }
    if (category === "frame") {
      if (frameSize.trim()) extra.frame_size = frameSize.trim();
      if (market.trim()) extra.market_name = market.trim();
    }
    if (category === "vifaa" && minOrder) extra.min_order = Number(minOrder);
    if (category === "plots") Object.assign(extra, plotPayload(plot, Number(price || 0)));
    const wa = sameWa ? phones[0] : whatsapp;
    if (wa.trim()) extra.whatsapp = wa.trim();
    return extra;
  };

  const publish = async () => {
    if (lock.current || !stepValid) return;
    lock.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const isVifaa = category === "vifaa";
      const isPlot = category === "plots";
      const contact = phones.map((item) => item.trim()).filter(Boolean).slice(0, 3);
      const desc = description.trim();
      const extra = optional();
      const created = await createListing({
        category,
        title: title.trim(),
        description: contact.length ? `${desc}${desc ? "\n\n" : ""}Phone: ${contact.join(", ")}` : desc,
        price: Number(price),
        period: isVifaa || isPlot || (category === "rooms-houses" && homeDeal === "sale") ? "" : period,
        location: place.location.trim(),
        city: place.city.trim(),
        images: photos.slice(0, MAX_PHOTOS),
        lat: place.lat,
        lng: place.lng,
        phones: contact,
        ...(isVifaa ? { unit, stock: Number(stock) } : {}),
        attributes: extra,
      });
      if (created?.id) rememberListing(String(created.id));
      try {
        removeScoped("draft");
      } catch {
        /* ignore */
      }
      setDone(created);
      queueInstallNudge("publish");
    } catch {
      setFailed(true);
      lock.current = false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    lock.current = false;
    setDone(null);
    setStep(1);
    setTitle("");
    setDescription("");
    setPrice("");
    setNegotiable(false);
    setStock("");
    setAmenities([]);
    setPhotos([]);
    setPending([]);
    setPlace(emptyPlace);
    setLandmark("");
    setShowExact(false);
    setPhones([""]);
    setWhatsapp("");
    setSameWa(false);
    setFailed(false);
  };

  const score = Math.min(
    100,
    (title.trim().length >= 3 ? 15 : 0) +
      (price ? 15 : 0) +
      (photos.length ? 20 : 0) +
      (photos.length >= 3 ? 10 : 0) +
      (description.trim().length >= 40 ? 15 : 0) +
      (amenities.length ? 10 : 0) +
      (place.lat != null ? 15 : 0),
  );

  const previewItem: Listing = {
    id: "preview",
    category,
    title: title || "Listing title",
    price: Number(price || 0),
    period: category === "vifaa" || category === "plots" || (category === "rooms-houses" && homeDeal === "sale") ? "" : period,
    location: place.location,
    city: place.city,
    images: photos,
    unit: category === "vifaa" ? unit : undefined,
    stock: category === "vifaa" && stock !== "" ? Number(stock) : undefined,
    fit: {
      poster_role: posterRole === "agent" || posterRole === "caretaker" || posterRole === "business" || posterRole === "developer" ? posterRole : "owner",
      free_viewing: category !== "vifaa" && category !== "apartment_airbnb" && category !== "plots" && freeViewing,
      direct_owner: posterRole === "owner" || directOwner,
      costs_confirmed: costsOk,
      months_advance: Number(advance) || 1,
      deposit: deposit ? Number(deposit) : 0,
      agent_fee: agentFee ? Number(agentFee) : 0,
      cleaning_fee: cleaning ? Number(cleaning) : 0,
      extra_guest_fee: extraGuest ? Number(extraGuest) : 0,
      goodwill: goodwill ? Number(goodwill) : 0,
      guests,
      subtype,
      room_type: roomType,
      property_type: roomType,
      listing_type: category === "rooms-houses" ? homeDeal : undefined,
      tenure: category === "rooms-houses" && homeDeal === "sale" ? tenure : undefined,
      documents: category === "rooms-houses" && homeDeal === "sale" ? homeDocs : undefined,
      land_m2: landM2 ? Number(landM2) : undefined,
      built_m2: builtM2 ? Number(builtM2) : undefined,
      payment: category === "rooms-houses" && homeDeal === "sale" ? homePay : undefined,
      condition: category === "rooms-houses" && homeDeal === "sale" ? condition : undefined,
      negotiable,
      ...(category === "plots" ? plotPayload(plot, Number(price || 0)) : {}),
    },
  };

  const share = () => {
    if (!done?.id) return;
    const url = `${window.location.origin}/tangazo/${done.id}`;
    const data = { title: done.title, url };
    if (navigator.share) {
      navigator.share(data).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(url).catch(() => {});
  };

  const chip = (id: string, label: string, on: boolean, pick: () => void) => (
    <button key={id} type="button" className={on ? "filter-chip is-on" : "filter-chip"} aria-pressed={on} onClick={pick}>
      {label}
    </button>
  );

  const stepper = (label: string, value: number, set: (n: number) => void, min = 0, max = 20) => (
    <div className="wizard-field">
      <span className="wizard-label">{label}</span>
      <div className="wizard-stepper">
        <button type="button" onClick={() => set(Math.max(min, value - 1))} aria-label={`Less ${label}`}>–</button>
        <span>{value}</span>
        <button type="button" onClick={() => set(Math.min(max, value + 1))} aria-label={`More ${label}`}>+</button>
      </div>
    </div>
  );

  if (done?.id) {
    return (
      <AuthGate>
        <main className="wizard-page">
          {!reduce ? (
            <div className="confetti" aria-hidden>
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} style={{ left: `${6 + i * 6}%`, animationDelay: `${i * 40}ms`, background: i % 2 ? "var(--accent)" : "var(--primary)" }} />
              ))}
            </div>
          ) : null}
          <div className="wizard-success">
            <span className="wizard-check"><Check size={32} /></span>
            <h1 className="font-heading text-4xl">{t("wizard.sent")}</h1>
            <p style={{ color: "var(--muted)" }}>{t("wizard.live")}</p>
            <button type="button" className="btn-primary" onClick={() => router.push(`/tangazo/${done.id}`)}>{t("wizard.view")}</button>
            <button type="button" className="btn-secondary" onClick={share}>{t("wizard.share")}</button>
            <button type="button" className="btn-secondary" onClick={reset}>{t("wizard.another")}</button>
          </div>
        </main>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <main className="wizard-page">
        <ScreenHeader
          compact
          title={t("wizard.post")}
          note={t("wizard.step", { n: step })}
          backLabel={t("wizard.back")}
          step={step}
          steps={5}
          onBack={() => (step > 1 ? go(step - 1) : router.push("/home"))}
        />

        <div className="wizard-body">
          <div key={step} className={dir === "back" ? "wizard-pane is-back" : "wizard-pane"}>
            {askDraft ? (
              <div className="wizard-banner">
                <p>{t("wizard.draft")}</p>
                <div>
                  <button type="button" className="btn-primary px-4" onClick={applyDraft}>{t("wizard.keep")}</button>
                  <button type="button" className="btn-secondary px-4" onClick={dropDraft}>{t("wizard.fresh")}</button>
                </div>
              </div>
            ) : null}

            {step === 1 && (
              <div className="wizard-cats">
                {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => {
                  const item = CATEGORIES[id];
                  const Icon = CATEGORY_ICONS[id];
                  const on = category === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={on ? "wizard-cat is-on" : "wizard-cat"}
                      aria-pressed={on}
                      onClick={() => {
                        setCategory(id);
                        if (periods[id]) setPeriod(periods[id][0].id);
                        setAmenities([]);
                      }}
                    >
                      <Icon size={22} />
                      <span className="wizard-cat-name">{lang === "sw" ? item.sw : item.en}</span>
                      <span className="wizard-cat-hint">{lang === "sw" ? item.hint.sw : item.hint.en}</span>
                      {on ? <Check className="wizard-cat-mark" size={16} /> : null}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div>
                {category === "rooms-houses" ? (
                  <div className="deal-switch wizard-deal" role="tablist" aria-label={t("deal.rent")}>
                    <button type="button" role="tab" aria-selected={homeDeal === "rent"} className={homeDeal === "rent" ? "is-on" : ""} onClick={() => setHomeDeal("rent")}>{t("deal.rent")}</button>
                    <button type="button" role="tab" aria-selected={homeDeal === "sale"} className={homeDeal === "sale" ? "is-on" : ""} onClick={() => setHomeDeal("sale")}>{t("deal.sale")}</button>
                  </div>
                ) : null}
                <label className="wizard-field">
                  <span className="wizard-label">Title <i>*</i> <span className="wizard-optional">{title.length}/80</span></span>
                  <input className="wizard-input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
                  <span className="wizard-hint">A clear title is easier to find.</span>
                  {tried && title.trim().length < 3 ? <span className="wizard-error">Add a title of at least 3 letters.</span> : null}
                </label>
                <label className="wizard-field">
                  <span className="wizard-label">Description <span className="wizard-optional">({t("optional")}) {description.length}/500</span></span>
                  <textarea className="wizard-input" rows={4} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <label className="wizard-field">
                  <span className="wizard-label">{category === "rooms-houses" && homeDeal === "sale" ? t("deal.total") : "Price (TSh)"} <i>*</i></span>
                  <input
                    className="wizard-input"
                    inputMode="numeric"
                    value={grouped(price)}
                    onChange={(e) => setPrice(digits(e.target.value))}
                  />
                  {band ? <span className="wizard-hint">{t("wizard.similar", { min: formatPrice(band.min), max: formatPrice(band.max) })}</span> : null}
                  {tried && !price ? <span className="wizard-error">Enter a price.</span> : null}
                </label>
                <div className="wizard-toggle">
                  <span>{t("wizard.negotiable")}</span>
                  <button type="button" className={negotiable ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={negotiable} onClick={() => setNegotiable((v) => !v)}>
                    <i />
                  </button>
                </div>
                <div className="wizard-field">
                  <span className="wizard-label">{t("fit.role.owner")}</span>
                  <div className="wizard-chips">
                    {(category === "plots" ? (["owner", "agent", "developer"] as const) : (["owner", "agent", "caretaker", "business"] as const)).map((role) =>
                      chip(role, t(`fit.role.${role}`), posterRole === role, () => {
                        setPosterRole(role);
                        if (role === "owner") setDirectOwner(true);
                      }),
                    )}
                  </div>
                </div>
                {category !== "vifaa" && category !== "plots" && !(category === "rooms-houses" && homeDeal === "sale") ? (
                  <label className="wizard-field">
                    <span className="wizard-label">{t("fit.advance")}</span>
                    <input className="wizard-input" inputMode="numeric" value={advance} onChange={(e) => setAdvance(digits(e.target.value).slice(0, 2))} />
                  </label>
                ) : null}
                {posterRole === "agent" && category !== "plots" && !(category === "rooms-houses" && homeDeal === "sale") ? (
                  <label className="wizard-field">
                    <span className="wizard-label">{t("fit.agentFee")} <i>*</i></span>
                    <input className="wizard-input" inputMode="numeric" value={grouped(agentFee)} onChange={(e) => setAgentFee(digits(e.target.value))} />
                    {tried && !agentFee ? <span className="wizard-error">{t("fit.agentFee")}</span> : null}
                  </label>
                ) : null}
                {category === "apartment_airbnb" ? (
                  <div className="wizard-row">
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.cleaningFee")}</span>
                      <input className="wizard-input" inputMode="numeric" value={grouped(cleaning)} onChange={(e) => setCleaning(digits(e.target.value))} />
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.extraGuest")}</span>
                      <input className="wizard-input" inputMode="numeric" value={grouped(extraGuest)} onChange={(e) => setExtraGuest(digits(e.target.value))} />
                    </label>
                  </div>
                ) : null}
                {category === "frame" || category === "store_godown" ? (
                  <label className="wizard-field">
                    <span className="wizard-label">{t("fit.goodwill")}</span>
                    <input className="wizard-input" inputMode="numeric" value={grouped(goodwill)} onChange={(e) => setGoodwill(digits(e.target.value))} />
                  </label>
                ) : null}
                {category === "store_godown" ? (
                  <div className="wizard-field">
                    <span className="wizard-label">{t("fit.subtype")}</span>
                    <div className="wizard-chips">
                      {(["shop", "godown"] as const).map((kind) => chip(kind, t(`fit.subtype.${kind}`), subtype === kind, () => setSubtype(kind)))}
                    </div>
                  </div>
                ) : null}
                {category === "frame" || category === "store_godown" ? (
                  <>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.floor")}</span>
                      <input className="wizard-input" value={floor} onChange={(e) => setFloor(e.target.value)} />
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.suitable")}</span>
                      <input className="wizard-input" value={suitable} onChange={(e) => setSuitable(e.target.value)} />
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.license")}</span>
                      <input className="wizard-input" value={licenseNote} onChange={(e) => setLicenseNote(e.target.value)} />
                    </label>
                  </>
                ) : null}
                {category === "store_godown" && subtype === "godown" ? (
                  <>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.truck")}</span>
                      <input className="wizard-input" value={truck} onChange={(e) => setTruck(e.target.value)} placeholder="lorry, trailer, 20ft" />
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.ceiling")}</span>
                      <input className="wizard-input" value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.allowed")}</span>
                      <input className="wizard-input" value={allowedGoods} onChange={(e) => setAllowedGoods(e.target.value)} />
                    </label>
                  </>
                ) : null}
                {category === "vifaa" ? (
                  <>
                    <div className="wizard-field">
                      <span className="wizard-label">{t("fit.condition")}</span>
                      <div className="wizard-chips">
                        {(["new", "used", "refurbished"] as const).map((kind) => chip(kind, t(`fit.condition.${kind}`), condition === kind, () => setCondition(kind)))}
                      </div>
                    </div>
                    <label className="wizard-field">
                      <span className="wizard-label">{t("fit.deliveryNote")}</span>
                      <input className="wizard-input" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} />
                    </label>
                  </>
                ) : null}
                {category === "plots" ? (
                  <PlotFields part="deal" plot={plot} price={price} tried={tried} onChange={setPlot} />
                ) : null}
                {category === "rooms-houses" && homeDeal === "rent" ? (
                  <>
                    <div className="wizard-field">
                      <span className="wizard-label">{t("fit.water")}</span>
                      <div className="wizard-chips">
                        {(["mains", "borehole", "tank"] as const).map((kind) => chip(kind, t(`fit.water.${kind}`), water === kind, () => setWater(kind)))}
                      </div>
                    </div>
                    <div className="wizard-field">
                      <span className="wizard-label">{t("fit.power")}</span>
                      <div className="wizard-chips">
                        {(["luku", "shared", "included"] as const).map((kind) => chip(kind, t(`fit.power.${kind}`), power === kind, () => setPower(kind)))}
                      </div>
                    </div>
                  </>
                ) : null}
                {category === "apartment_airbnb" ? (
                  <div className="wizard-field">
                    <span className="wizard-label">{t("fit.cancel")}</span>
                    <div className="wizard-chips">
                      {(["flexible", "moderate", "strict"] as const).map((kind) => chip(kind, t(`fit.cancel.chip.${kind}`), cancelPolicy === kind, () => setCancelPolicy(kind)))}
                    </div>
                    <p className="fit-note">{t(`fit.cancel.${cancelPolicy}`)}</p>
                  </div>
                ) : null}
                {category !== "vifaa" && category !== "apartment_airbnb" && category !== "plots" ? (
                <div className="wizard-toggle">
                  <span>{t("fit.freeViewing")}</span>
                  <button type="button" className={freeViewing ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={freeViewing} onClick={() => setFreeViewing((v) => !v)}><i /></button>
                </div>
                ) : null}
                {posterRole !== "owner" ? (
                  <div className="wizard-toggle">
                    <span>{t("fit.directOwner")}</span>
                    <button type="button" className={directOwner ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={directOwner} onClick={() => setDirectOwner((v) => !v)}><i /></button>
                  </div>
                ) : null}
                <div className="wizard-toggle">
                  <span>{t("fit.costsConfirm")}</span>
                  <button type="button" className={costsOk ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={costsOk} onClick={() => setCostsOk((v) => !v)}><i /></button>
                </div>
                {category !== "vifaa" && category !== "plots" && periods[category] && !(category === "rooms-houses" && homeDeal === "sale") ? (
                  <div className="wizard-field">
                    <span className="wizard-label">Rent period</span>
                    <div className="wizard-chips">
                      {periods[category].map((item) => chip(item.id, item.label, period === item.id, () => setPeriod(item.id)))}
                    </div>
                  </div>
                ) : category === "vifaa" ? (
                  <>
                    <div className="wizard-field">
                      <span className="wizard-label">Unit</span>
                      <div className="wizard-chips">
                        {units.map((item) => chip(item.id, item.label, unit === item.id, () => setUnit(item.id)))}
                      </div>
                    </div>
                    <label className="wizard-field">
                      <span className="wizard-label">Stock <i>*</i></span>
                      <input className="wizard-input" inputMode="numeric" value={stock} onChange={(e) => setStock(digits(e.target.value))} />
                      {tried && stock === "" ? <span className="wizard-error">Enter the available quantity.</span> : null}
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">Minimum order <span className="wizard-optional">({t("optional")})</span></span>
                      <input className="wizard-input" inputMode="numeric" value={minOrder} onChange={(e) => setMinOrder(digits(e.target.value))} />
                    </label>
                  </>
                ) : null}
                {category === "rooms-houses" && (
                  <>
                    <div className="wizard-field">
                      <span className="wizard-label">Type</span>
                      <div className="wizard-chips">
                        {roomTypes.map((item) => chip(item.id, t(`fit.property.${item.id}`), roomType === item.id, () => setRoomType(item.id)))}
                      </div>
                    </div>
                    <div className="wizard-row">
                      {stepper("Bedrooms", bedrooms, setBedrooms, 0, 20)}
                      {stepper("Bathrooms", bathrooms, setBathrooms, 0, 20)}
                    </div>
                    {homeDeal === "rent" ? (
                      <>
                        <label className="wizard-field">
                          <span className="wizard-label">Deposit <span className="wizard-optional">({t("optional")})</span></span>
                          <input className="wizard-input" inputMode="numeric" value={grouped(deposit)} onChange={(e) => setDeposit(digits(e.target.value))} />
                        </label>
                        <div className="wizard-field">
                          <span className="wizard-label">Available from <span className="wizard-optional">({t("optional")})</span></span>
                          <DateStrip value={available} onChange={setAvailable} count={21} />
                        </div>
                        <label className="wizard-field">
                          <span className="wizard-label">{t("deal.rules")} <span className="wizard-optional">({t("optional")})</span></span>
                          <textarea className="wizard-input" rows={3} maxLength={400} value={houseRules} onChange={(e) => setHouseRules(e.target.value)} />
                        </label>
                      </>
                    ) : (
                      <>
                        <div className="wizard-field">
                          <span className="wizard-label">{t("deal.tenure")}</span>
                          <div className="wizard-chips">
                            {HOME_TENURE.map((id) => chip(id, t(`deal.tenure.${id}`), tenure === id, () => setTenure(id)))}
                          </div>
                        </div>
                        <div className="wizard-field">
                          <span className="wizard-label">{t("plot.documents")}</span>
                          <div className="wizard-chips">
                            {HOME_DOCS.map((id) => chip(id, t(`deal.doc.${id}`), homeDocs.includes(id), () => setHomeDocs((cur) => (cur.includes(id) ? cur.filter((item) => item !== id) : [...cur, id]))))}
                          </div>
                        </div>
                        <div className="wizard-row">
                          <label className="wizard-field">
                            <span className="wizard-label">{t("deal.land")}</span>
                            <input className="wizard-input" inputMode="numeric" value={landM2} onChange={(e) => setLandM2(digits(e.target.value))} />
                          </label>
                          <label className="wizard-field">
                            <span className="wizard-label">{t("deal.built")}</span>
                            <input className="wizard-input" inputMode="numeric" value={builtM2} onChange={(e) => setBuiltM2(digits(e.target.value))} />
                          </label>
                        </div>
                        <div className="wizard-field">
                          <span className="wizard-label">{t("fit.condition")}</span>
                          <div className="wizard-chips">
                            {(["new", "used"] as const).map((kind) => chip(kind, t(`deal.condition.${kind}`), condition === kind, () => setCondition(kind)))}
                          </div>
                        </div>
                        <div className="wizard-field">
                          <span className="wizard-label">{t("deal.pay")}</span>
                          <div className="wizard-chips">
                            {HOME_PAY.map((id) => chip(id, t(`deal.pay.${id}`), homePay === id, () => setHomePay(id)))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
                {category === "apartment_airbnb" && (
                  <div className="wizard-row">
                    {stepper("Guests", guests, setGuests, 1, 30)}
                    {stepper("Bedrooms", bedrooms, setBedrooms, 0, 20)}
                    {stepper("Min nights", minNights, setMinNights, 1, 30)}
                  </div>
                )}
                {category === "store_godown" && (
                  <div className="wizard-row">
                    <label className="wizard-field">
                      <span className="wizard-label">Size m² <span className="wizard-optional">({t("optional")})</span></span>
                      <input className="wizard-input" inputMode="numeric" value={size} onChange={(e) => setSize(digits(e.target.value))} />
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">Road frontage <span className="wizard-optional">({t("optional")})</span></span>
                      <input className="wizard-input" value={frontage} onChange={(e) => setFrontage(e.target.value)} />
                    </label>
                  </div>
                )}
                {category === "frame" && (
                  <div className="wizard-row">
                    <label className="wizard-field">
                      <span className="wizard-label">Size <span className="wizard-optional">({t("optional")})</span></span>
                      <input className="wizard-input" value={frameSize} onChange={(e) => setFrameSize(e.target.value)} />
                    </label>
                    <label className="wizard-field">
                      <span className="wizard-label">Market name <span className="wizard-optional">({t("optional")})</span></span>
                      <input className="wizard-input" value={market} onChange={(e) => setMarket(e.target.value)} />
                    </label>
                  </div>
                )}
                <div className="wizard-field">
                  <span className="wizard-label">Amenities <span className="wizard-optional">({t("optional")})</span></span>
                  <div className="wizard-chips">
                    {(amenitySets[category] || []).map((item) =>
                      chip(item, item, amenities.includes(item), () =>
                        setAmenities((cur) => (cur.includes(item) ? cur.filter((name) => name !== item) : [...cur, item])),
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="wizard-label">{t("wizard.photos", { n: photos.length })}</p>
                {categoryConfig(category) ? (
                  <p className="wizard-tip">
                    {t("fit.photos")}: {categoryConfig(category)?.photos.map((slot) => (lang === "sw" ? slot.sw : slot.en)).join(", ")}. {lang === "sw" ? categoryConfig(category)?.photoTip.sw : categoryConfig(category)?.photoTip.en}
                  </p>
                ) : null}
                {tried && photos.length < photoMinimum(category) ? (
                  <p className="wizard-error">Add at least {photoMinimum(category)} photos.</p>
                ) : null}
                <div className="shot-grid" style={{ marginTop: 10 }}>
                  {photos.map((url, index) => (
                    <div key={url} className="shot" data-shot={index} onPointerDown={hold(index)}>
                      <img src={url} alt="" />
                      {index === 0 ? <span className="shot-cover">{t("wizard.cover")}</span> : null}
                      <button
                        type="button"
                        className="shot-x"
                        aria-label="Remove photo"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setPhotos((cur) => cur.filter((item) => item !== url))}
                      >
                        <span>×</span>
                      </button>
                    </div>
                  ))}
                  {pending.map((item) => (
                    <div key={item.id} className="shot">
                      <img src={item.preview} alt="" />
                      {item.error ? (
                        <button type="button" className="shot-cover" onClick={() => retry(item)}>Retry</button>
                      ) : (
                        <span className="shot-progress">
                          <JengoLoader size={32} progress={item.progress} showValue />
                        </span>
                      )}
                    </div>
                  ))}
                  {photos.length + pending.length < MAX_PHOTOS ? (
                    <>
                      <button type="button" className="shot" onClick={() => cameraRef.current?.click()}>
                        <Camera size={18} />
                        <span className="text-[11px]">Camera</span>
                      </button>
                      <button type="button" className="shot" onClick={() => libraryRef.current?.click()}>
                        <ImagePlus size={18} />
                        <span className="text-[11px]">Gallery</span>
                      </button>
                    </>
                  ) : null}
                </div>
                {tried && photos.length === 0 ? <p className="wizard-error" style={{ marginTop: 8 }}>Add at least one photo.</p> : null}
                {category === "plots" ? <PlotFields part="media" plot={plot} price={price} onChange={setPlot} /> : null}
                <p className="wizard-tip">{t("wizard.health")}</p>
                <p className="wizard-tip">{t("wizard.tip")}</p>
                {photos[0] ? (
                  <div className="wizard-preview-card" style={{ marginTop: 16 }}>
                    <ListingCard item={previewItem} eager />
                  </div>
                ) : null}
                <input ref={cameraRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
                <input ref={libraryRef} className="hidden" type="file" accept="image/*" multiple onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="wizard-field">
                  <span className="wizard-label">Location <i>*</i></span>
                  <PlacePicker pin value={place} onChange={setPlace} />
                  {tried && place.location.trim().length < 2 ? <span className="wizard-error">Add a street or area.</span> : null}
                  {category === "plots" && tried && (place.lat == null || place.lng == null) ? <span className="wizard-error">{t("plot.pinRequired")}</span> : null}
                </div>
                {category === "plots" ? (
                  <PlotFields
                    part="site"
                    plot={plot}
                    price={price}
                    place={place}
                    tried={tried}
                    onChange={setPlot}
                    onPlace={movePlotPin}
                  />
                ) : null}
                <label className="wizard-field">
                  <span className="wizard-label">{t("fit.landmark")} {needsLandmark(place.location) ? <i>*</i> : <span className="wizard-optional">({t("optional")})</span>}</span>
                  <input className="wizard-input" value={landmark} maxLength={160} onChange={(e) => setLandmark(e.target.value)} placeholder={t("geo.landmarkHint")} />
                </label>
                {category === "rooms-houses" || category === "apartment_airbnb" ? (
                  <>
                    <div className="wizard-toggle">
                      <span>{t("geo.exactToggle")}</span>
                      <button type="button" className={showExact ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={showExact} onClick={() => setShowExact((on) => !on)}>
                        <i />
                      </button>
                    </div>
                    {showExact ? null : <p className="wizard-tip">{t("geo.approxNote")}</p>}
                  </>
                ) : null}
                <label className="wizard-field">
                  <span className="wizard-label">{t("fit.directions")} <span className="wizard-optional">({t("optional")})</span></span>
                  <textarea className="wizard-input" rows={3} maxLength={400} value={directions} onChange={(e) => setDirections(e.target.value)} />
                </label>
                <div className="wizard-field">
                  <span className="wizard-label">Phone numbers <span className="wizard-optional">({t("optional")})</span></span>
                  {phones.map((value, index) => (
                    <div key={index} className="wizard-field" style={{ marginTop: index ? 8 : 0 }}>
                      <div className="flex gap-2">
                        <input
                          className="wizard-input"
                          inputMode="tel"
                          value={value}
                          placeholder={index === 0 ? "0712 345 678" : "Another number"}
                          onChange={(e) => setPhones((cur) => cur.map((item, i) => (i === index ? e.target.value : item)))}
                        />
                        {index > 0 ? (
                          <button type="button" className="btn-secondary px-3" onClick={() => setPhones((cur) => cur.filter((_, i) => i !== index))}>
                            Remove
                          </button>
                        ) : (
                          <span className="wizard-optional self-center">{t("wizard.primary")}</span>
                        )}
                      </div>
                      {phoneErrors[index] ? <span className="wizard-error">{phoneErrors[index]}</span> : null}
                    </div>
                  ))}
                  {phones.length < 3 ? (
                    <button type="button" className="wizard-hint" style={{ textAlign: "left" }} onClick={() => setPhones((cur) => [...cur, ""])}>
                      + Add number
                    </button>
                  ) : null}
                </div>
                <label className="wizard-field">
                  <span className="wizard-label">WhatsApp <span className="wizard-optional">({t("optional")})</span></span>
                  <input className="wizard-input" inputMode="tel" value={sameWa ? phones[0] || "" : whatsapp} disabled={sameWa} onChange={(e) => setWhatsapp(e.target.value)} />
                  {waError ? <span className="wizard-error">{waError}</span> : null}
                </label>
                <div className="wizard-toggle">
                  <span>{t("wizard.same")}</span>
                  <button type="button" className={sameWa ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={sameWa} onClick={() => setSameWa((v) => !v)}>
                    <i />
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="wizard-chips" role="tablist">
                  <button type="button" className={preview === "card" ? "filter-chip is-on" : "filter-chip"} onClick={() => setPreview("card")}>{t("wizard.card")}</button>
                  <button type="button" className={preview === "detail" ? "filter-chip is-on" : "filter-chip"} onClick={() => setPreview("detail")}>{t("wizard.detail")}</button>
                </div>
                <div style={{ marginTop: 12 }}>
                  {preview === "card" ? (
                    <div className="wizard-preview-card">
                      <ListingCard item={previewItem} eager />
                    </div>
                  ) : (
                    <article className="wizard-detail-preview">
                      {photos[0] ? <img src={photos[0]} alt="" /> : <div className="market-photo-empty" />}
                      <div className="wizard-detail-copy">
                        <p className="detail-price">TSh {formatPrice(price || 0)}</p>
                        <h2>{title}</h2>
                        <p><em>{lang === "sw" ? CATEGORIES[category].sw : CATEGORIES[category].en}</em></p>
                        <p className="detail-copy">{description || "No extra description."}</p>
                      </div>
                    </article>
                  )}
                </div>
                {[
                  ["Category", lang === "sw" ? CATEGORIES[category].sw : CATEGORIES[category].en, 1],
                  ["Details", title, 2],
                  ["Photos", t("wizard.photos", { n: photos.length }), 3],
                  ["Location", place.location, 4],
                ].map(([label, value, target]) => (
                  <div key={String(label)} className="wizard-summary">
                    <span><strong>{label}.</strong> {value}</span>
                    <button type="button" onClick={() => go(Number(target))}>{t("wizard.edit")}</button>
                  </div>
                ))}
                <p className="wizard-label" style={{ marginTop: 8 }}>{t("wizard.strength", { n: score })}</p>
                <div className="wizard-meter" aria-hidden><span style={{ transform: `scaleX(${score / 100})` }} /></div>
                {failed ? <p className="wizard-error" style={{ marginTop: 10 }}>{t("wizard.retry")}</p> : null}
              </div>
            )}
          </div>
        </div>

        <div className="wizard-actions keyboard-dock" style={{ bottom: "var(--keyboard-inset, 0px)" }}>
          {step > 1 ? (
            <button type="button" className="btn-secondary" onClick={() => go(step - 1)}>{t("wizard.back")}</button>
          ) : null}
          {step < 5 ? (
            <button type="button" className="btn-primary" disabled={!stepValid} onClick={forward}>{t("wizard.next")}</button>
          ) : (
            <button type="button" className="btn-primary inline-flex items-center justify-center gap-2" disabled={loading} onClick={publish}>
              {loading ? <JengoLoader size={18} /> : null}
              {t("wizard.publish")}
            </button>
          )}
        </div>
      </main>
    </AuthGate>
  );
}
