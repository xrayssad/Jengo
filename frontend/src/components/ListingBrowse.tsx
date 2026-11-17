"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, LayoutGrid, LocateFixed, RectangleVertical, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Listing } from "@/lib/api";
import JengoLoader from "@/components/JengoLoader";
import JengoLogo from "@/components/JengoLogo";
import {
  anyFeatured,
  asView,
  hasCoords,
  inRegion,
  isSortKey,
  nearListings,
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
import { CATEGORIES, canonicalCategory, categoryConfig } from "@/lib/categories.config";
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
  onRefresh,
  category = "",
  categoryIsFilter = false,
  query = "",
  scope = "",
  onClear,
  onQuery,
}: {
  items: Listing[];
  loading?: boolean;
  error?: string;
  scrollTop?: boolean;
  beforeFeed?: ReactNode;
  pending?: number;
  stale?: boolean;
  onRefresh?: () => void;
  category?: string;
  categoryIsFilter?: boolean;
  query?: string;
  scope?: string;
  onClear?: () => void;
  onQuery?: (next: string) => void;
}) {
  const { t, lang } = useI18n();
  const path = usePathname() || "/";
  const route = listRoute(path);
  const routeRef = useRef(route || "/home");
  if (route) routeRef.current = route;
  const reduce = usePrefersReducedMotion();
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [view, setView] = useState<ViewMode>("large");
  const [near, setNear] = useState<NearPoint | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [fitFilters, setFitFilters] = useState<string[]>([]);
  const [plotRange, setPlotRange] = useState({ budget: "", sqmMin: "", sqmMax: "", sizeMin: "", sizeMax: "" });
  const fitConfig = categoryConfig(category);
  const plots = canonicalCategory(category) === "plots";
  const seenCategory = useRef(category);
  const [locating, setLocating] = useState(false);
  const [sheet, setSheet] = useState(false);
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
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDone, setPullDone] = useState(false);
  const [mountExtras, setMountExtras] = useState(true);

  const regions = useMemo(() => {
    const list = regionsFor(items);
    if (region !== "all" && region !== "near" && !list.some((name) => name.toLowerCase() === region.toLowerCase())) {
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
    const storedRegion = saved?.region === "near" && hasNear ? "near" : saved?.region && saved.region !== "near" ? saved.region : "all";
    const param = new URLSearchParams(window.location.search).get("region") || "";
    const nextRegion = param ? regionFromParam(param, regionsFor(items)) : storedRegion;
    setView(nextView);
    setSort(nextSort);
    setRegion(nextRegion);
    setNear(hasNear ? { lat: saved!.nearLat as number, lng: saved!.nearLng as number } : null);
    setVerifiedOnly(Boolean(saved?.verifiedOnly));
    const openingFilter = nextRegion !== "all" || nextSort !== "new" || Boolean(saved?.verifiedOnly);
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
    const onScroll = () => {
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
      if (scrollTop) setShowTop(window.scrollY > window.innerHeight * 2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      if (dy > 0 && window.scrollY <= 2) setPull(Math.min(dy, 120));
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      const dy = dragged;
      dragged = 0;
      if (dy > 72) {
        setRefreshing(true);
        setPull(72);
        Promise.resolve(onRefresh()).finally(() => {
          setRefreshing(false);
          setPullDone(true);
          window.setTimeout(() => {
            setPullDone(false);
            setPull(0);
          }, 280);
        });
        return;
      }
      setPull(0);
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
      if (region === "near" && near) next = nearListings(next, near);
      else if (region !== "all" && region !== "near") next = next.filter((item) => inRegion(item, region));
      if (verifiedOnly) next = next.filter((item) => sellerVerified(item));
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
  }, [items, ranked, region, near, sort, featured, verifiedOnly, fitFilters, category, plotRange]);
  const shown = narrowed.shown;
  const relatedShown = narrowed.related;
  const loose = narrowed.loose;

  const listIds = useMemo(() => shown.map((item) => item.id), [shown]);
  const ranged = Object.values(plotRange).some((value) => amountOf(value) > 0);
  const userFiltered = region !== "all" || sort !== "new" || verifiedOnly || fitFilters.length > 0 || Boolean(queryText) || ranged || (categoryIsFilter && Boolean(canonicalCategory(category)));
  const summaryLabel = region === "near"
    ? t("near")
    : region !== "all"
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
                : scope || t("region.all");

  regionsRef.current = regions;

  const scrollToChips = () => {
    const el = chipsRef.current;
    if (!el) return;
    const header = document.querySelector("header.topbar");
    const height = Math.ceil(header?.getBoundingClientRect().height || 0);
    if (height) document.documentElement.style.setProperty("--header-h", `${height}px`);
    el.style.scrollMarginTop = `${height}px`;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    });
  };

  useLayoutEffect(() => {
    const header = document.querySelector("header.topbar");
    const height = Math.ceil(header?.getBoundingClientRect().height || 0);
    if (height) document.documentElement.style.setProperty("--header-h", `${height}px`);
  }, [path, userFiltered]);

  const showExtras = Boolean(beforeFeed);
  useLayoutEffect(() => {
    if (!showExtras) return;
    if (!userFiltered) {
      setMountExtras(true);
      return;
    }
    const id = window.setTimeout(() => setMountExtras(false), reduce ? 0 : 250);
    return () => window.clearTimeout(id);
  }, [userFiltered, showExtras, reduce]);

  useEffect(() => {
    if (!booted) return;
    const signature = [region, sort, verifiedOnly ? "1" : "0", fitFilters.join(","), queryText, category, Object.values(plotRange).join(",")].join("|");
    if (!filterKey.current) {
      filterKey.current = signature;
      if (userFiltered && !peekReturn()) {
        parkedScroll.current = 0;
        scrollToChips();
      }
      return;
    }
    if (filterKey.current === signature) return;
    filterKey.current = signature;
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
  }, [booted, region, sort, verifiedOnly, fitFilters, queryText, userFiltered, reduce, category, plotRange]);

  useEffect(() => {
    if (!booted) return;
    if (fromHistory.current) {
      fromHistory.current = false;
      urlReady.current = true;
      return;
    }
    const param = new URLSearchParams(window.location.search).get("region") || "";
    const wantSlug = region === "all" ? "" : regionSlug(region);
    if (param === wantSlug) {
      urlReady.current = true;
      return;
    }
    const url = new URL(window.location.href);
    if (wantSlug) url.searchParams.set("region", wantSlug);
    else url.searchParams.delete("region");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const state = { ...(window.history.state || {}), jengoRegion: region || "all" };
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
      const next = param ? regionFromParam(param, regionsRef.current) : "all";
      fromHistory.current = true;
      setRegion(next);
      if (next !== "near") setNear(null);
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

  const clearBrowse = () => {
    setRegion("all");
    setNear(null);
    setSort("new");
    setVerifiedOnly(false);
    setFitFilters([]);
    setPlotRange({ budget: "", sqmMin: "", sqmMax: "", sizeMin: "", sizeMax: "" });
  };

  const resetFilters = () => {
    clearBrowse();
    onClear?.();
  };

  const saveNotify = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("jengo_saved_searches") || "[]") as { q?: string }[];
      const row = { path: `${path}${window.location.search}`, q: queryText, notify: true, at: new Date().toISOString() };
      const next = [row, ...saved.filter((item) => item.q !== queryText)].slice(0, 8);
      localStorage.setItem("jengo_saved_searches", JSON.stringify(next));
    } catch {
      /* keep the confirmation even if storage is blocked */
    }
    setToast(t("search.saved"));
  };

  const pickRegion = (next: string) => {
    if (next === "all") {
      clearBrowse();
      return;
    }
    setRegion(next);
    if (next !== "near") setNear(null);
  };

  const locate = () => {
    if (locating) return;
    if (!navigator.geolocation) {
      setToast(t("near.unsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        if (!items.some(hasCoords)) {
          setToast(t("near.nocoords"));
          return;
        }
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setNear(point);
        setRegion("near");
        setToast(t("near.ok"));
      },
      (err) => {
        setLocating(false);
        setToast(err.code === err.PERMISSION_DENIED ? t("near.denied") : t("near.failed"));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  };

  useEffect(() => {
    const onRegion = (event: Event) => {
      const next = String((event as CustomEvent<string>).detail || "");
      if (!next || next === "near") return;
      if (next === "all") {
        setRegion("all");
        setNear(null);
        setSort("new");
        setVerifiedOnly(false);
        setFitFilters([]);
        return;
      }
      setRegion(next);
      setNear(null);
    };
    const onNear = () => locate();
    window.addEventListener("jengo-region", onRegion);
    window.addEventListener("jengo-near", onNear);
    return () => {
      window.removeEventListener("jengo-region", onRegion);
      window.removeEventListener("jengo-near", onNear);
    };
  }, [locate]);

  const regionLabel = region !== "all" && region !== "near" ? region : (queryText || scope || summaryLabel);
  const showSummary = userFiltered || Boolean(scope);

  return (
    <section className="browse">
      {(pull > 6 || refreshing || pullDone) ? (
        <div className="pull-slot" aria-hidden={refreshing ? undefined : true}>
          <JengoLoader variant="pull" size={22} pull={Math.min(pull / 72, 1)} refreshing={refreshing} done={pullDone} />
        </div>
      ) : null}
      <div ref={chipsRef} className={showSummary ? "browse-pin" : "browse-stack"}>
      <div className="loc-rail no-scrollbar" role="tablist" aria-label={t("near")}>
        <button
          type="button"
          className={region === "near" ? "loc-chip is-on" : "loc-chip"}
          aria-pressed={region === "near"}
          aria-busy={locating}
          onClick={locate}
        >
          {locating ? <JengoLoader size={16} /> : <LocateFixed size={14} aria-hidden />}
          {t("near")}
        </button>
        <button
          type="button"
          className={region === "all" ? "loc-chip is-on" : "loc-chip"}
          aria-pressed={region === "all"}
          onClick={() => pickRegion("all")}
        >
          {t("region.all")}
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
      {fitConfig && fitConfig.filters.length ? (
        <div className="loc-rail no-scrollbar" aria-label={t("sort")}>
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
      {plots ? (
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
      {showSummary ? (
        <div className="browse-summary">
          <p>
            {queryText
              ? `${t("search.results", { query: queryText })} - ${shown.length}`
              : `${summaryLabel} - ${shown.length} ${t("listings")}`}
          </p>
          <button type="button" onClick={resetFilters}>{t("filter.clear")}</button>
        </div>
      ) : null}
      </div>

      {fitConfig ? (
        <button
          type="button"
          className="btn-secondary"
          style={{ margin: "8px 0" }}
          onClick={() => {
            const saved = JSON.parse(localStorage.getItem("jengo_saved_searches") || "[]") as { path: string; at: string }[];
            saved.unshift({ path, at: new Date().toISOString() });
            localStorage.setItem("jengo_saved_searches", JSON.stringify(saved.slice(0, 8)));
            setToast(t("fit.savedSearch"));
          }}
        >
          {t("fit.saveSearch")}
        </button>
      ) : null}

      {mountExtras && beforeFeed ? (
        <div className={userFiltered ? "home-extras is-out" : "home-extras"}>
          <div className="home-extras-inner">{beforeFeed}</div>
        </div>
      ) : null}

      {pending > 0 ? (
        <button type="button" className="new-pill" onClick={() => onRefresh?.()}>
          {t("newListings", { n: pending })}
        </button>
      ) : null}
      {stale ? <p className="stale-banner">{t("staleList")}</p> : null}

      <div className="browse-head">
        {showSummary ? <span /> : (
          <p className="browse-count-line">
            <span className="browse-count">{shown.length}</span>
            <span>{t("listings")}</span>
          </p>
        )}
        <div className="browse-tools">
          <button type="button" className="browse-sort" aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)}>
            {t(`sort.${sort === "featured" && !featured ? "new" : sort}`)}
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
      </div>

      {error ? <p className="browse-error">{error}</p> : null}

      <div className={fading ? "listing-stage is-fading" : "listing-stage"}>
        {loading && shown.length === 0 && <ListingFeedSkeleton layout={view} />}
        {!loading && !error && shown.length === 0 && (
          <div className="empty-panel browse-empty">
            <span className="browse-empty-mark" aria-hidden>
              <JengoLogo variant="mark" size={32} title="" />
            </span>
            <p className="lead">
              {queryText
                ? t("search.none", { query: queryText })
                : region === "near"
                  ? t("empty.near")
                  : region !== "all"
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
        {shown.length > 0 && (
          <div className={view === "large" ? "listing-grid is-large" : "listing-grid"}>
            {shown.map((item, i) => (
              <ListingCard
                key={item.id}
                item={item}
                eager={i < 4}
                priority={i === 0}
                delay={i < 6 ? i * 60 : -1}
                layout={view}
                listIds={listIds}
              />
            ))}
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

      {sheet && (
        <div className="sort-sheet" role="presentation" onClick={() => setSheet(false)}>
          <div className="sort-panel" role="dialog" aria-label={t("sort")} onClick={(event) => event.stopPropagation()}>
            <div className="sort-panel-bar">
              <p>{t("sort")}</p>
              <button type="button" className="soft-icon-btn" aria-label={t("close")} onClick={() => setSheet(false)}>
                <X size={16} />
              </button>
            </div>
            {sorts.map((key) => (
              <button
                key={key}
                type="button"
                className={sort === key ? "sort-option is-on" : "sort-option"}
                aria-pressed={sort === key}
                onClick={() => {
                  setSort(key);
                  setSheet(false);
                }}
              >
                {t(`sort.${key}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {toast ? <div className="browse-toast" role="status">{toast}</div> : null}

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
