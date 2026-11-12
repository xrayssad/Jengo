"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, House, LayoutGrid, List, Loader2, LocateFixed, X } from "lucide-react";
import type { Listing } from "@/lib/api";
import {
  anyFeatured,
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
import { usePrefersReducedMotion } from "@/lib/motion";
import ListingCard from "./ListingCard";
import { ListingFeedSkeleton } from "./Skeletons";

const SORT_KEYS: SortKey[] = ["new", "price_asc", "price_desc", "views", "featured"];

export default function ListingBrowse({
  items,
  loading = false,
  error = "",
  scrollTop = true,
}: {
  items: Listing[];
  loading?: boolean;
  error?: string;
  scrollTop?: boolean;
}) {
  const t = useT();
  const path = usePathname() || "/";
  const reduce = usePrefersReducedMotion();
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [view, setView] = useState<ViewMode>("grid");
  const [near, setNear] = useState<NearPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState("");
  const [fading, setFading] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [booted, setBooted] = useState(false);
  const ready = useRef(false);
  const fadeTimer = useRef<number | null>(null);
  const want = useRef<{ region: string; sort: SortKey; view: ViewMode; y: number } | null>(null);

  const regions = useMemo(() => {
    const list = regionsFor(items);
    if (region !== "all" && region !== "near" && !list.some((name) => name.toLowerCase() === region.toLowerCase())) {
      return [...list, region];
    }
    return list;
  }, [items, region]);

  const featured = useMemo(() => anyFeatured(items), [items]);
  const sorts = featured ? SORT_KEYS : SORT_KEYS.filter((key) => key !== "featured");

  useLayoutEffect(() => {
    const saved = readBrowse(path);
    const nextView = saved?.view === "list" || saved?.view === "grid" ? saved.view : readView();
    const nextSort = saved?.sort && isSortKey(saved.sort) ? saved.sort : "new";
    const hasNear = typeof saved?.nearLat === "number" && typeof saved?.nearLng === "number";
    const nextRegion = saved?.region === "near" && hasNear ? "near" : saved?.region && saved.region !== "near" ? saved.region : "all";
    setView(nextView);
    setSort(nextSort);
    setRegion(nextRegion);
    setNear(hasNear ? { lat: saved!.nearLat as number, lng: saved!.nearLng as number } : null);
    want.current = { region: nextRegion, sort: nextSort, view: nextView, y: typeof saved?.y === "number" ? saved.y : 0 };
    ready.current = true;
    setBooted(false);
  }, [path]);

  useLayoutEffect(() => {
    const target = want.current;
    if (!target || loading) return;
    if (region !== target.region || sort !== target.sort || view !== target.view) return;
    window.scrollTo(0, target.y);
    want.current = null;
    setBooted(true);
  }, [loading, items, region, sort, view]);

  useEffect(() => {
    if (!ready.current || want.current || !booted) return;
    writeView(view);
    const onScroll = () => {
      writeBrowse(path, {
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
  }, [booted, path, region, sort, view, near, scrollTop]);

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
            <button type="button" aria-label={t("view.list")} aria-pressed={view === "list"} className={view === "list" ? "is-on" : ""} onClick={() => commit(() => setView("list"))}>
              <List size={16} />
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
          <div className={view === "list" ? "listing-grid is-list" : "listing-grid"}>
            {shown.map((item, i) => (
              <ListingCard key={item.id} item={item} eager={i < 4} delay={i < 8 ? i * 40 : -1} layout={view} />
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
