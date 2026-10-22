"use client";

import {
  Home, Store, Building2, KeyRound, Search, Plus, User, Menu,
  MessageCircle, LayoutGrid, Compass, Heart, CreditCard, Bookmark,
  Settings, X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const categories = [
  {
    title: "Apartments",
    description: "Mwezi · miezi 3 · 6 · mwaka",
    icon: Building2,
    href: "/nyumba",
    images: ["/real/apartment.jpg", "/real/room.jpg"],
  },
  {
    title: "Airbnb",
    description: "Usiku · siku · wiki",
    icon: KeyRound,
    href: "/airbnb",
    images: ["/real/room.jpg", "/real/apartment.jpg"],
  },
  {
    title: "Store & Godown",
    description: "Mwezi · miezi 3 · 6 · mwaka",
    icon: Store,
    href: "/maduka",
    images: ["/real/warehouse.jpg", "/real/shop.jpg"],
  },
  {
    title: "Frame za Maduka",
    description: "Frame / stall za biashara",
    icon: LayoutGrid,
    href: "/maduka",
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
  { label: "Weka Tangazo", href: "/weka-tangazo", icon: Plus },
  { label: "Mipangilio", href: "/settings", icon: Settings },
];

function CategoryCard({
  title,
  description,
  icon: Icon,
  href,
  images,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  href: string;
  images: string[];
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 7000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[20px] text-left block"
      style={{
        height: 172,
        border: "1px solid rgba(210,166,121,0.3)",
        boxShadow: "0 8px 28px rgba(46,26,15,0.2)",
      }}
    >
      {images.map((src, i) => (
        <div
          key={src + i}
          className="absolute inset-0"
          style={{
            opacity: idx === i ? 1 : 0,
            transition: "opacity 1.1s ease-in-out",
            zIndex: idx === i ? 1 : 0,
          }}
        >
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover"
            style={{
              transform: idx === i ? "scale(1.08)" : "scale(1)",
              transition: idx === i ? "transform 7s ease-out" : "none",
            }}
            sizes="50vw"
          />
        </div>
      ))}
      {/* Soft pan overlay alternate feel */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none transition-opacity duration-700"
        style={{
          background:
            idx === 0
              ? "linear-gradient(to top, rgba(26,15,8,0.92) 0%, rgba(26,15,8,0.4) 50%, rgba(26,15,8,0.1) 100%)"
              : "linear-gradient(to top, rgba(26,15,8,0.88) 0%, rgba(46,26,15,0.35) 55%, transparent 100%)",
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110"
          style={{ background: "rgba(210,166,121,0.28)", backdropFilter: "blur(8px)" }}
        >
          <Icon size={17} color="#F5E6D3" strokeWidth={1.8} />
        </div>
        <h3 className="font-bold text-[13px] leading-tight" style={{ color: "#FFF6ED" }}>
          {title}
        </h3>
        <p className="text-[10px] mt-0.5" style={{ color: "#D2A679" }}>
          {description}
        </p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-30 px-4 py-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#D2A679" }}
            aria-label="Fungua menu"
          >
            <Menu size={18} color="#2E1A0F" strokeWidth={2.2} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold leading-tight" style={{ color: "#2E1A0F" }}>Jengo</h1>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: "#8B5E3C" }}>Marketplace</p>
          </div>
          <Link href="/messages" className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ backgroundColor: "#D2A679" }}>
            <MessageCircle size={17} color="#2E1A0F" strokeWidth={2.2} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: "#A6452E", color: "#FFF6ED" }}>2</span>
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
        <div className="flex items-center justify-between px-4 shrink-0" style={{ minHeight: 64, background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "rgba(210,166,121,0.35)", color: "#FFF6ED" }}>J</div>
            <div className="min-w-0">
              <p className="font-bold text-base truncate" style={{ color: "#FFF6ED" }}>Jengo App</p>
              <p className="text-[10px]" style={{ color: "#D2A679" }}>Menu</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(210,166,121,0.2)" }} aria-label="Funga menu">
            <X size={20} color="#F5E6D3" strokeWidth={2.2} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overscroll-contain py-2" style={{ WebkitOverflowScrolling: "touch", minHeight: 0 }}>
          {sideLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 mx-3 my-1 px-3 py-3 rounded-[14px]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
                  <Icon size={18} color="#8B5E3C" strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#2E1A0F" }}>{item.label}</span>
              </Link>
            );
          })}
          <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 mx-3 mt-4 mb-6 px-3 py-3 rounded-[14px]" style={{ border: "1px solid rgba(166,69,46,0.35)" }}>
            <span className="text-sm font-semibold" style={{ color: "#A6452E" }}>Tokaa</span>
          </Link>
        </nav>
      </aside>

      <div className="max-w-md mx-auto px-4 pt-5">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Chagua unachotafuta</h2>
        <p className="text-sm mb-4" style={{ color: "#5C4033" }}>Apartments · Airbnb · Store · Frame</p>

        <Link href="/search" className="flex items-center gap-3 px-4 py-3.5 mb-5 rounded-[18px]" style={{ backgroundColor: "white", border: "1.5px solid rgba(210,166,121,0.6)" }}>
          <Search size={18} color="#8B5E3C" />
          <span className="text-sm" style={{ color: "#8B5E3C" }}>Tafuta apartment, airbnb, store...</span>
        </Link>

        <div className="grid grid-cols-2 gap-3.5">
          {categories.map((cat) => (
            <CategoryCard key={cat.title} {...cat} />
          ))}
        </div>
      </div>

      {/* Bottom nav – 4 equal columns, + dead center */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 glass"
        style={{ borderTop: "1px solid rgba(210,166,121,0.4)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-md mx-auto grid grid-cols-4 items-end h-[64px] px-1">
          <Link href="/home" className="flex flex-col items-center justify-center gap-0.5 h-full">
            <Home size={22} color="#2E1A0F" strokeWidth={2.2} />
            <span className="text-[10px] font-semibold" style={{ color: "#2E1A0F" }}>Home</span>
          </Link>
          <Link href="/discover" className="flex flex-col items-center justify-center gap-0.5 h-full">
            <Compass size={22} color="#8B5E3C" strokeWidth={1.8} />
            <span className="text-[10px]" style={{ color: "#8B5E3C" }}>Discover</span>
          </Link>
          {/* Center slot – + button centered in its column */}
          <div className="relative flex items-center justify-center h-full">
            <Link
              href="/weka-tangazo"
              className="absolute left-1/2 -translate-x-1/2 bottom-3 w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(165deg, #8B5E3C, #2E1A0F)",
                boxShadow: "0 6px 20px rgba(46,26,15,0.4)",
              }}
            >
              <Plus size={26} color="#FFF6ED" strokeWidth={2.5} />
            </Link>
          </div>
          <Link href="/messages" className="flex flex-col items-center justify-center gap-0.5 h-full">
            <MessageCircle size={22} color="#8B5E3C" strokeWidth={1.8} />
            <span className="text-[10px]" style={{ color: "#8B5E3C" }}>Chat</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
