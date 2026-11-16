"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FreshRail from "@/components/FreshRail";
import HeroCarousel from "@/components/HeroCarousel";
import PromoBanner from "@/components/PromoBanner";
import {
  Menu, User, Send, Clapperboard, Bookmark, Settings, X,
  LayoutList, Inbox, Download, Receipt, CreditCard, Hammer,
  Home, Warehouse, Building2, Store, Boxes,
} from "lucide-react";
import AdminLink from "@/components/AdminLink";
import Brand from "@/components/Brand";
import { LangCircle, LangDrawer, ThemeCircle } from "@/components/HeaderTools";
import { InstallMenuItem } from "@/components/InstallUI";
import ListingBrowse from "@/components/ListingBrowse";
import ProductSearch from "@/components/ProductSearch";
import ThemeToggle from "@/components/ThemeToggle";
import { InboxLink } from "@/components/MqttInbox";
import { clearAuth, fetchListings, writeHomeListingsCache, type Listing } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useListings } from "@/lib/useListings";
import { usePersistentScroll } from "@/lib/listSession";

const chips = [
  { href: "/nyumba", label: "Rooms & Houses", short: "Rooms", icon: Home },
  { href: "/kazi", label: "Construction Jobs", short: "Jobs", icon: Hammer },
  { href: "/godown", label: "Shops & Godown", short: "Shops", icon: Warehouse },
  { href: "/airbnb", label: "Apartment & Airbnb", short: "Apartments", icon: Building2 },
  { href: "/maduka", label: "Shop Frames", short: "Frames", icon: Store },
  { href: "/vifaa", label: "Materials", short: "Materials", icon: Boxes },
];

const sideLinks = [
  { label: "Receipts", href: "/risiti", icon: Receipt },
  { label: "Requests I received", href: "/maombi-niliyopokea", icon: Inbox },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Messages", href: "/messages", icon: Send },
  { label: "Reels", href: "/reels", icon: Clapperboard },
  { label: "Favorites", href: "/favorites", icon: Bookmark },
  { label: "Saved photos", href: "/picha", icon: Download },
  { label: "Payments", href: "/malipo", icon: CreditCard },
  { label: "My Posts", href: "/mypost", icon: LayoutList },
  { label: "Construction Jobs", href: "/kazi", icon: Hammer },
  { label: "My requests", href: "/maombi-yangu", icon: Inbox },
  { label: "Settings", href: "/settings", icon: Settings },
];

if (typeof window !== "undefined") void fetchListings({ status: "active", limit: 40 });

export default function HomePage() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const pendingQuery = useRef<string | null>(null);
  const [pool, setPool] = useState<Listing[] | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const { items, setItems, loading: waiting, error, pending, stale, refresh, version } = useListings({ status: "active", limit: 40 });
  const [scrolled, setScrolled] = useState(false);

  usePersistentScroll("cats", railRef, true);

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
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
      setQuery(new URLSearchParams(window.location.search).get("q") || "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (query === null) return;
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [query]);

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
    if (document.documentElement.dataset.detailOverlay === "1") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      if (document.documentElement.dataset.detailOverlay === "1") return;
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  return (
    <main className="home-settle min-h-screen overflow-x-clip">
      <header className={scrolled ? "topbar is-scrolled" : "topbar"}>
        <div className="canvas home-top px-4">
          <button type="button" onClick={() => setOpen(true)} className="soft-icon-btn home-icon-btn" aria-label={t("menu")}>
            <Menu size={18} color="currentColor" />
          </button>
          <div className="home-brand">
            <Link href="/home" className="home-brand-link" aria-label="Jengo">
              <Brand variant={scrolled ? "mark" : "wordmark"} size={scrolled ? 28 : 26} />
            </Link>
            <AdminLink />
          </div>
          <div className="home-tools">
            <ThemeCircle />
            <LangCircle />
            <InboxLink className="soft-icon-btn home-icon-btn" />
          </div>
        </div>
      </header>

      <div className="fixed inset-0 z-40 transition-opacity duration-300" style={{ backgroundColor: "rgba(var(--veil-rgb),0.55)", opacity: open ? 1 : 0, visibility: open ? "visible" : "hidden", pointerEvents: open ? "auto" : "none" }} onClick={() => setOpen(false)} />
      <aside
        className="drawer-gold fixed top-0 left-0 z-50 flex flex-col"
        style={{
          height: "100dvh",
          width: "min(300px, 86vw)",
          transform: open ? "translateX(0)" : "translateX(-105%)",
          visibility: open ? "visible" : "hidden",
          boxShadow: "none",
          transition: "transform 0.3s ease",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid var(--gold)" }}>
          <Link href="/home" onClick={() => setOpen(false)} className="home-brand-link" aria-label="Jengo" style={{ color: "var(--gold)" }}>
            <Brand variant="wordmark" size={26} />
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="drawer-close w-9 h-9 flex items-center justify-center" aria-label={t("close")}>
            <X size={16} color="var(--gold)" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {sideLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 mx-3 my-1 px-3 py-3">
                <Icon size={17} color="var(--gold)" />
                <span className="text-sm" style={{ color: "inherit" }}>{item.label}</span>
              </Link>
            );
          })}
          <InstallMenuItem />
          <div className="flex mx-3 mt-2 mb-2 px-3 py-3" style={{ color: "var(--gold)" }}>
            <ThemeToggle dense />
          </div>
          <LangDrawer />
          <Link href="/login" onClick={() => { clearAuth(); setOpen(false); }} className="flex mx-3 mt-4 mb-6 px-3 py-3" style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}>
            <span className="text-sm">Log out</span>
          </Link>
        </nav>
      </aside>

      <div className="canvas home-body">
        <div className="home-pad">
        <div className="home-intro">
          <h2 className="home-headline">
            {(["headline.a", "headline.b", "headline.accent", "headline.c"] as const).map((key, i) => {
              const text = t(key);
              if (!text) return null;
              const accent = key === "headline.accent";
              return (
                <span key={key} className={accent ? "headline-word headline-accent" : "headline-word"} style={{ animationDelay: `${i * 60}ms` }}>
                  {accent ? <em>{text}</em> : text}
                </span>
              );
            })}
          </h2>

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

        <div ref={railRef} className="cat-rail no-scrollbar">
          {chips.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link key={c.href} href={c.href} className="cat-tile cat-pop" style={{ animationDelay: `${i * 40}ms` }} aria-label={c.label}>
                <span className="cat-tile-icon">
                  <Icon size={28} strokeWidth={1.6} />
                </span>
                <span className="cat-tile-label">{c.short}</span>
              </Link>
            );
          })}
        </div>

        <div className="home-pad">
          <ListingBrowse
            items={query ? (pool?.length ? pool : items) : items}
            loading={waiting}
            error={error}
            pending={pending}
            stale={stale}
            query={query || ""}
            onQuery={setQuery}
            onClear={() => setQuery("")}
            onRefresh={() => { void refresh(); }}
            beforeFeed={
              <>
                <HeroCarousel items={items} loading={waiting} version={version} />
                <FreshRail items={items} version={version} />
                <PromoBanner />
              </>
            }
          />
        </div>
      </div>
    </main>
  );
}
