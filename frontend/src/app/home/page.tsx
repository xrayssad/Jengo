"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu, Search, User, Send, Clapperboard, Bookmark, Settings, X,
  LayoutList, Inbox, Download, Receipt, CreditCard, Hammer,
} from "lucide-react";
import AdminLink from "@/components/AdminLink";
import ListingCard from "@/components/ListingCard";
import { HomeFeedSkeleton } from "@/components/Skeletons";
import ThemeToggle from "@/components/ThemeToggle";
import { InboxLink } from "@/components/MqttInbox";
import { clearAuth, fetchListings, suggestPlaces, writeHomeListingsCache, type PlaceHit } from "@/lib/api";
import { useListings } from "@/lib/useListings";

const chips = [
  { href: "/nyumba", label: "Rooms & Houses" },
  { href: "/kazi", label: "Construction Jobs" },
  { href: "/godown", label: "Shops Store & Godown" },
  { href: "/airbnb", label: "Apartment & Airbnb" },
  { href: "/maduka", label: "Shop Frames" },
  { href: "/vifaa", label: "Building Materials" },
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
  const [open, setOpen] = useState(false);
  const [placeQ, setPlaceQ] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [openHits, setOpenHits] = useState(false);
  const searchBox = useRef<HTMLFormElement>(null);
  const { items, setItems, loading: waiting } = useListings({ status: "active", limit: 40 });

  const goSearch = (q: string) => {
    const next = q.split(",")[0].trim() || q.trim();
    if (!next) return;
    setOpenHits(false);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  };

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
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-30 px-5 py-3" style={{ backgroundColor: "rgba(var(--paper-rgb),0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          <button type="button" onClick={() => setOpen(true)} className="soft-icon-btn" aria-label="Menu">
            <Menu size={16} color="var(--ink)" />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--mocha)" }}>Jengo</p>
            <h1 className="text-[22px] font-bold leading-none" style={{ color: "var(--ink)" }}>Home</h1>
            <AdminLink />
          </div>
          <InboxLink className="soft-icon-btn" />
        </div>
      </header>

      <div className="fixed inset-0 z-40 transition-opacity duration-300" style={{ backgroundColor: "rgba(var(--veil-rgb),0.55)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} onClick={() => setOpen(false)} />
      <aside
        className="drawer-gold fixed top-0 left-0 z-50 flex flex-col"
        style={{
          height: "100dvh",
          width: "min(300px, 86vw)",
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.3s ease",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid var(--gold)" }}>
          <p className="font-heading text-[28px] leading-none" style={{ color: "var(--gold)" }}>Jengo</p>
          <button type="button" onClick={() => setOpen(false)} className="drawer-close w-9 h-9 flex items-center justify-center" aria-label="Close">
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
          <Link href="/login" onClick={() => { clearAuth(); setOpen(false); }} className="flex mx-3 mt-4 mb-6 px-3 py-3" style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}>
            <span className="text-sm">Log out</span>
          </Link>
        </nav>
      </aside>

      <div className="max-w-md mx-auto px-5 pt-4 pb-2">
        <p className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>Browse</p>
        <h2 className="text-[34px] font-bold leading-[1.05] mt-0.5 mb-4 tracking-tight" style={{ color: "var(--ink)" }}>
          Near you
        </h2>

        <form
          ref={searchBox}
          action="/search"
          onSubmit={(e) => {
            e.preventDefault();
            goSearch(placeQ);
          }}
          className="relative mb-4"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 sheet rounded-full">
            <Search size={16} color="var(--mocha)" />
            <input
              name="q"
              value={placeQ}
              onChange={(e) => setPlaceQ(e.target.value)}
              onFocus={() => hits.length && setOpenHits(true)}
              placeholder="Search city or street"
              className="flex-1 bg-transparent outline-none text-sm min-w-0"
              style={{ color: "var(--ink)" }}
              autoComplete="off"
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
                  style={{ color: "var(--ink)", borderBottom: "1px solid rgba(var(--mocha-rgb),0.14)" }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          {chips.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              className="px-4 py-2 text-[13px] font-medium shrink-0 rounded-full"
              style={
                i === 0
                  ? { backgroundColor: "var(--ink)", color: "var(--paper)", boxShadow: "var(--shadow-quiet)" }
                  : { color: "var(--ink)", background: "var(--surface)", border: "1px solid rgba(var(--caramel-rgb),0.32)", boxShadow: "var(--shadow-quiet)" }
              }
            >
              {c.label}
            </Link>
          ))}
        </div>

        <Link href="/kazi" className="estate-card relative overflow-hidden mb-4 block" style={{ height: 168 }}>
          <Image src="/real/materials.jpg" alt="" fill className="object-cover" sizes="400px" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(var(--veil-rgb),0.62), rgba(var(--veil-rgb),0.05))" }} />
          <div className="absolute left-4 right-4 bottom-4">
            <h3 className="text-lg font-bold leading-snug" style={{ color: "#FFF6ED" }}>Construction Jobs</h3>
            <p className="text-xs mt-1" style={{ color: "rgba(255,246,237,0.78)" }}>Paint, tiles, ceiling, plumbing, electrical.</p>
          </div>
        </Link>

        <div className="flex items-end justify-between mb-3 mt-2">
          <h3 className="text-[20px] font-bold" style={{ color: "var(--ink)" }}>Listings</h3>
          <Link href="/discover" className="text-sm font-semibold" style={{ color: "var(--mocha)" }}>Discover</Link>
        </div>
        {waiting && items.length === 0 && <HomeFeedSkeleton />}
        {items.length > 0 && (
          <div className="listing-grid">
            {items.map((item, i) => (
              <ListingCard key={item.id} item={item} eager={i < 2} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
