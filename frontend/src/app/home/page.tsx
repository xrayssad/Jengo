"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FeatureHero from "@/components/FeatureHero";
import {
  Menu, Search, User, Send, Clapperboard, Bookmark, Settings, X,
  LayoutList, Inbox, Download, Receipt, CreditCard, Hammer,
  Home, Warehouse, Building2, Store, Boxes, SlidersHorizontal,
} from "lucide-react";
import AdminLink from "@/components/AdminLink";
import { LangCircle, LangDrawer, ThemeCircle } from "@/components/HeaderTools";
import ListingBrowse from "@/components/ListingBrowse";
import ThemeToggle from "@/components/ThemeToggle";
import { InboxLink } from "@/components/MqttInbox";
import { clearAuth, fetchListings, suggestPlaces, writeHomeListingsCache, type PlaceHit } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useListings } from "@/lib/useListings";

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
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [placeQ, setPlaceQ] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [openHits, setOpenHits] = useState(false);
  const searchBox = useRef<HTMLFormElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const { items, setItems, loading: waiting, error } = useListings({ status: "active", limit: 40 });

  const goSearch = (q: string) => {
    const next = q.split(",")[0].trim() || q.trim();
    if (!next) return;
    setOpenHits(false);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  };

  useLayoutEffect(() => {
    if (railRef.current) railRef.current.scrollLeft = 0;
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const q = placeQ.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      suggestPlaces(q)
        .then((res) => {
          setHits(res.items || []);
          setOpenHits(true);
        })
        .catch(() => setHits([]));
    }, 260);
    return () => window.clearTimeout(t);
  }, [placeQ]);

  useEffect(() => {
    const hide = (e: MouseEvent) => {
      if (!searchBox.current?.contains(e.target as Node)) setOpenHits(false);
    };
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
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
    <main className="home-settle min-h-screen overflow-x-hidden">
      <header className="topbar">
        <div className="canvas home-top px-4">
          <button type="button" onClick={() => setOpen(true)} className="soft-icon-btn home-icon-btn" aria-label={t("menu")}>
            <Menu size={18} color="currentColor" />
          </button>
          <div className="home-brand">
            <h1 className="font-heading home-logo">Jengo</h1>
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
          <p className="font-heading text-[28px] leading-none" style={{ color: "var(--gold)" }}>Jengo</p>
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
          <div className="flex mx-3 mt-2 mb-2 px-3 py-3" style={{ color: "var(--gold)" }}>
            <ThemeToggle dense />
          </div>
          <LangDrawer />
          <Link href="/login" onClick={() => { clearAuth(); setOpen(false); }} className="flex mx-3 mt-4 mb-6 px-3 py-3" style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}>
            <span className="text-sm">Log out</span>
          </Link>
        </nav>
      </aside>

      <div className="canvas home-body px-4">
        <div className="home-intro">
          <p className="home-greet">Welcome back</p>

          <div className="home-search-row">
            <form
              ref={searchBox}
              action="/search"
              onSubmit={(e) => {
                e.preventDefault();
                goSearch(placeQ);
              }}
              className="home-search-form"
            >
              <div className="search-field home-search">
                <Search size={18} color="var(--muted)" />
                <input
                  name="q"
                  value={placeQ}
                  onChange={(e) => setPlaceQ(e.target.value)}
                  onFocus={() => hits.length && setOpenHits(true)}
                  placeholder="City or street"
                  className="flex-1 bg-transparent outline-none text-[15px] min-w-0"
                  style={{ color: "var(--text)" }}
                  autoComplete="off"
                  aria-label="Search by city or street"
                />
              </div>
              {openHits && hits.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-2 overflow-hidden sheet" style={{ borderRadius: 22 }}>
                  {hits.map((h) => (
                    <button
                      key={`${h.label}-${h.place_id || h.lat}`}
                      type="button"
                      onClick={() => goSearch(h.label || h.city || "")}
                      className="block w-full text-left px-4 py-2.5 text-sm"
                      style={{ color: "var(--text)", borderBottom: "1px solid rgba(var(--mocha-rgb),0.14)" }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              )}
            </form>
            <Link href="/search" className="home-filter" aria-label="Filters">
              <SlidersHorizontal size={18} color="currentColor" />
            </Link>
          </div>
        </div>

        <FeatureHero
          copy={
            <div className="feature-copy">
              <p className="feature-kicker">Featured</p>
              <h3>Construction Jobs</h3>
              <p className="feature-sub">Paint, tiles, ceiling, plumbing, electrical.</p>
              <span className="feature-cta">Browse jobs</span>
            </div>
          }
          photo={<Image src="/real/materials.jpg" alt="" fill priority className="object-cover" sizes="180px" />}
        />

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

        <ListingBrowse items={items} loading={waiting} error={error} />
      </div>
    </main>
  );
}
