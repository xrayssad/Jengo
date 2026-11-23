"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, ArrowUpDown, LayoutGrid, LocateFixed, RectangleVertical, X } from "lucide-react";
import BottomSheet from "./BottomSheet";
import FeaturedStrip from "./FeaturedStrip";
import { locationPermitSeen, markLocationPermit } from "@/lib/permit";
import type { ReactNode } from "react";
import { reversePlace, type Listing } from "@/lib/api";
import { debugGeoEnabled, getPreciseLocation } from "@/lib/geo";
import GeoDebug from "./GeoDebug";
import { readScoped, writeScoped } from "@/lib/userScope";
import JengoLoader from "@/components/JengoLoader";
import JengoLogo from "@/components/JengoLogo";
import {
  anyFeatured,
  asView,
  blankRegion,
  hasCoords,
  inRegion,
  isSortKey,
  bedCount,
  nearListings,
  pickFeatured,
  pickFresh,
  pushRecentRegion,
  readBrowse,
  readView,
  regionFromParam,
  regionSlug,
  regionsFor,
  sellerVerified,
  sortListings,
  writeBrowse,
  writeView,
  type NearPoint,
  type SortKey,
  type ViewMode,
} from "@/lib/browse";
import { CATEGORIES, canonicalCategory, categoryConfig, dealOf, tileCopy } from "@/lib/categories.config";
import { homeMode } from "@/lib/homeMode";
import { rankListings, stickOrder } from "@/lib/productSearch";
import { readFit } from "@/lib/pricing";
import { pricePerM2Of, sizeM2Of } from "@/lib/plots";
import { VERIFIED_FIRST_SORT } from "@/lib/productFlags";
import { useI18n } from "@/lib/i18n";
import { disarmReturn, listRoute, peekReturn, pulseReturn, returnFrame } from "@/lib/listSession";
import { usePrefersReducedMotion } from "@/lib/motion";
import ListingCard from "./ListingCard";
import { ListingFeedSkeleton } from "./Skeletons";

const SORT_KEYS: SortKey[] = ["new", "price_asc", "price_desc", "views", "featured", ...(VERIFIED_FIRST_SORT ? ["verified" as const] : [])];

function amountOf(value: string) {
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fitOn(item: Listing, key: string) {
  const fit = readFit(item);
  const type = fit.property_type || fit.room_type || "";
  if (key === "direct") return Boolean(fit.direct_owner);
  if (key === "free_viewing") return Boolean(fit.free_viewing);
  if (key === "costs") return Boolean(fit.costs_confirmed);
  if (key === "self") return type === "self";
  if (key === "room") return type === "single" || type === "master" || type === "self";
  if (key === "whole") return type === "house";
  if (key === "power") return Boolean(fit.power_backup);
  if (key === "wifi") return (fit.amenities || []).some((name) => /wi-?fi/i.test(name));
  if (key === "sale") return fit.listing_type === "sale";
  if (key === "lease") return fit.listing_type === "lease";
  if (key === "surveyed") return Boolean(fit.surveyed);
  if (key === "tarmac" || key === "murram" || key === "footpath") return fit.road === key;
  if (key === "electricity") return Boolean(fit.electricity_nearby);
  if (key === "water") return Boolean(fit.water_nearby) && fit.water_nearby !== "none";
  if (key === "owner" || key === "agent" || key === "developer") return fit.poster_role === key;
  if (key.startsWith("use_")) return fit.land_use === key.slice(4);
  const tenure: Record<string, string> = {
    tenure_gro: "gro",
    tenure_ccro: "ccro",
    tenure_licence: "residential_licence",
    tenure_village: "village",
    tenure_other: "other",
  };
  if (key in tenure) return fit.tenure === tenure[key];
  return true;
}

export default function ListingBrowse({
  items,
  loading = false,
  error = "",
  scrollTop = true,
  beforeFeed = null,
  pending = 0,
  stale = false,
  offline = false,
  onRefresh,
  category = "",
  categoryIsFilter = false,
  query = "",
  scope = "",
  onClear,
  onClearCategory,
  onQuery,
  omitIds = [],
  midFeed = null,
  chrome = "page",
  deal = "",
}: {
  items: Listing[];
  loading?: boolean;
  error?: string;
  scrollTop?: boolean;
  beforeFeed?: ReactNode | ((list: Listing[], region: string) => ReactNode);
  pending?: number;
  stale?: boolean;
  offline?: boolean;
  onRefresh?: () => void;
  category?: string;
  categoryIsFilter?: boolean;
  query?: string;
  scope?: string;
  onClear?: () => void;
  onClearCategory?: () => void;
  onQuery?: (next: string) => void;
  omitIds?: string[];
  midFeed?: ReactNode;
  chrome?: "home" | "page";
  deal?: "" | "rent" | "sale";
}) {
  const { t, lang } = useI18n();
  const path = usePathname() || "/";
  const route = listRoute(path);
  const routeRef = useRef(route || "/home");
  if (route) routeRef.current = route;
  const reduce = usePrefersReducedMotion();
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [view, setView] = useState<ViewMode>("large");
  const [near, setNear] = useState<NearPoint | null>(null);
  const [nearNames, setNearNames] = useState<string[]>([]);
  const announceNear = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [fitFilters, setFitFilters] = useState<string[]>([]);
  const [plotRange, setPlotRange] = useState({ budget: "", sqmMin: "", sqmMax: "", sizeMin: "", sizeMax: "" });
  const [bedsMin, setBedsMin] = useState(0);
  const [quick, setQuick] = useState<"" | "near" | "verified" | "free" | "beds">("");
  const fitConfig = categoryConfig(category);
  const plots = canonicalCategory(category) === "plots";
  const seenCategory = useRef(category);
  const [locating, setLocating] = useState(false);
  const [nearAccuracy, setNearAccuracy] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [permit, setPermit] = useState(false);
  const [toast, setToast] = useState("");
  const [fading, setFading] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [booted, setBooted] = useState(false);
  const [regionEpoch, setRegionEpoch] = useState(0);
  const ready = useRef(false);
  const fadeTimer = useRef<number | null>(null);
  const seenRoute = useRef("");
  const want = useRef<{ region: string; sort: SortKey; view: ViewMode; y: number; highlight: string } | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const parkedScroll = useRef<number | null>(null);
  const filterKey = useRef("");
  const urlReady = useRef(false);
  const fromHistory = useRef(false);
  const regionsRef = useRef<string[]>([]);
  const pullRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDone, setPullDone] = useState(false);
  const [freshAt, setFreshAt] = useState(0);

  const regions = useMemo(() => {
    const list = regionsFor(items);
    if (!blankRegion(region) && region !== "near" && !list.some((name) => name.toLowerCase() === region.toLowerCase())) {
      return [...list, region];
    }
    return list;
  }, [items, region]);

  const featured = useMemo(() => anyFeatured(items), [items]);
  const sorts = [
    ...(featured ? SORT_KEYS : SORT_KEYS.filter((key) => key !== "featured")),
    ...(plots ? ["price_sqm" as const] : []),
  ];

  const focusReturn = () => {
    const highlight = peekReturn();
    if (!highlight) return;
    const frame = returnFrame();
    const esc = window.CSS?.escape ? window.CSS.escape(highlight) : highlight.replace(/"/g, "");
    const card = document.querySelector<HTMLElement>(`[data-listing-id="${esc}"][data-frame="${frame}"]`)
      || document.querySelector<HTMLElement>(`[data-listing-id="${esc}"]`);
    if (card) {
      const rect = card.getBoundingClientRect();
      const mid = (rect.top + rect.bottom) / 2;
      const off = mid < 80 || mid > window.innerHeight - 80 || rect.right < 24 || rect.left > window.innerWidth - 24;
      if (off) card.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
    }
    pulseReturn(highlight, frame);
    disarmReturn();
  };

  useLayoutEffect(() => {
    if (!route) return;
    if (seenRoute.current === route) {
      focusReturn();
      return;
    }
    seenRoute.current = route;
    const saved = readBrowse(route);
    const nextView = saved?.view ? asView(saved.view) : readView();
    const savedSort = saved?.sort && isSortKey(saved.sort) ? saved.sort : "new";
    const nextSort = savedSort === "verified" && !VERIFIED_FIRST_SORT ? "new" : savedSort;
    const hasNear = typeof saved?.nearLat === "number" && typeof saved?.nearLng === "number";
    const param = new URLSearchParams(window.location.search).get("region") || "";
    const nextRegion = param ? regionFromParam(param, regionsFor(items)) : "";
    setView(nextView);
    setSort(nextSort);
    setRegion(nextRegion);
    setNear(nextRegion === "near" && hasNear ? { lat: saved!.nearLat as number, lng: saved!.nearLng as number } : null);
    if (nextRegion === "near" && hasNear) setLocating(true);
    setVerifiedOnly(Boolean(saved?.verifiedOnly));
    const openingFilter = (nextSort !== "new" && nextSort !== "featured" && nextSort !== "views") || Boolean(saved?.verifiedOnly);
    want.current = {
      region: nextRegion,
      sort: nextSort,
      view: nextView,
      y: openingFilter ? -1 : (typeof saved?.y === "number" ? saved.y : 0),
      highlight: peekReturn() || "",
    };
    ready.current = true;
    setBooted(false);
  }, [route, reduce]);

  useLayoutEffect(() => {
    const target = want.current;
    if (!target || loading) return;
    if (region !== target.region || sort !== target.sort || view !== target.view) return;
    if (target.y >= 0) window.scrollTo(0, target.y);
    const highlight = target.highlight;
    want.current = null;
    setBooted(true);
    if (!highlight) return;
    const focus = window.requestAnimationFrame(() => focusReturn());
    return () => window.cancelAnimationFrame(focus);
  }, [loading, items, region, sort, view, reduce]);

  useEffect(() => {
    if (!ready.current || want.current || !booted) return;
    const routeName = routeRef.current;
    if (!routeName) return;
    writeView(view);
    let topVisible = scrollTop && window.scrollY > window.innerHeight * 2;
    if (scrollTop) setShowTop(topVisible);
    const snapshot = () => {
      if (document.documentElement.dataset.detailOverlay === "1" && document.body.style.overflow === "hidden") return;
      writeBrowse(routeName, {
        region,
        sort,
        view,
        y: window.scrollY,
        nearLat: near?.lat ?? null,
        nearLng: near?.lng ?? null,
        verifiedOnly,
      });
    };
    const onScroll = () => {
      if (!scrollTop) return;
      const next = window.scrollY > window.innerHeight * 2;
      if (next === topVisible) return;
      topVisible = next;
      setShowTop(next);
    };
    snapshot();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", snapshot);
    window.addEventListener("pagehide", snapshot);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", snapshot);
      window.removeEventListener("pagehide", snapshot);
      snapshot();
    };
  }, [booted, route, region, sort, view, near, scrollTop, verifiedOnly]);

  useEffect(() => {
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  useEffect(() => {
    if (!onRefresh) return;
    let startY = 0;
    let tracking = false;
    let dragged = 0;
    const paintPull = (dy: number) => {
      const slot = pullRef.current;
      if (!slot) return;
      const next = Math.max(0, Math.min(dy, 120));
      if (next > 6) {
        slot.hidden = false;
        slot.style.setProperty("--pull", String(Math.min(next / 72, 1)));
      } else {
        slot.hidden = true;
        slot.style.removeProperty("--pull");
      }
    };
    const onStart = (event: TouchEvent) => {
      if (window.scrollY > 2) return;
      startY = event.touches[0]?.clientY || 0;
      tracking = true;
      dragged = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const dy = (event.touches[0]?.clientY || 0) - startY;
      dragged = dy;
      if (dy > 0 && window.scrollY <= 2) paintPull(dy);
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      const dy = dragged;
      dragged = 0;
      if (dy > 72) {
        paintPull(72);
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          setRefreshing(false);
          setPullDone(true);
          window.setTimeout(() => {
            setPullDone(false);
            paintPull(0);
          }, 280);
        });
        return;
      }
      paintPull(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [onRefresh]);

  useEffect(() => {
    const onRefreshTab = () => onRefresh?.();
    window.addEventListener("jengo-tab-refresh", onRefreshTab);
    return () => window.removeEventListener("jengo-tab-refresh", onRefreshTab);
  }, [onRefresh]);

  useEffect(() => {
    if (!booted) return;
    window.dispatchEvent(new CustomEvent("jengo-browse-state", { detail: { region, sort } }));
  }, [booted, region, sort]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (seenCategory.current === category) return;
    seenCategory.current = category;
    setFitFilters([]);
    setPlotRange({ budget: "", sqmMin: "", sqmMax: "", sizeMin: "", sizeMax: "" });
    setSort((cur) => (cur === "price_sqm" && canonicalCategory(category) !== "plots" ? "new" : cur));
  }, [category]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  useEffect(() => () => {
    if (fadeTimer.current != null) window.clearTimeout(fadeTimer.current);
  }, []);

  const queryText = query.trim();
  const orderRef = useRef<{ q: string; exact: string[]; related: string[] } | null>(null);
  const categoryChoices = useMemo(
    () => Object.values(CATEGORIES).map((item) => ({ id: item.id, label: `${item.en} ${item.sw}` })),
    [],
  );
  const rankedFresh = useMemo(
    () => (queryText ? rankListings(items, queryText, { origin: near, categories: categoryChoices }) : null),
    [items, queryText, near, categoryChoices],
  );
  const ranked = useMemo(() => {
    if (!rankedFresh || !queryText) return null;
    const prev = orderRef.current;
    const same = prev?.q === queryText;
    return {
      exact: stickOrder(same ? prev.exact : null, rankedFresh.exact),
      related: stickOrder(same ? prev.related : null, rankedFresh.related),
      correction: rankedFresh.correction,
    };
  }, [rankedFresh, queryText]);
  useEffect(() => {
    if (!ranked || !queryText) {
      orderRef.current = null;
      return;
    }
    orderRef.current = {
      q: queryText,
      exact: ranked.exact.map((item) => item.id),
      related: ranked.related.map((item) => item.id),
    };
  }, [ranked, queryText]);

  const narrowed = useMemo(() => {
    const want = canonicalCategory(category);
    const budget = amountOf(plotRange.budget);
    const sqmMin = amountOf(plotRange.sqmMin);
    const sqmMax = amountOf(plotRange.sqmMax);
    const sizeMin = amountOf(plotRange.sizeMin);
    const sizeMax = amountOf(plotRange.sizeMax);
    const apply = (list: Listing[]) => {
      let next = want ? list.filter((item) => canonicalCategory(item.category) === want) : list;
      if (want === "rooms-houses" && (deal === "rent" || deal === "sale")) {
        next = next.filter((item) => dealOf(item) === deal);
      }
      if (region === "near" && near) next = nearListings(next, near, nearNames);
      else if (!blankRegion(region) && region !== "near") next = next.filter((item) => inRegion(item, region));
      if (verifiedOnly) next = next.filter((item) => sellerVerified(item));
      if (bedsMin > 0) next = next.filter((item) => (bedCount(item) || 0) >= bedsMin);
      for (const key of fitFilters) next = next.filter((item) => fitOn(item, key));
      if (budget) next = next.filter((item) => Number(item.price) <= budget);
      if (sqmMin || sqmMax || sizeMin || sizeMax) {
        next = next.filter((item) => {
          const rate = pricePerM2Of(item);
          const area = sizeM2Of(item);
          if (sqmMin && rate < sqmMin) return false;
          if (sqmMax && (!rate || rate > sqmMax)) return false;
          if (sizeMin && area < sizeMin) return false;
          if (sizeMax && (!area || area > sizeMax)) return false;
          return true;
        });
      }
      return next;
    };
    if (!ranked) {
      const next = apply(items);
      if (region === "near" && near && sort === "new") return { shown: next, related: [] as Listing[], loose: false };
      return { shown: sortListings(next, sort === "featured" && !featured ? "new" : sort), related: [] as Listing[], loose: false };
    }
    const exact = apply(ranked.exact);
    const related = apply(ranked.related).filter((item) => !exact.some((row) => row.id === item.id));
    const loose = exact.length === 0 && related.length > 0;
    const base = exact.length ? exact : related;
    const shown = sort === "new" ? base : sortListings(base, sort === "featured" && !featured ? "new" : sort);
    return { shown, related: exact.length ? related.slice(0, 6) : [], loose };
  }, [items, ranked, region, near, nearNames, sort, featured, verifiedOnly, fitFilters, category, plotRange, bedsMin, deal]);
  const shown = narrowed.shown;
  const relatedShown = narrowed.related;
  const loose = narrowed.loose;

  const ranged = Object.values(plotRange).some((value) => amountOf(value) > 0);
  const layoutFiltered = sort !== "new" || verifiedOnly || fitFilters.length > 0 || bedsMin > 0 || Boolean(queryText) || ranged || (categoryIsFilter && Boolean(canonicalCategory(category)));
  const resultsMode = chrome === "home" && homeMode({
    query: queryText,
    category: categoryIsFilter ? category : "",
    verified: verifiedOnly,
    fits: fitFilters.length,
    beds: bedsMin,
    ranged,
    sort,
  }) === "results";
  const userFiltered = chrome === "home" ? resultsMode : !blankRegion(region) || layoutFiltered;
  const homeChrome = userFiltered;
  const sectionIds = useMemo(() => {
    if (chrome !== "home") return new Set(omitIds);
    if (resultsMode) return new Set(pickFeatured(shown).slice(0, 6).map((item) => item.id));
    const featuredIds = pickFeatured(shown).map((item) => item.id);
    const fresh = pickFresh(shown, 8, freshAt);
    const freshIds = (!blankRegion(region) ? fresh.length >= 1 : fresh.length >= 2) ? fresh.map((item) => item.id) : [];
    return new Set([...featuredIds, ...freshIds]);
  }, [chrome, omitIds, resultsMode, shown, freshAt, region]);
  const pooled = shown.filter((item) => !sectionIds.has(item.id));
  const feed = pooled;
  const feedIds = useMemo(() => feed.map((item) => item.id), [feed]);
  const summaryLabel = region === "near"
    ? t("near")
    : !blankRegion(region)
      ? region
      : queryText
        ? queryText
        : verifiedOnly
          ? t("filter.verified")
          : fitFilters.length
            ? fitFilters.map((key) => t(`fit.filter.${key}`)).join(", ")
            : sort !== "new"
              ? t(`sort.${sort === "featured" && !featured ? "new" : sort}`)
              : categoryIsFilter && fitConfig
                ? (lang === "sw" ? fitConfig.sw : fitConfig.en)
                : scope;

  regionsRef.current = regions;

  const scrollToChips = () => {
    const el = chipsRef.current;
    if (!el) return;
    const header = document.querySelector("header.home-appbar, header.topbar");
    const height = Math.ceil(header?.getBoundingClientRect().height || 0);
    if (height) document.documentElement.style.setProperty("--header-h", `${height}px`);
    el.style.scrollMarginTop = `${height}px`;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    });
  };

  useLayoutEffect(() => {
    const header = document.querySelector("header.home-appbar, header.topbar");
    const height = Math.ceil(header?.getBoundingClientRect().height || 0);
    if (height) document.documentElement.style.setProperty("--header-h", `${height}px`);
  }, [path, userFiltered]);

  const showExtras = Boolean(beforeFeed) && !resultsMode;
  useEffect(() => {
    setFreshAt(Date.now());
  }, []);
  useEffect(() => {
    if (!booted) return;
    if (!blankRegion(region) && region !== "near") pushRecentRegion(region);
  }, [booted, region]);

  useEffect(() => {
    if (!booted) return;
    const signature = [region, sort, verifiedOnly ? "1" : "0", fitFilters.join(","), queryText, category, Object.values(plotRange).join(",")].join("|");
    const keepHome = chrome === "home" && !resultsMode;
    if (!filterKey.current) {
      filterKey.current = signature;
      if (keepHome) return;
      if (userFiltered && !peekReturn()) {
        parkedScroll.current = 0;
        scrollToChips();
      }
      return;
    }
    if (filterKey.current === signature) return;
    filterKey.current = signature;
    if (keepHome) return;
    if (userFiltered) {
      if (parkedScroll.current == null) parkedScroll.current = window.scrollY;
      scrollToChips();
      return;
    }
    const y = parkedScroll.current ?? 0;
    parkedScroll.current = null;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  }, [booted, chrome, region, sort, verifiedOnly, fitFilters, queryText, userFiltered, resultsMode, reduce, category, plotRange]);

  useEffect(() => {
    if (!booted) return;
    if (fromHistory.current) {
      fromHistory.current = false;
      urlReady.current = true;
      return;
    }
    const param = new URLSearchParams(window.location.search).get("region") || "";
    const wantSlug = blankRegion(region) ? "" : regionSlug(region);
    if (param === wantSlug) {
      urlReady.current = true;
      return;
    }
    const url = new URL(window.location.href);
    if (wantSlug) url.searchParams.set("region", wantSlug);
    else url.searchParams.delete("region");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const state = { ...(window.history.state || {}), jengoRegion: blankRegion(region) ? "" : region };
    if (urlReady.current) window.history.pushState(state, "", nextUrl);
    else window.history.replaceState(state, "", nextUrl);
    urlReady.current = true;
  }, [booted, region, regionEpoch]);

  useEffect(() => {
    const onPop = () => {
      if (document.documentElement.dataset.searchOverlay === "1") {
        setRegionEpoch((n) => n + 1);
        return;
      }
      const param = new URLSearchParams(window.location.search).get("region") || "";
      const next = param ? regionFromParam(param, regionsRef.current) : "";
      fromHistory.current = true;
    setRegion(next);
    if (next !== "near") {
      setNear(null);
      setNearNames([]);
    }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const commit = (fn: () => void) => {
    const y = window.scrollY;
    setFading(true);
    fn();
    if (fadeTimer.current != null) window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, Math.min(y, max));
      setFading(false);
    }, reduce ? 0 : 150);
  };

  const clearRegion = () => {
    setRegion("");
    setNear(null);
    setNearNames([]);
    setNearAccuracy(null);
  };

  const clearBrowse = () => {
    clearRegion();
    setSort("new");
    setVerifiedOnly(false);
    setFitFilters([]);
    setPlotRange({ budget: "", sqmMin: "", sqmMax: "", sizeMin: "", sizeMax: "" });
  };

  const resetFilters = () => {
    if (chrome === "home") {
      setSort("new");
      setVerifiedOnly(false);
      setFitFilters([]);
      setPlotRange({ budget: "", sqmMin: "", sqmMax: "", sizeMin: "", sizeMax: "" });
      setBedsMin(0);
      onClear?.();
      return;
    }
    clearBrowse();
    setBedsMin(0);
    onClear?.();
  };

  const saveNotify = () => {
    try {
      const saved = JSON.parse(readScoped("searches") || "[]") as { q?: string }[];
      const row = { path: `${path}${window.location.search}`, q: queryText, notify: true, at: new Date().toISOString() };
      const next = [row, ...saved.filter((item) => item.q !== queryText)].slice(0, 8);
      writeScoped("searches", JSON.stringify(next));
    } catch {
      /* keep the confirmation even if storage is blocked */
    }
    setToast(t("search.saved"));
  };

  const pickRegion = (next: string) => {
    if (blankRegion(next) || next === region) {
      clearRegion();
      return;
    }
    setRegion(next);
    if (next !== "near") {
      setNear(null);
      setNearNames([]);
    }
  };

  const locate = useCallback(() => {
    if (locating) return;
    if (!locationPermitSeen()) {
      setPermit(true);
      return;
    }
    if (!navigator.geolocation) {
      setToast(t("geo.unavailable"));
      return;
    }
    if (!window.isSecureContext) {
      setToast(t("geo.https"));
      return;
    }
    setLocating(true);
    setNearAccuracy(null);
    getPreciseLocation({ onFix: (fix) => setNearAccuracy(fix.accuracy) })
      .then((fix) => {
        announceNear.current = true;
        setNearNames([]);
        setNearAccuracy(fix.accuracy);
        setNear({ lat: fix.lat, lng: fix.lng });
        setRegion("near");
      })
      .catch((err: { code?: number }) => {
        setLocating(false);
        if (err.code === 1) setToast(t("geo.denied"));
        else if (err.code === 3) setToast(t("geo.timeout"));
        else setToast(t("geo.unavailable"));
      });
  }, [locating, t]);

  useEffect(() => {
    if (region !== "near" || !near) return;
    let stop = false;
    void reversePlace(near.lat, near.lng).then((row) => {
      if (stop) return;
      const names = row.names || [];
      setNearNames(names);
      setLocating(false);
      if (!announceNear.current) return;
      announceNear.current = false;
      const matched = nearListings(itemsRef.current, near, names);
      if (matched.length) setToast(t("near.ok"));
      else setToast(t(names.length ? "near.none" : "near.nocoords"));
    });
    return () => {
      stop = true;
    };
  }, [region, near, t]);

  useEffect(() => {
    const onRegion = (event: Event) => {
      const detail = (event as CustomEvent<string | { region?: string }>).detail;
      const next = typeof detail === "string" ? detail : String(detail?.region || "");
      if (next === "near") return;
      if (blankRegion(next)) {
        clearRegion();
      } else {
        setRegion(next);
        setNear(null);
        setNearNames([]);
      }
      if (chrome !== "home") return;
      const el = chipsRef.current;
      if (el && el.getBoundingClientRect().top < 72) {
        requestAnimationFrame(() => el.scrollIntoView({ block: "start", behavior: "auto" }));
      }
    };
    const onNear = () => locate();
    const onRestore = () => {
      setSort("new");
      setVerifiedOnly(false);
      setFitFilters([]);
      setBedsMin(0);
      setPlotRange({ budget: "", sqmMin: "", sqmMax: "", sizeMin: "", sizeMax: "" });
    };
    const onReset = () => {
      clearRegion();
    };
    window.addEventListener("jengo-region", onRegion);
    window.addEventListener("jengo-user-reset", onReset);
    window.addEventListener("jengo-near", onNear);
    window.addEventListener("jengo-home-restore", onRestore);
    window.addEventListener("jengo-results-clear", onRestore);
    return () => {
      window.removeEventListener("jengo-region", onRegion);
      window.removeEventListener("jengo-user-reset", onReset);
      window.removeEventListener("jengo-near", onNear);
      window.removeEventListener("jengo-home-restore", onRestore);
      window.removeEventListener("jengo-results-clear", onRestore);
    };
  }, [chrome, locate]);

  const regionLabel = !blankRegion(region) && region !== "near" ? region : (queryText || scope || summaryLabel);
  const showSummary = homeChrome || Boolean(scope);
  const placeName = region === "near" ? t("near") : !blankRegion(region) ? region : "";
  const beforeNode = showExtras ? (typeof beforeFeed === "function" ? beforeFeed(shown, region) : beforeFeed) : null;
  const homeTabs = chrome === "home" && !queryText;
  const browseTools = (
    <div className="browse-tools">
      <button type="button" className={chrome === "home" ? "browse-sort is-icon" : "browse-sort"} aria-label={t(`sort.${sort === "featured" && !featured ? "new" : sort}`)} aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)}>
        {chrome === "home" ? <ArrowUpDown size={16} /> : t(`sort.${sort === "featured" && !featured ? "new" : sort}`)}
      </button>
      <div className="view-toggle" role="group" aria-label={t("view.grid")}>
        <button type="button" aria-label={t("view.grid")} aria-pressed={view === "grid"} className={view === "grid" ? "is-on" : ""} onClick={() => commit(() => setView("grid"))}>
          <LayoutGrid size={16} />
        </button>
        <button type="button" aria-label={t("view.large")} aria-pressed={view === "large"} className={view === "large" ? "is-on" : ""} onClick={() => commit(() => setView("large"))}>
          <RectangleVertical size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <section className="browse">
      <div ref={pullRef} className="pull-slot" hidden={!(refreshing || pullDone)} aria-hidden={refreshing ? undefined : true}>
        <JengoLoader variant="pull" size={22} refreshing={refreshing} done={pullDone} />
      </div>
      <div ref={chipsRef} className={chrome === "home" ? "browse-stack" : showSummary ? "browse-pin" : "browse-stack"}>
      {chrome === "home" ? (
        <div className="loc-rail quick-chips no-scrollbar rail-fade" aria-label={t("near")}>
          <button type="button" className={region === "near" ? "loc-chip is-on" : "loc-chip"} aria-pressed={region === "near"} aria-busy={locating} onClick={() => setQuick("near")}>{locating ? `${t("geo.searching")}${nearAccuracy != null ? ` ±${Math.round(nearAccuracy)} m` : ""}` : t("near")}</button>
          <button type="button" className={verifiedOnly ? "loc-chip is-on" : "loc-chip"} aria-pressed={verifiedOnly} onClick={() => setQuick("verified")}>{t("filter.verified")}</button>
          <button type="button" className={fitFilters.includes("free_viewing") ? "loc-chip is-on" : "loc-chip"} aria-pressed={fitFilters.includes("free_viewing")} onClick={() => setQuick("free")}>{t("fit.free")}</button>
          <button type="button" className={sort === "price_asc" || sort === "price_desc" ? "loc-chip is-on" : "loc-chip"} onClick={() => setSheet(true)}>{t("chip.price")}</button>
          <button type="button" className={bedsMin > 0 ? "loc-chip is-on" : "loc-chip"} aria-pressed={bedsMin > 0} onClick={() => setQuick("beds")}>{t("chip.beds")}</button>
        </div>
      ) : (
      <div className="loc-rail no-scrollbar rail-fade" role="tablist" aria-label={t("near")}>
        <button
          type="button"
          className={region === "near" ? "loc-chip is-on" : "loc-chip"}
          aria-pressed={region === "near"}
          aria-busy={locating}
          onClick={() => { if (region === "near") clearRegion(); else locate(); }}
        >
          {locating ? <JengoLoader size={16} /> : <LocateFixed size={14} aria-hidden />}
          {locating ? `${t("geo.searching")}${nearAccuracy != null ? ` ±${Math.round(nearAccuracy)} m` : ""}` : t("near")}
        </button>
        <button
          type="button"
          className={verifiedOnly ? "loc-chip is-on" : "loc-chip"}
          aria-pressed={verifiedOnly}
          onClick={() => setVerifiedOnly((on) => !on)}
        >
          {t("filter.verified")}
        </button>
        {regions.map((name) => (
          <button
            key={name}
            type="button"
            className={region === name ? "loc-chip is-on" : "loc-chip"}
            aria-pressed={region === name}
            onClick={() => pickRegion(name)}
          >
            {name}
          </button>
        ))}
      </div>
      )}
      {region === "near" && nearAccuracy != null && nearAccuracy > 100 ? (
        <p className="near-note">{nearAccuracy > 1000 ? t("geo.coarse") : t("geo.nearPoor", { n: Math.round(nearAccuracy) })}</p>
      ) : null}
      {fitConfig && fitConfig.filters.length ? (
        <div className="loc-rail no-scrollbar rail-fade" aria-label={t("sort")}>
          {fitConfig.filters.map((key) => (
            <button
              key={key}
              type="button"
              className={fitFilters.includes(key) ? "loc-chip is-on" : "loc-chip"}
              aria-pressed={fitFilters.includes(key)}
              onClick={() => setFitFilters((cur) => (cur.includes(key) ? cur.filter((item) => item !== key) : [...cur, key]))}
            >
              {t(`fit.filter.${key}`)}
            </button>
          ))}
        </div>
      ) : null}
      {plots && chrome !== "home" ? (
        <div className="plot-ranges">
          {([
            ["budget", "plot.budget"],
            ["sqmMin", "plot.sqmMin"],
            ["sqmMax", "plot.sqmMax"],
            ["sizeMin", "plot.sizeMin"],
            ["sizeMax", "plot.sizeMax"],
          ] as const).map(([key, label]) => (
            <label key={key}>
              {t(label)}
              <input
                inputMode="numeric"
                value={plotRange[key]}
                onChange={(event) => setPlotRange((cur) => ({ ...cur, [key]: event.target.value.replace(/[^\d]/g, "").slice(0, 12) }))}
              />
            </label>
          ))}
        </div>
      ) : null}
      {chrome === "home" && (resultsMode || !blankRegion(region)) ? (
        <div className="browse-summary">
          <p>{`${shown.length} ${t("listings")}`}</p>
          {placeName ? (
            <button type="button" onClick={() => pickRegion(region)}>{placeName}<X size={12} /></button>
          ) : null}
          {resultsMode ? <button type="button" onClick={resetFilters}>{t("filter.clear")}</button> : null}
        </div>
      ) : showSummary ? (
        <div className="browse-summary">
          <p>
            {queryText
              ? `${t("search.results", { query: queryText })} - ${shown.length}`
              : `${shown.length} ${t("listings")}`}
          </p>
          {placeName ? (
            <button type="button" onClick={() => pickRegion(region)}>{placeName}<X size={12} /></button>
          ) : null}
          <button type="button" onClick={resetFilters}>{t("filter.clear")}</button>
        </div>
      ) : null}
      {resultsMode ? (
        <div className="result-chips no-scrollbar">
          {placeName ? <button type="button" onClick={() => pickRegion(region)}>{placeName}<X size={12} /></button> : null}
          {queryText ? <button type="button" onClick={() => onQuery?.("")}>{queryText}<X size={12} /></button> : null}
          {category ? <button type="button" onClick={() => onClearCategory?.()}>{tileCopy(category, lang).label}<X size={12} /></button> : null}
          {verifiedOnly ? <button type="button" onClick={() => setVerifiedOnly(false)}>{t("filter.verified")}<X size={12} /></button> : null}
          {fitFilters.map((key) => (
            <button key={key} type="button" onClick={() => setFitFilters((cur) => cur.filter((item) => item !== key))}>{t(`fit.filter.${key}`)}<X size={12} /></button>
          ))}
          {bedsMin > 0 ? <button type="button" onClick={() => setBedsMin(0)}>{t("bed", { n: bedsMin })}<X size={12} /></button> : null}
          {sort !== "new" && sort !== "featured" && sort !== "views" ? (
            <button type="button" onClick={() => setSort("new")}>{t(`sort.${sort}`)}<X size={12} /></button>
          ) : null}
          <button type="button" className="is-clear" onClick={resetFilters}>{t("filter.clear")}</button>
        </div>
      ) : null}
      {!queryText ? (
        <div className={homeTabs ? "home-tab-row" : undefined}>
        <div className={chrome === "home" ? "text-tabs home-tabs" : "text-tabs"} role="tablist" aria-label={t("feed.recommended")}>
          <button
            type="button"
            role="tab"
            aria-selected={region !== "near" && (sort === "featured" || sort === "views")}
            className={region !== "near" && (sort === "featured" || sort === "views") ? "is-on" : ""}
            onClick={() => {
              if (region === "near") clearRegion();
              setSort(featured ? "featured" : "views");
            }}
          >
            {t("feed.recommended")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={region !== "near" && sort === "new"}
            className={region !== "near" && sort === "new" ? "is-on" : ""}
            onClick={() => {
              if (region === "near") clearRegion();
              setSort("new");
            }}
          >
            {t("feed.new")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={region === "near"}
            className={region === "near" ? "is-on" : ""}
            onClick={() => {
              setSort("new");
              locate();
            }}
          >
            {locating ? `${t("geo.searching")}${nearAccuracy != null ? ` ±${Math.round(nearAccuracy)} m` : ""}` : t("feed.nearby")}
          </button>
        </div>
        {homeTabs ? browseTools : null}
        </div>
      ) : null}
      </div>

      {fitConfig ? (
        <button
          type="button"
          className="btn-secondary"
          style={{ margin: "8px 0" }}
          onClick={() => {
            const saved = JSON.parse(readScoped("searches") || "[]") as { path: string; at: string }[];
            saved.unshift({ path, at: new Date().toISOString() });
            writeScoped("searches", JSON.stringify(saved.slice(0, 8)));
            setToast(t("fit.savedSearch"));
          }}
        >
          {t("fit.saveSearch")}
        </button>
      ) : null}

      {resultsMode ? <FeaturedStrip items={shown} /> : null}
      {beforeNode ? (
        <div className="home-extras">
          <div className="home-extras-inner">{beforeNode}</div>
        </div>
      ) : null}

      {pending > 0 ? (
        <button type="button" className="new-pill" onClick={() => onRefresh?.()}>
          {t("newListings", { n: pending })}
        </button>
      ) : null}
      {stale ? (
        <p className="stale-banner">
          <span>{offline ? t("staleList") : t("staleServer")}</span>
          <button type="button" onClick={() => onRefresh?.()}>{t("retry")}</button>
        </p>
      ) : null}

      {homeTabs ? null : (
      <div className="browse-head">
        {showSummary ? <span /> : (
          <p className="browse-count-line">
            <span className="browse-count">{shown.length}</span>
            <span>{t("listings")}</span>
          </p>
        )}
        {browseTools}
      </div>
      )}

      {error ? <p className="browse-error">{error}</p> : null}

      <div className={fading ? "listing-stage is-fading" : "listing-stage"}>
        {(loading || locating) && feed.length === 0 && <ListingFeedSkeleton layout={view} />}
        {!loading && !locating && !error && shown.length === 0 && (
          <div className="empty-panel browse-empty">
            <span className="browse-empty-mark" aria-hidden>
              <JengoLogo variant="mark" size={32} title="" />
            </span>
            <p className="lead">
              {queryText
                ? t("search.none", { query: queryText })
                : chrome === "home" && !blankRegion(region)
                  ? t("home.emptyPlace", { place: placeName })
                : region === "near"
                  ? t("empty.near")
                  : !blankRegion(region)
                    ? t("empty.region", { region: regionLabel })
                    : t("empty.all")}
            </p>
            {queryText && ranked?.correction ? (
              <button type="button" className="btn-secondary browse-empty-btn" onClick={() => onQuery?.(ranked.correction || "")}>
                {t("search.didYouMean", { term: ranked.correction })}
              </button>
            ) : null}
            <div className="browse-empty-actions">
              {queryText ? (
                <button type="button" className="btn-secondary browse-empty-btn" onClick={saveNotify}>
                  {t("search.saveNotify")}
                </button>
              ) : null}
              {chrome === "home" && !blankRegion(region) ? (
                <button
                  type="button"
                  className="btn-secondary browse-empty-btn"
                  onClick={clearRegion}
                >
                  {t("loc.clear")}
                </button>
              ) : null}
              {showSummary ? (
                <button type="button" className="btn-secondary browse-empty-btn" onClick={resetFilters}>
                  {t("filter.clear")}
                </button>
              ) : null}
              <Link href="/weka-tangazo" className="btn-primary browse-empty-btn">
                {t("post")}
              </Link>
            </div>
          </div>
        )}
        {loose ? (
          <div className="search-note">
            <p>{t("search.loose", { query: queryText })}</p>
            {ranked?.correction ? (
              <button type="button" onClick={() => onQuery?.(ranked.correction || "")}>
                {t("search.didYouMean", { term: ranked.correction })}
              </button>
            ) : null}
          </div>
        ) : null}
        {feed.length > 0 && (
          <div className={view === "large" ? "listing-grid is-large" : "listing-grid"}>
            {feed.map((item, i) => (
              <div key={item.id} className={i >= 6 ? "card-slot is-cv" : "card-slot"}>
              <ListingCard
                item={item}
                eager={i < 2}
                priority={i === 0}
                delay={i < 6 ? i * 60 : -1}
                layout={view}
                listIds={feedIds}
                defer={i >= 6}
              />
              {midFeed && i === 3 ? midFeed : null}
              </div>
            ))}
            {midFeed && feed.length > 0 && feed.length < 4 ? midFeed : null}
          </div>
        )}
        {relatedShown.length > 0 ? (
          <section className="search-related">
            <h2>{t("search.related")}</h2>
            <div className={view === "large" ? "listing-grid is-large" : "listing-grid"}>
              {relatedShown.map((item) => (
                <ListingCard key={item.id} item={item} layout={view} listIds={relatedShown.map((row) => row.id)} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <BottomSheet
        open={permit}
        title={t("permit.location.title")}
        onClose={() => {
          markLocationPermit();
          setPermit(false);
        }}
      >
        <p className="sheet-copy">{t("permit.location.body")}</p>
        <button
          type="button"
          className="btn-primary sheet-submit"
          onClick={() => {
            markLocationPermit();
            setPermit(false);
            window.setTimeout(() => locate(), 0);
          }}
        >
          {t("permit.allow")}
        </button>
      </BottomSheet>
      <BottomSheet open={quick === "near"} title={t("near")} onClose={() => setQuick("")}>
        <p className="sheet-copy">{t("permit.location.body")}</p>
        <button type="button" className="btn-primary sheet-submit" onClick={() => { setQuick(""); locate(); }}>{t("near")}</button>
      </BottomSheet>
      <BottomSheet open={quick === "verified"} title={t("filter.verified")} onClose={() => setQuick("")}>
        <button type="button" className={verifiedOnly ? "sheet-option is-on" : "sheet-option"} onClick={() => { setVerifiedOnly(true); setQuick(""); }}>{t("filter.verified")}</button>
        <button type="button" className={!verifiedOnly ? "sheet-option is-on" : "sheet-option"} onClick={() => { setVerifiedOnly(false); setQuick(""); }}>{t("filter.any")}</button>
      </BottomSheet>
      <BottomSheet open={quick === "free"} title={t("fit.free")} onClose={() => setQuick("")}>
        <p className="sheet-copy">{t("badge.free")}</p>
        <button type="button" className="btn-primary sheet-submit" onClick={() => { setFitFilters((cur) => cur.includes("free_viewing") ? cur.filter((key) => key !== "free_viewing") : [...cur, "free_viewing"]); setQuick(""); }}>{fitFilters.includes("free_viewing") ? t("filter.clear") : t("fit.free")}</button>
      </BottomSheet>
      <BottomSheet open={quick === "beds"} title={t("chip.beds")} onClose={() => setQuick("")}>
        {[0, 1, 2, 3, 4].map((count) => (
          <button key={count} type="button" className={bedsMin === count ? "sheet-option is-on" : "sheet-option"} onClick={() => { setBedsMin(count); setQuick(""); }}>
            {count === 0 ? t("filter.any") : t("bed", { n: count })}
          </button>
        ))}
      </BottomSheet>
      <BottomSheet open={sheet} title={t("chip.price")} onClose={() => setSheet(false)}>
        {canonicalCategory(category) === "rooms-houses" ? (
          <label>
            {t(deal === "sale" ? "deal.budgetSale" : "deal.budgetRent")}
            <input
              inputMode="numeric"
              value={plotRange.budget}
              onChange={(event) => setPlotRange((cur) => ({ ...cur, budget: event.target.value.replace(/[^\d]/g, "").slice(0, 12) }))}
            />
          </label>
        ) : null}
        {plots && chrome === "home" ? (
          <div className="plot-ranges">
            {([
              ["budget", "plot.budget"],
              ["sqmMin", "plot.sqmMin"],
              ["sqmMax", "plot.sqmMax"],
              ["sizeMin", "plot.sizeMin"],
              ["sizeMax", "plot.sizeMax"],
            ] as const).map(([key, label]) => (
              <label key={key}>
                {t(label)}
                <input
                  inputMode="numeric"
                  value={plotRange[key]}
                  onChange={(event) => setPlotRange((cur) => ({ ...cur, [key]: event.target.value.replace(/[^\d]/g, "").slice(0, 12) }))}
                />
              </label>
            ))}
          </div>
        ) : null}
        {sorts.map((key) => (
          <button
            key={key}
            type="button"
            className={sort === key ? "sheet-option is-on" : "sheet-option"}
            aria-pressed={sort === key}
            onClick={() => {
              setSort(key);
              setSheet(false);
            }}
          >
            {t(`sort.${key}`)}
          </button>
        ))}
      </BottomSheet>

      {toast ? <div className="browse-toast" role="status">{toast}</div> : null}
      {debugGeoEnabled() ? <GeoDebug /> : null}

      {scrollTop && (
        <button
          type="button"
          className={showTop ? "scroll-top is-on" : "scroll-top"}
          aria-label={t("top")}
          tabIndex={showTop ? 0 : -1}
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
        >
          <ArrowUp size={18} />
        </button>
      )}
    </section>
  );
}
