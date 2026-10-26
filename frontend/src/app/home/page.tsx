"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu, Search, User, Send, Compass, Bookmark, Settings, X,
  LayoutList, Inbox, Download, Receipt, CreditCard,
} from "lucide-react";
import AdminLink from "@/components/AdminLink";
import ListingCard from "@/components/ListingCard";
import { clearAuth, fetchListings, type Listing } from "@/lib/api";

const chips = [
  { href: "/nyumba", label: "Nyumba" },
  { href: "/airbnb", label: "Airbnb" },
  { href: "/maduka", label: "Maduka" },
  { href: "/vifaa", label: "Vifaa" },
];

const sideLinks = [
  { label: "Risiti", href: "/risiti", icon: Receipt },
  { label: "Maombi niliyopokea", href: "/maombi-niliyopokea", icon: Inbox },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Ujumbe", href: "/messages", icon: Send },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Vipendwa", href: "/favorites", icon: Bookmark },
  { label: "Picha zilizohifadhiwa", href: "/picha", icon: Download },
  { label: "Malipo", href: "/malipo", icon: CreditCard },
  { label: "Matangazo yangu", href: "/matangazo-yangu", icon: LayoutList },
  { label: "Maombi yangu", href: "/maombi-yangu", icon: Inbox },
  { label: "Mipangilio", href: "/settings", icon: Settings },
];

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    fetchListings({ status: "active" }).then((res) => setItems((res.items || []).slice(0, 8))).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-30 px-5 py-3 glass">
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          <button type="button" onClick={() => setOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <Menu size={16} color="#2E1A0F" />
          </button>
          <div className="text-center">
            <h1 className="font-heading text-2xl leading-none" style={{ color: "#2E1A0F" }}>Jengo</h1>
            <AdminLink />
          </div>
          <Link href="/messages" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass" aria-label="Ujumbe">
            <Send size={16} color="#2E1A0F" />
          </Link>
        </div>
      </header>

      <div className="fixed inset-0 z-40 transition-opacity duration-300" style={{ backgroundColor: "rgba(46,26,15,0.4)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} onClick={() => setOpen(false)} />
      <aside
        className="fixed top-0 left-0 z-50 flex flex-col glass"
        style={{
          height: "100dvh",
          width: "min(300px, 86vw)",
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.3s ease",
          paddingTop: "env(safe-area-inset-top)",
          borderRight: "1px solid rgba(210,166,121,0.35)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <p className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>Jengo</p>
          <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center icon-glass">
            <X size={16} color="#2E1A0F" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {sideLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 mx-3 my-0.5 px-3 py-3 rounded-2xl">
                <Icon size={17} color="#8B5E3C" />
                <span className="text-sm" style={{ color: "#2E1A0F" }}>{item.label}</span>
              </Link>
            );
          })}
          <Link href="/login" onClick={() => { clearAuth(); setOpen(false); }} className="flex mx-3 mt-3 mb-6 px-3 py-3 rounded-2xl" style={{ border: "1px solid rgba(166,69,46,0.35)" }}>
            <span className="text-sm" style={{ color: "#A6452E" }}>Tokaa</span>
          </Link>
        </nav>
      </aside>

      <div className="max-w-md mx-auto px-5 pt-5">
        <p className="text-sm" style={{ color: "#8B5E3C" }}>Karibu</p>
        <h2 className="font-heading text-[32px] leading-[1.08] mt-1 mb-5" style={{ color: "#2E1A0F" }}>
          Tafuta makazi yenye utulivu
        </h2>

        <Link href="/search" className="flex items-center gap-3 px-4 py-3 mb-4 sheet rounded-full">
          <Search size={16} color="#8B5E3C" />
          <span className="text-sm" style={{ color: "#8B5E3C" }}>Tafuta chumba, apartment, store...</span>
        </Link>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
          {chips.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              className={`px-4 py-1.5 text-sm shrink-0 ${i === 0 ? "rounded-full" : "chip"}`}
              style={i === 0 ? { backgroundColor: "#2E1A0F", color: "#FFF6ED" } : { color: "#2E1A0F" }}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="relative overflow-hidden mb-6" style={{ borderRadius: 28, height: 196 }}>
          <Image src="/real/apartment.jpg" alt="" fill className="object-cover" sizes="400px" priority />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(46,26,15,0.55), rgba(46,26,15,0.05))" }} />
          <div className="photo-dock">
            <h3 className="font-heading text-xl leading-snug" style={{ color: "#2E1A0F" }}>Nafasi za kuishi na kufanya kazi</h3>
            <p className="text-xs mt-1" style={{ color: "#5C4033" }}>Picha halisi, bei wazi.</p>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <h3 className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>Karibu nawe</h3>
          <Link href="/discover" className="text-sm" style={{ color: "#8B5E3C" }}>Discover</Link>
        </div>
        <div className="space-y-5">
          {items.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
