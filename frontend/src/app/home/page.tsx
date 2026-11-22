"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FreshRail from "@/components/FreshRail";
import HeroCarousel from "@/components/HeroCarousel";
import PromoBanner from "@/components/PromoBanner";
import { Bell, ChevronDown, MapPin, X } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import LocationSheet from "@/components/LocationSheet";
import MenuButton from "@/components/MenuButton";
import ListingBrowse from "@/components/ListingBrowse";
import CategoryGrid from "@/components/CategoryGrid";
import ProductSearch from "@/components/ProductSearch";
import { InboxLink, useInboxLive } from "@/components/MqttInbox";
import { fetchListings, writeHomeListingsCache, type Listing } from "@/lib/api";
import { pickFeatured, pickFresh } from "@/lib/browse";
import { canonicalCategory, isFilterTile, tileCopy } from "@/lib/categories.config";
import { regionsFor } from "@/lib/browse";
import { useI18n, useT } from "@/lib/i18n";
import { useListings } from "@/lib/useListings";
import { usePersistentScroll } from "@/lib/listSession";

if (typeof window !== "undefined") void fetchListings({ status: "active", limit: 40 });

function HomeBar({ placeLabel, scoped, onLocate, onClear }: { placeLabel: string; scoped: boolean; onLocate: () => void; onClear: () => void }) {
  const t = useT();
  const inbox = useInboxLive();
  const [notes, setNotes] = useState(false);

  return (
    <header className="home-appbar">
      <MenuButton />
      <button type="button" className="home-loc" onClick={onLocate}>
        <MapPin size={18} aria-hidden />
        <span>{placeLabel}</span>
        {scoped ? (
          <span
            role="button"
            tabIndex={0}
            className="home-loc-x"
            aria-label={t("loc.clear")}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              onClear();
            }}
          >
            <X size={14} />
          </span>
        ) : (
          <ChevronDown size={16} aria-hidden />
        )}
      </button>
      <div className="home-tools">
        <button type="button" className="soft-icon-btn home-icon-btn" aria-label={t("notes")} onClick={() => setNotes(true)}>
          <Bell size={18} />
          {inbox.unread ? <span className="note-dot" /> : null}
        </button>
        <InboxLink className="soft-icon-btn home-icon-btn" />
      </div>
      <BottomSheet open={notes} title={t("notes")} onClose={() => setNotes(false)}>
        {inbox.unread ? (
          <Link href="/messages" className="sheet-option" onClick={() => { inbox.clear(); setNotes(false); }}>
            {t("notes.messages")}
          </Link>
        ) : (
          <p className="sheet-option">{t("notes.empty")}</p>
        )}
      </BottomSheet>
    </header>
  );
}

export default function HomePage() {
  const t = useT();
  const { lang } = useI18n();
  const [query, setQuery] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [sheet, setSheet] = useState(false);
  const [place, setPlace] = useState("all");
  const [locOpen, setLocOpen] = useState(false);
  const pendingQuery = useRef<string | null>(null);
  const [pool, setPool] = useState<Listing[] | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const { items, setItems, loading: waiting, error, pending, stale, offline, refresh, version } = useListings({ status: "active", limit: 40 });

  usePersistentScroll("cats", railRef, true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") || "");
    setCategory(canonicalCategory(params.get("category")));
    const onPop = () => {
      if (pendingQuery.current !== null) {
        const next = pendingQuery.current;
        pendingQuery.current = null;
        const url = new URL(window.location.href);
        if (next) url.searchParams.set("q", next);
        else url.searchParams.delete("q");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
        setQuery(next);
        return;
      }
      const nextParams = new URLSearchParams(window.location.search);
      setQuery(nextParams.get("q") || "");
      setCategory(canonicalCategory(nextParams.get("category")));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (query === null) return;
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [query, category]);

  useEffect(() => {
    let gone = false;
    fetchListings({ status: "active", limit: 100 })
      .then((res) => {
        if (!gone) setPool(res.items || []);
      })
      .catch(() => {
        if (!gone) setPool([]);
      });
    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let last = window.scrollY;
    let hidden = false;
    let fade = "";
    let greet = "";
    let stick = "";
    let bar = "";
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      last = y;
      const nextFade = y >= 40 ? "0" : String(Math.max(0, 1 - y / 40));
      const nextGreet = y > 40 ? "off" : "on";
      const nextStick = y > 8 ? "1" : "0";
      hidden = false;
      const nextBar = hidden ? "hide" : "show";
      if (nextFade !== fade) {
        fade = nextFade;
        root.style.setProperty("--home-fade", nextFade);
      }
      if (nextGreet !== greet) {
        greet = nextGreet;
        root.dataset.homeGreet = nextGreet;
      }
      if (nextStick !== stick) {
        stick = nextStick;
        root.dataset.homeStick = nextStick;
      }
      if (nextBar !== bar) {
        bar = nextBar;
        root.dataset.homeBar = nextBar;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const reveal = () => {
      last = window.scrollY;
      hidden = false;
      fade = "1";
      greet = "on";
      stick = window.scrollY > 8 ? "1" : "0";
      bar = "show";
      root.style.setProperty("--home-fade", fade);
      root.dataset.homeGreet = greet;
      root.dataset.homeStick = stick;
      root.dataset.homeBar = bar;
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("jengo-nav-show", reveal);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("jengo-nav-show", reveal);
      cancelAnimationFrame(raf);
      delete root.dataset.homeBar;
      delete root.dataset.homeGreet;
      delete root.dataset.homeStick;
      root.style.removeProperty("--home-fade");
    };
  }, []);

  useEffect(() => {
    const onLike = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as { listing_id?: string; likes_count?: number };
      if (!d.listing_id || typeof d.likes_count !== "number") return;
      setItems((cur) => {
        const next = cur.map((item) => (item.id === d.listing_id ? { ...item, likes_count: d.likes_count } : item));
        writeHomeListingsCache(next);
        return next;
      });
    };
    window.addEventListener("jengo-like", onLike);
    return () => window.removeEventListener("jengo-like", onLike);
  }, []);

  useEffect(() => {
    const onPlace = (event: Event) => {
      const region = ((event as CustomEvent).detail || {}).region;
      if (typeof region === "string") setPlace(region);
    };
    window.addEventListener("jengo-browse-state", onPlace);
    return () => window.removeEventListener("jengo-browse-state", onPlace);
  }, []);

  const locWasOpen = useRef(false);
  useEffect(() => {
    if (locOpen) {
      locWasOpen.current = true;
      return;
    }
    if (!locWasOpen.current) return;
    locWasOpen.current = false;
    if (window.scrollY < 24) window.dispatchEvent(new Event("jengo-nav-show"));
  }, [locOpen]);

  const hadCategory = useRef(false);
  useEffect(() => {
    if (category) {
      hadCategory.current = true;
      return;
    }
    if (!hadCategory.current) return;
    hadCategory.current = false;
    if (window.scrollY < 24) window.dispatchEvent(new Event("jengo-nav-show"));
  }, [category]);

  const restoreHome = () => {
    setQuery("");
    setCategory("");
    window.dispatchEvent(new Event("jengo-results-clear"));
  };

  const placeLabel = place === "near" ? t("near") : place !== "all" ? place : t("region.all");
  const placeChoices = regionsFor(pool?.length ? pool : items);
  const clearPlace = () => {
    window.dispatchEvent(new CustomEvent("jengo-region", { detail: "all" }));
  };
  const started = useRef(Date.now());
  const source = query ? (pool?.length ? pool : items) : items;
  const omitIds = useMemo(() => {
    const featured = pickFeatured(source).map((item) => item.id);
    const fresh = pickFresh(source, 8, started.current);
    const freshIds = fresh.length >= 2 ? fresh.map((item) => item.id) : [];
    return [...new Set([...featured, ...freshIds])];
  }, [source]);

  return (
    <main className="home-settle min-h-screen">
      <HomeBar placeLabel={placeLabel} scoped={place !== "all"} onLocate={() => setLocOpen(true)} onClear={clearPlace} />

      <div className="canvas home-body">
        <div className="home-top">
        <h1 className="home-line">
          {t("home.line.before")}<em>{t("home.line.accent")}</em>{t("home.line.after")}
        </h1>
        <div className="home-search-stick">
          <ProductSearch
            query={query || ""}
            listings={pool?.length ? pool : items}
            loading={waiting && items.length === 0 && !pool}
            onSearch={(next) => {
              if (document.documentElement.dataset.searchOverlay === "1") pendingQuery.current = next;
              setQuery(next);
            }}
            onRegion={(name) => {
              pendingQuery.current = "";
              setQuery("");
              if (name === "near") window.dispatchEvent(new Event("jengo-near"));
              else window.dispatchEvent(new CustomEvent("jengo-region", { detail: name }));
            }}
          />
        </div>
        </div>

        <div ref={railRef}>
          <CategoryGrid
            active={category}
            sheet={sheet}
            onSheet={setSheet}
            onFilter={(id) => {
              if (!isFilterTile(id)) return;
              setCategory((cur) => (cur === id ? "" : id));
            }}
          />
          {category ? (
            <div className="home-cat-clear">
              <span>{tileCopy(category, lang).label}</span>
              <button type="button" onClick={restoreHome}>
                <X size={14} aria-hidden />
                {t("clear")}
              </button>
            </div>
          ) : null}
        </div>

        <div className="home-pad">
          <ListingBrowse
            chrome="home"
            items={source}
            omitIds={omitIds}
            loading={waiting}
            error={error}
            pending={pending}
            stale={stale}
            offline={offline}
            query={query || ""}
            category={category}
            categoryIsFilter
            onQuery={setQuery}
            onClear={() => {
              setQuery("");
              setCategory("");
            }}
            onClearCategory={() => setCategory("")}
            onRefresh={() => { void refresh(); }}
            beforeFeed={(list, region) => {
              const where = region === "near" ? t("near") : region;
              const scoped = region !== "all";
              return (
                <>
                  <HeroCarousel
                    items={list}
                    loading={waiting && list.length === 0}
                    version={version}
                    compact={scoped}
                    title={scoped ? t("home.featuredIn", { place: where }) : undefined}
                  />
                  <FreshRail
                    items={list}
                    version={version}
                    allowSingle={scoped}
                    title={scoped ? t("home.freshIn", { place: where }) : undefined}
                  />
                  <PromoBanner />
                </>
              );
            }}
          />
        </div>
      </div>
      <LocationSheet
        open={locOpen}
        value={place}
        places={placeChoices}
        onClose={() => setLocOpen(false)}
        onSelect={(name) => {
          if (name === "near") window.dispatchEvent(new Event("jengo-near"));
          else window.dispatchEvent(new CustomEvent("jengo-region", { detail: name }));
          setLocOpen(false);
        }}
      />
    </main>
  );
}
