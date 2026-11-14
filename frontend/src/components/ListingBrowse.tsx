"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, House, LayoutGrid, Loader2, LocateFixed, RectangleVertical, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Listing } from "@/lib/api";
import {
  anyFeatured,
  asView,
  hasCoords,
  inRegion,
  isSortKey,
  nearListings,
  readBrowse,
  readView,
  regionsFor,
  sortListings,
  writeBrowse,
  writeView,
  type NearPoint,
  type SortKey,
  type ViewMode,
} from "@/lib/browse";
import { useT } from "@/lib/i18n";
import { disarmReturn, listRoute, peekReturn, pulseReturn, returnFrame } from "@/lib/listSession";
import { usePrefersReducedMotion } from "@/lib/motion";
import ListingCard from "./ListingCard";
import { ListingFeedSkeleton } from "./Skeletons";

const SORT_KEYS: SortKey[] = ["new", "price_asc", "price_desc", "views", "featured"];

export default function ListingBrowse({
  items,
  loading = false,
  error = "",
  scrollTop = true,
  beforeFeed = null,
  pending = 0,
  stale = false,
  onRefresh,
}: {
  items: Listing[];
  loading?: boolean;
  error?: string;
  scrollTop?: boolean;
  beforeFeed?: ReactNode;
  pending?: number;
  stale?: boolean;
  onRefresh?: () => void;
}) {
  const t = useT();
  const path = usePathname() || "/";
  const route = listRoute(path);
  const routeRef = useRef(route || "/home");
  if (route) routeRef.current = route;
  const reduce = usePrefersReducedMotion();
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [view, setView] = useState<ViewMode>("large");
  const [near, setNear] = useState<NearPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState("");
  const [fading, setFading] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [booted, setBooted] = useState(false);
  const ready = useRef(false);
  const fadeTimer = useRef<number | null>(null);
  const seenRoute = useRef("");
  const want = useRef<{ region: string; sort: SortKey; view: ViewMode; y: number; highlight: string } | null>(null);

  const regions = useMemo(() => {
    const list = regionsFor(items);
    if (region !== "all" && region !== "near" && !list.some((name) => name.toLowerCase() === region.toLowerCase())) {
      return [...list, region];
    }
    return list;
  }, [items, region]);

  const featured = useMemo(() => anyFeatured(items), [items]);
  const sorts = featured ? SORT_KEYS : SORT_KEYS.filter((key) => key !== "featured");

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
    const nextSort = saved?.sort && isSortKey(saved.sort) ? saved.sort : "new";
    const hasNear = typeof saved?.nearLat === "number" && typeof saved?.nearLng === "number";
    const nextRegion = saved?.region === "near" && hasNear ? "near" : saved?.region && saved.region !== "near" ? saved.region : "all";
    setView(nextView);
    setSort(nextSort);
    setRegion(nextRegion);
    setNear(hasNear ? { lat: saved!.nearLat as number, lng: saved!.nearLng as number } : null);
    want.current = {
      region: nextRegion,
      sort: nextSort,
      view: nextView,
      y: typeof saved?.y === "number" ? saved.y : 0,
      highlight: peekReturn() || "",
    };
    ready.current = true;
    setBooted(false);
  }, [route, reduce]);

  useLayoutEffect(() => {
    const target = want.current;
    if (!target || loading) return;
    if (region !== target.region || sort !== target.sort || view !== target.view) return;
    window.scrollTo(0, target.y);
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
      });
      if (scrollTop) setShowTop(window.scrollY > window.innerHeight * 2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [booted, route, region, sort, view, near, scrollTop]);

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
    const onStart = (event: TouchEvent) => {
      if (window.scrollY > 2) return;
      startY = event.touches[0]?.clientY || 0;
      tracking = true;
    };
    const onEnd = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const dy = (event.changedTouches[0]?.clientY || 0) - startY;
      if (dy > 72) onRefresh();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [onRefresh]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

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

  const shown = useMemo(() => {
    let next = items;
    if (region === "near" && near) next = nearListings(next, near);
    else if (region !== "all" && region !== "near") next = next.filter((item) => inRegion(item, region));
    if (region === "near" && near && sort === "new") return next;
    return sortListings(next, sort === "featured" && !featured ? "new" : sort);
  }, [items, region, near, sort, featured]);

  const listIds = useMemo(() => shown.map((item) => item.id), [shown]);

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

  const pickRegion = (next: string) => {
    commit(() => {
      setRegion(next);
      if (next !== "near") setNear(null);
    });
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
        commit(() => {
          setNear(point);
          setRegion("near");
        });
        setToast(t("near.ok"));
      },
      (err) => {
        setLocating(false);
        setToast(err.code === err.PERMISSION_DENIED ? t("near.denied") : t("near.failed"));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  };

  const regionLabel = region === "all" || region === "near" ? t("region.all") : region;
  const filtered = region !== "all" || sort !== "new";

  return (
    <section className="browse">
      <div className="loc-rail no-scrollbar" role="tablist" aria-label={t("near")}>
        <button
          type="button"
          className={region === "near" ? "loc-chip is-on" : "loc-chip"}
          aria-pressed={region === "near"}
          aria-busy={locating}
          onClick={locate}
        >
          {locating ? <Loader2 size={14} className="loc-spin" aria-hidden /> : <LocateFixed size={14} aria-hidden />}
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

      {beforeFeed}

      {pending > 0 ? (
        <button type="button" className="new-pill" onClick={() => onRefresh?.()}>
          {t("newListings", { n: pending })}
        </button>
      ) : null}
      {stale ? <p className="stale-banner">{t("staleList")}</p> : null}

      <div className="browse-head">
        <p className="browse-count-line">
          <span className="browse-count">{shown.length}</span>
          <span>{t("listings")}</span>
        </p>
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
        {loading && items.length === 0 && <ListingFeedSkeleton layout={view} />}
        {!loading && !error && shown.length === 0 && (
          <div className="empty-panel browse-empty">
            <span className="browse-empty-mark" aria-hidden>
              <House size={28} strokeWidth={1.6} />
            </span>
            <p className="lead">
              {region === "near" ? t("empty.near") : region !== "all" ? t("empty.region", { region: regionLabel }) : t("empty.all")}
            </p>
            <div className="browse-empty-actions">
              {filtered ? (
                <button type="button" className="btn-secondary browse-empty-btn" onClick={() => commit(() => { setRegion("all"); setNear(null); setSort("new"); })}>
                  {t("clear")}
                </button>
              ) : null}
              <Link href="/weka-tangazo" className="btn-primary browse-empty-btn">
                {t("post")}
              </Link>
            </div>
          </div>
        )}
        {shown.length > 0 && (
          <div className={view === "large" ? "listing-grid is-large" : "listing-grid"}>
            {shown.map((item, i) => (
              <ListingCard
                key={item.id}
                item={item}
                eager={i < 2}
                delay={i < 6 ? i * 60 : -1}
                layout={view}
                listIds={listIds}
              />
            ))}
          </div>
        )}
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
                  commit(() => setSort(key));
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
