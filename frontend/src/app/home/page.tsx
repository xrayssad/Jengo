"use client";

import {
  Home, Store, Building2, Plus, Search, Menu, User,
  MessageCircle, LayoutGrid, Compass, Heart, CreditCard, Bookmark,
  Settings, X, Sparkles, ChevronRight, MapPin, LayoutList, Inbox
} from "lucide-react";
import Link from "next/link";
import { clearAuth } from "@/lib/api";
import Image from "next/image";
import { useState, useEffect } from "react";

const categories = [
  {
    title: "Chumba & Nyumba",
    description: "Mwezi · miezi 3 · 6 · mwaka",
    badge: "Maarufu",
    icon: Home,
    href: "/nyumba",
    images: ["/real/room.jpg", "/real/apartment.jpg"],
  },
  {
    title: "Apartment & Airbnb",
    description: "Usiku · siku · wiki · mwezi",
    badge: "Zinazovuma",
    icon: Building2,
    href: "/airbnb",
    images: ["/real/apartment.jpg", "/real/room.jpg"],
  },
  {
    title: "Store & Godown",
    description: "Mwezi · miezi 3 · 6 · mwaka",
    badge: "Biashara",
    icon: Store,
    href: "/maduka?aina=store",
    images: ["/real/warehouse.jpg", "/real/shop.jpg"],
  },
  {
    title: "Frame za Maduka",
    description: "Frame / stall za biashara",
    badge: "Soko",
    icon: LayoutGrid,
    href: "/maduka?aina=frame",
    images: ["/real/shop.jpg", "/real/warehouse.jpg"],
  },
];

const sideLinks = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Vipendwa", href: "/favorites", icon: Heart },
  { label: "Picha zilizohifadhiwa", href: "/saved", icon: Bookmark },
  { label: "Malipo", href: "/payments", icon: CreditCard },
  { label: "Matangazo yangu", href: "/matangazo-yangu", icon: LayoutList },
  { label: "Maombi yangu", href: "/maombi-yangu", icon: Inbox },
  { label: "Mipangilio", href: "/settings", icon: Settings },
];

const quickChips = ["Dar es Salaam", "Kinondoni", "Masaki", "Mikocheni", "Kariakoo"];

function CategoryCard({
  title, description, badge, icon: Icon, href, images, large,
}: {
  title: string; description: string; badge: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  href: string; images: string[]; large?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 7000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden"
      style={{
        height: large ? 220 : 200,
        borderRadius: large ? 28 : 24,
        boxShadow: "0 12px 40px rgba(46,26,15,0.18), 0 0 0 1px rgba(210,166,121,0.2)",
      }}
    >
      {images.map((src, i) => (
        <div
          key={src + i}
          className="absolute inset-0"
          style={{
            opacity: idx === i ? 1 : 0,
            transition: "opacity 1.2s ease",
            zIndex: idx === i ? 1 : 0,
          }}
        >
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover"
            style={{
              transform: idx === i ? "scale(1.12)" : "scale(1)",
              transition: idx === i ? "transform 7.5s ease-out" : "none",
            }}
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
      ))}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(160deg, rgba(26,15,8,0.15) 0%, rgba(26,15,8,0.25) 40%, rgba(26,15,8,0.92) 100%)",
        }}
      />
      {/* top badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(210,166,121,0.95)",
            color: "#2E1A0F",
            backdropFilter: "blur(8px)",
          }}
        >
          {badge}
        </span>
      </div>
      <div
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{ background: "rgba(255,246,237,0.2)", backdropFilter: "blur(10px)" }}
      >
        <Icon size={16} color="#FFF6ED" strokeWidth={2} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="font-bold text-[16px] leading-tight" style={{ color: "#FFF6ED" }}>
          {title}
        </h3>
        <p className="text-[11px] mt-1" style={{ color: "#D2A679" }}>{description}</p>
        <div className="flex items-center gap-1 mt-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="text-[11px] font-semibold" style={{ color: "#F5E6D3" }}>Angalia</span>
          <ChevronRight size={14} color="#F5E6D3" />
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3"
        style={{
          backgroundColor: "rgba(255,246,237,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(210,166,121,0.25)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #3D2415, #2E1A0F)",
              boxShadow: "0 4px 14px rgba(46,26,15,0.25)",
            }}
          >
            <Menu size={18} color="#F5E6D3" strokeWidth={2.2} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight" style={{ color: "#2E1A0F" }}>Jengo</h1>
            <p className="text-[9px] tracking-[0.2em] uppercase font-semibold" style={{ color: "#8B5E3C" }}>
              Marketplace
            </p>
          </div>
          <Link
            href="/messages"
            className="w-11 h-11 rounded-2xl flex items-center justify-center relative"
            style={{
              background: "linear-gradient(145deg, #D2A679, #B8956A)",
              boxShadow: "0 4px 14px rgba(210,166,121,0.35)",
            }}
          >
            <MessageCircle size={18} color="#2E1A0F" strokeWidth={2.2} />
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ backgroundColor: "rgba(26,15,8,0.5)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={() => setOpen(false)}
      />
      <aside
        className="fixed top-0 left-0 z-50 flex flex-col"
        style={{
          height: "100dvh",
          width: "min(300px, 86vw)",
          backgroundColor: "#FFF6ED",
          borderRight: "1.5px solid #3D2415",
          boxShadow: "8px 0 40px rgba(46,26,15,0.25)",
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-between px-4 shrink-0" style={{ minHeight: 68, background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold" style={{ background: "rgba(210,166,121,0.35)", color: "#FFF6ED" }}>J</div>
            <div>
              <p className="font-bold text-base" style={{ color: "#FFF6ED" }}>Jengo App</p>
              <p className="text-[10px]" style={{ color: "#D2A679" }}>Menu</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(210,166,121,0.2)" }}>
            <X size={20} color="#F5E6D3" strokeWidth={2.2} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2" style={{ WebkitOverflowScrolling: "touch", minHeight: 0 }}>
          {sideLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 mx-3 my-1 px-3 py-3.5 rounded-[16px]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.1)" }}>
                  <Icon size={18} color="#8B5E3C" strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#2E1A0F" }}>{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/login"
            onClick={() => {
              clearAuth();
              setOpen(false);
            }}
            className="flex mx-3 mt-4 mb-6 px-3 py-3.5 rounded-[16px]"
            style={{ border: "1px solid rgba(166,69,46,0.35)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#A6452E" }}>Tokaa</span>
          </Link>
        </nav>
      </aside>

      <div className="max-w-md mx-auto px-4 pt-5">
        {/* Hero promo card */}
        <div
          className="relative overflow-hidden mb-5"
          style={{
            borderRadius: 28,
            minHeight: 160,
            boxShadow: "0 16px 48px rgba(46,26,15,0.22)",
          }}
        >
          <Image src="/real/apartment.jpg" alt="Jengo" fill className="object-cover" sizes="400px" priority />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(125deg, rgba(26,15,8,0.88) 0%, rgba(46,26,15,0.55) 50%, rgba(26,15,8,0.35) 100%)",
            }}
          />
          <div className="relative z-10 p-5 flex flex-col justify-end min-h-[160px]">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={14} color="#D2A679" />
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "#D2A679" }}>
                Karibu Jengo
              </span>
            </div>
            <h2 className="text-xl font-bold leading-snug mb-1" style={{ color: "#FFF6ED" }}>
              Pata makazi na nafasi za biashara
            </h2>
            <p className="text-xs leading-relaxed max-w-[90%]" style={{ color: "rgba(255,246,237,0.75)" }}>
              Chumba, nyumba, apartment, store na frame — bei wazi, wamiliki waliothibitishwa.
            </p>
          </div>
        </div>

        {/* Search */}
        <Link
          href="/search"
          className="flex items-center gap-3 px-4 py-4 mb-4"
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            border: "1.5px solid rgba(210,166,121,0.55)",
            boxShadow: "0 4px 20px rgba(46,26,15,0.06)",
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF6ED" }}>
            <Search size={18} color="#8B5E3C" />
          </div>
          <span className="text-sm flex-1" style={{ color: "#8B5E3C" }}>Tafuta chumba, apartment, store...</span>
        </Link>

        {/* Location chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {quickChips.map((chip, i) => (
            <Link
              key={chip}
              href={`/search?q=${encodeURIComponent(chip)}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
              style={{
                backgroundColor: i === 0 ? "#2E1A0F" : "white",
                color: i === 0 ? "#FFF6ED" : "#2E1A0F",
                border: i === 0 ? "none" : "1.5px solid rgba(61,36,21,0.2)",
              }}
            >
              {i === 0 && <MapPin size={12} color="#D2A679" />}
              {chip}
            </Link>
          ))}
        </div>

        {/* Section title */}
        <div className="flex items-end justify-between mb-3 mt-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Kategoria</h2>
            <p className="text-xs" style={{ color: "#5C4033" }}>Chagua unachotafuta</p>
          </div>
          <Link href="/discover" className="text-xs font-bold flex items-center gap-0.5" style={{ color: "#8B5E3C" }}>
            Discover <ChevronRight size={14} />
          </Link>
        </div>

        {/* Categories – first full width, rest 2-col */}
        <div className="space-y-3.5">
          <CategoryCard {...categories[0]} large />
          <div className="grid grid-cols-2 gap-3.5">
            <CategoryCard {...categories[1]} />
            <CategoryCard {...categories[2]} />
          </div>
          <CategoryCard {...categories[3]} large />
        </div>

        {/* Trust strip */}
        <div
          className="mt-6 mb-4 p-4 flex items-center gap-3"
          style={{
            borderRadius: 22,
            background: "linear-gradient(135deg, #3D2415, #2E1A0F)",
            boxShadow: "0 10px 32px rgba(46,26,15,0.25)",
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(210,166,121,0.25)" }}>
            <Sparkles size={22} color="#D2A679" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "#FFF6ED" }}>Wamiliki waliothibitishwa</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#D2A679" }}>Bei wazi · Hakuna ada za siri</p>
          </div>
        </div>
      </div>

    </main>
  );
}
