"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FreshRail from "@/components/FreshRail";
import HeroCarousel from "@/components/HeroCarousel";
import PromoBanner from "@/components/PromoBanner";
import { Bell, ChevronDown, MapPin, X } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import JengoLogo from "@/components/JengoLogo";
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

if (typeof window !== "undefined") void fetchListings({ status: "active", limit: 40 }).catch(() => {});

function HomeBar({ onHome }: { onHome: () => void }) {
  const t = useT();
  const inbox = useInboxLive();
  const [notes, setNotes] = useState(false);

  return (
    <>
      <header className="home-appbar">
        <MenuButton />
        <button type="button" className="home-brand" onClick={onHome} aria-label="Jengo">
          <JengoLogo variant="wordmark" size={24} title="Jengo" />
        </button>
        <div className="home-tools">
          <button type="button" className="soft-icon-btn home-icon-btn" aria-label={t("notes")} onClick={() => setNotes(true)}>
            <Bell size={18} />
            {inbox.unread ? <span className="note-dot" /> : null}
          </button>
          <InboxLink className="soft-icon-btn home-icon-btn" />
        </div>
      </header>
      <BottomSheet open={notes} title={t("notes")} onClose={() => setNotes(false)}>
        {inbox.unread ? (
          <Link href="/messages" className="sheet-option" onClick={() => { inbox.clear(); setNotes(false); }}>
            {t("notes.messages")}
          </Link>
        ) : (
          <p className="sheet-option">{t("notes.empty")}</p>
        )}
      </BottomSheet>
    </>
  );
}

export default function HomePage() {
  const t = useT();
  const { lang } = useI18n();
  const [query, setQuery] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [sheet, setSheet] = useState(false);
  const [place, setPlace] = useState("");
  const [deal, setDeal] = useState<"" | "rent" | "sale">("");
  const [locOpen, setLocOpen] = useState(false);
  const pendingQuery = useRef<string | null>(null);
  const [pool, setPool] = useState<Listing[] | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const { items, setItems, loading: waiting, error, pending, stale, offline, refresh, version } = useListings({ status: "active", limit: 40 });

  usePersistentScroll("cats", railRef, true);

  useEffect(() => {
    const readType = (params: URLSearchParams) => {
      const type = params.get("type");
      return type === "rent" || type === "sale" ? type : "";
    };
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") || "");
    setCategory(canonicalCategory(params.get("category")));
    setDeal(readType(params));
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
      setDeal(readType(nextParams));
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
    if (category === "rooms-houses" && deal) url.searchParams.set("type", deal);
    else url.searchParams.delete("type");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [query, category, deal]);

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
    let down = 0;
    let fade = "";
    let greet = "";
    let stick = "";
    let bar = "";
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      if (y < 8) {
        hidden = false;
        down = 0;
      } else if (delta > 0) {
        down += delta;
        if (down > 64) hidden = true;
      } else if (delta < -24) {
        hidden = false;
        down = 0;
      }
      const nextFade = y >= 40 ? "0" : String(Math.max(0, 1 - y / 40));
      const nextGreet = y > 40 ? "off" : "on";
      const nextStick = y > 8 ? "1" : "0";
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
      down = 0;
      fade = "";
      greet = "";
      stick = "";
      bar = "";
      apply();
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
      const detail = (event as CustomEvent<string | { region?: string }>).detail;
      const region = typeof detail === "string" ? detail : detail?.region;
      if (typeof region === "string") setPlace(!region || region === "all" ? "" : region);
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

  useEffect(() => {
    window.dispatchEvent(new Event("jengo-nav-show"));
  }, [place]);

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
    setDeal("");
    window.dispatchEvent(new Event("jengo-results-clear"));
    window.dispatchEvent(new Event("jengo-nav-show"));
  };

  const LOCATION_EMPTY_LABEL = "";
  const placeLabel = place === "near" ? t("near") : place;
  const placeChoices = regionsFor(pool?.length ? pool : items);
  const clearPlace = () => {
    window.dispatchEvent(new CustomEvent("jengo-region", { detail: "" }));
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
      <HomeBar onHome={() => { restoreHome(); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

      <div className="canvas home-body">
        <div className="home-top">
        <h1 className="home-line">
          {t("home.line.before")}<em>{t("home.line.accent")}</em>{t("home.line.after")}
        </h1>
        </div>
        <div className="home-search-stick">
          <div className="home-loc-pill">
            <button type="button" className="home-loc-open" aria-label={place ? placeLabel : t("loc.aria")} onClick={() => setLocOpen(true)}>
              <MapPin size={16} aria-hidden />
              {place ? <span>{placeLabel}</span> : LOCATION_EMPTY_LABEL ? <span className="is-placeholder">{LOCATION_EMPTY_LABEL}</span> : null}
              <ChevronDown size={16} aria-hidden />
            </button>
            {place ? (
              <button type="button" className="home-loc-x" aria-label={t("loc.clear")} onClick={clearPlace}>
                <X size={14} />
              </button>
            ) : null}
          </div>
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

        <div ref={railRef}>
          <CategoryGrid
            active={category}
            sheet={sheet}
            onSheet={setSheet}
            onFilter={(id) => {
              if (!isFilterTile(id)) return;
              setCategory((cur) => {
                const next = cur === id ? "" : id;
                if (next !== "rooms-houses") setDeal("");
                return next;
              });
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
          {category === "rooms-houses" ? (
            <div className="deal-switch" role="tablist" aria-label={t("deal.rent")}>
              {(["", "rent", "sale"] as const).map((key) => (
                <button
                  key={key || "all"}
                  type="button"
                  role="tab"
                  aria-selected={deal === key}
                  className={deal === key ? "is-on" : ""}
                  onClick={() => setDeal(key)}
                >
                  {t(key === "rent" ? "deal.rent" : key === "sale" ? "deal.sale" : "deal.all")}
                </button>
              ))}
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
            deal={deal}
            onClearCategory={() => {
              setCategory("");
              setDeal("");
            }}
            onRefresh={() => { void refresh(); }}
            beforeFeed={(list, region) => {
              const where = region === "near" ? t("near") : region;
              const scoped = Boolean(region) && region !== "all";
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
          if (!name) window.dispatchEvent(new CustomEvent("jengo-region", { detail: "" }));
          else if (name === "near") window.dispatchEvent(new Event("jengo-near"));
          else window.dispatchEvent(new CustomEvent("jengo-region", { detail: name }));
          setLocOpen(false);
        }}
      />
    </main>
  );
}
