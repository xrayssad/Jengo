"use client";

import {
  Home, Store, Building2, KeyRound, Search, Plus, User, Menu,
  MessageCircle, LayoutGrid, Compass, Heart, CreditCard, Bookmark,
  Settings, X, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const categories = [
  { title: "Apartments", description: "Mwezi · miezi 3 · 6 · mwaka", icon: Building2, href: "/nyumba" },
  { title: "Airbnb", description: "Usiku · siku · wiki", icon: KeyRound, href: "/airbnb" },
  { title: "Store & Godown", description: "Mwezi · miezi 3 · 6 · mwaka", icon: Store, href: "/maduka" },
  { title: "Frame za Maduka", description: "Frame / stall za biashara", icon: LayoutGrid, href: "/maduka" },
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

export default function HomePage() {
  const [expanded, setExpanded] = useState(false);

  // Prevent body scroll when sidebar expanded on mobile
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [expanded]);

  return (
    <main className="min-h-screen pb-24 relative" style={{ backgroundColor: "#FFF6ED" }}>
      {/* ===== SIDEBAR – always mounted, shrink / expand ===== */}
      {/* Backdrop when expanded */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(26,15,8,0.45)",
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? "auto" : "none",
        }}
        onClick={() => setExpanded(false)}
        aria-hidden
      />

      <aside
        className="fixed top-0 left-0 z-50 flex flex-col"
        style={{
          height: "100dvh",
          width: expanded ? "min(288px, 85vw)" : "56px",
          backgroundColor: "#FFF6ED",
          borderRight: "1.5px solid #3D2415",
          boxShadow: expanded ? "8px 0 32px rgba(46,26,15,0.2)" : "2px 0 12px rgba(46,26,15,0.08)",
          transition: "width 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Header row */}
        <div
          className="flex items-center shrink-0"
          style={{
            height: 56,
            padding: expanded ? "0 12px" : "0",
            justifyContent: expanded ? "space-between" : "center",
            background: "linear-gradient(165deg, #3D2415, #2E1A0F)",
            minHeight: 56,
          }}
        >
          {expanded && (
            <div className="flex items-center gap-2 min-w-0 pl-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "rgba(210,166,121,0.35)", color: "#FFF6ED" }}>
                J
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: "#FFF6ED" }}>Jengo App</p>
                <p className="text-[10px]" style={{ color: "#D2A679" }}>Menu</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: expanded ? "rgba(210,166,121,0.25)" : "transparent" }}
            aria-label={expanded ? "Funga menu" : "Fungua menu"}
          >
            {expanded ? (
              <ChevronLeft size={20} color="#F5E6D3" strokeWidth={2.2} />
            ) : (
              <Menu size={20} color="#F5E6D3" strokeWidth={2.2} />
            )}
          </button>
        </div>

        {/* Scrollable links – CRITICAL for iPhone */}
        <nav
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            WebkitOverflowScrolling: "touch",
            minHeight: 0,
          }}
        >
          <ul className="py-2">
            {sideLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setExpanded(false)}
                    className="flex items-center gap-3 mx-2 my-0.5 rounded-[12px] transition-colors"
                    style={{
                      padding: expanded ? "12px 12px" : "12px 0",
                      justifyContent: expanded ? "flex-start" : "center",
                    }}
                    title={item.label}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
                    >
                      <Icon size={17} color="#8B5E3C" strokeWidth={1.8} />
                    </div>
                    {expanded && (
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: "#2E1A0F", opacity: 1, transition: "opacity 0.2s 0.1s" }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="px-2 pb-6 pt-2">
            <Link
              href="/login"
              onClick={() => setExpanded(false)}
              className="flex items-center gap-3 rounded-[12px]"
              style={{
                padding: expanded ? "12px 12px" : "12px 0",
                justifyContent: expanded ? "flex-start" : "center",
              }}
              title="Tokaa"
            >
              {expanded ? (
                <span className="text-sm font-semibold px-1" style={{ color: "#A6452E" }}>Tokaa</span>
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(166,69,46,0.15)" }}>
                  <X size={16} color="#A6452E" />
                </div>
              )}
            </Link>
          </div>
        </nav>
      </aside>

      {/* ===== MAIN CONTENT – offset for shrunk sidebar ===== */}
      <div
        style={{
          marginLeft: 56,
          transition: "margin-left 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <header className="sticky top-0 z-30 px-3 py-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
          <div className="max-w-md mx-auto flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold leading-tight" style={{ color: "#2E1A0F" }}>Jengo</h1>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "#8B5E3C" }}>Marketplace</p>
            </div>
            <Link href="/messages" className="w-10 h-10 rounded-full flex items-center justify-center relative shrink-0" style={{ backgroundColor: "#D2A679" }}>
              <MessageCircle size={17} color="#2E1A0F" strokeWidth={2.2} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: "#A6452E", color: "#FFF6ED" }}>2</span>
            </Link>
          </div>
        </header>

        <div className="max-w-md mx-auto px-3 pt-5">
          <h2 className="text-xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Chagua unachotafuta</h2>
          <p className="text-sm mb-4" style={{ color: "#5C4033" }}>Apartments · Airbnb · Store · Frame</p>

          {/* SEARCH bar (si Discover) */}
          <Link
            href="/search"
            className="flex items-center gap-3 px-4 py-3.5 mb-5 rounded-[18px]"
            style={{ backgroundColor: "white", border: "1.5px solid rgba(210,166,121,0.6)" }}
          >
            <Search size={18} color="#8B5E3C" />
            <span className="text-sm" style={{ color: "#8B5E3C" }}>Tafuta apartment, airbnb, store...</span>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.title}
                  href={cat.href}
                  className="card-lift text-left p-4 rounded-[20px] relative overflow-hidden"
                  style={{
                    background: "linear-gradient(165deg, #3D2415 0%, #2E1A0F 55%, #1A0F08 100%)",
                    border: "1px solid rgba(210,166,121,0.25)",
                    boxShadow: "0 8px 24px rgba(46,26,15,0.35)",
                  }}
                >
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "rgba(139,94,60,0.4)" }}>
                      <Icon size={18} color="#F5E6D3" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-bold text-[13px]" style={{ color: "#FFF6ED" }}>{cat.title}</h3>
                    <p className="text-[10px] mt-1" style={{ color: "#D2A679" }}>{cat.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Home · Discover · + · Chat  (Profile IMEONDOLEWA) */}
      <nav
        className="fixed bottom-0 right-0 z-40 glass"
        style={{
          left: 56,
          borderTop: "1px solid rgba(210,166,121,0.4)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          <Link href="/home" className="flex flex-col items-center gap-0.5 py-1 px-3">
            <Home size={22} color="#2E1A0F" strokeWidth={2.2} />
            <span className="text-[10px] font-semibold" style={{ color: "#2E1A0F" }}>Home</span>
          </Link>
          <Link href="/discover" className="flex flex-col items-center gap-0.5 py-1 px-3">
            <Compass size={22} color="#8B5E3C" strokeWidth={1.8} />
            <span className="text-[10px]" style={{ color: "#8B5E3C" }}>Discover</span>
          </Link>
          <Link
            href="/weka-tangazo"
            className="w-14 h-14 -mt-5 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(165deg, #8B5E3C, #2E1A0F)", boxShadow: "0 6px 20px rgba(46,26,15,0.35)" }}
          >
            <Plus size={26} color="#FFF6ED" strokeWidth={2.5} />
          </Link>
          <Link href="/messages" className="flex flex-col items-center gap-0.5 py-1 px-3">
            <MessageCircle size={22} color="#8B5E3C" strokeWidth={1.8} />
            <span className="text-[10px]" style={{ color: "#8B5E3C" }}>Chat</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
