"use client";

import {
  Home, Store, Building2, KeyRound, Search, Plus, User, Menu,
  MessageCircle, LayoutGrid, Compass, Heart, ImageIcon, CreditCard, Bookmark
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const categories = [
  { title: "Apartments", description: "Mwezi · miezi 3 · 6 · mwaka", icon: Building2, href: "/nyumba" },
  { title: "Airbnb", description: "Usiku · siku · wiki", icon: KeyRound, href: "/airbnb" },
  { title: "Store & Godown", description: "Mwezi · miezi 3 · 6 · mwaka", icon: Store, href: "/maduka" },
  { title: "Frame za Maduka", description: "Frame / stall za biashara", icon: LayoutGrid, href: "/maduka" },
];

const sideLinks = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Messages / Chat", href: "/messages", icon: MessageCircle },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Vipendwa (Favorites)", href: "/favorites", icon: Heart },
  { label: "Picha zilizohifadhiwa", href: "/saved", icon: Bookmark },
  { label: "Malipo (Payments)", href: "/payments", icon: CreditCard },
  { label: "Weka Tangazo", href: "/weka-tangazo", icon: Plus },
  { label: "Tafuta", href: "/search", icon: Search },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-30 px-4 py-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#D2A679" }}
            aria-label="Menu"
          >
            <Menu size={18} color="#2E1A0F" strokeWidth={2.2} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Jengo</h1>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: "#8B5E3C" }}>Marketplace</p>
          </div>
          <Link href="/messages" className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ backgroundColor: "#D2A679" }}>
            <MessageCircle size={17} color="#2E1A0F" strokeWidth={2.2} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: "#A6452E", color: "#FFF6ED" }}>2</span>
          </Link>
        </div>

        {/* SIDEBAR / drawer */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMenuOpen(false)} />
            <div
              className="fixed top-0 left-0 bottom-0 z-50 w-[78%] max-w-[300px] overflow-y-auto"
              style={{
                backgroundColor: "#FFF6ED",
                boxShadow: "8px 0 32px rgba(46,26,15,0.2)",
                borderRight: "1.5px solid #3D2415",
              }}
            >
              <div className="p-5" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "rgba(210,166,121,0.35)", color: "#FFF6ED" }}>
                    J
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: "#FFF6ED" }}>Jengo App</p>
                    <p className="text-xs" style={{ color: "#D2A679" }}>Menu</p>
                  </div>
                </div>
              </div>
              <nav className="py-2">
                {sideLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                      style={{ borderBottom: "1px solid rgba(61,36,21,0.08)" }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "white" }}>
                        <Icon size={18} color="#8B5E3C" strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#2E1A0F" }}>{item.label}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-5 py-4 mt-2"
                >
                  <span className="text-sm font-semibold" style={{ color: "#A6452E" }}>Tokaa</span>
                </Link>
              </nav>
            </div>
          </>
        )}
      </header>

      <div className="max-w-md mx-auto px-4 pt-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Chagua unachotafuta</h2>
        <p className="text-sm mb-5" style={{ color: "#5C4033" }}>Apartments · Airbnb · Store · Frame</p>

        <Link
          href="/discover"
          className="flex items-center gap-3 px-4 py-3.5 mb-6 rounded-[18px]"
          style={{ backgroundColor: "white", border: "1.5px solid rgba(210,166,121,0.6)" }}
        >
          <Compass size={18} color="#8B5E3C" />
          <span className="text-sm" style={{ color: "#8B5E3C" }}>Discover — popular, trending, latest...</span>
        </Link>

        <div className="grid grid-cols-2 gap-3.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href={cat.href}
                className="card-lift text-left p-5 rounded-[20px] relative overflow-hidden"
                style={{
                  background: "linear-gradient(165deg, #3D2415 0%, #2E1A0F 55%, #1A0F08 100%)",
                  border: "1px solid rgba(210,166,121,0.25)",
                  boxShadow: "0 8px 24px rgba(46,26,15,0.35)",
                }}
              >
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(139,94,60,0.4)" }}>
                    <Icon size={20} color="#F5E6D3" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-bold text-[14px]" style={{ color: "#FFF6ED" }}>{cat.title}</h3>
                  <p className="text-[11px] mt-1" style={{ color: "#D2A679" }}>{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom nav: Home | Discover | + | Chat | Profile  (swap chat & tafuta → discover left of +, chat right) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass" style={{ borderTop: "1px solid rgba(210,166,121,0.4)" }}>
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
          <Link href="/profile" className="flex flex-col items-center gap-0.5 py-1 px-3">
            <User size={22} color="#8B5E3C" strokeWidth={1.8} />
            <span className="text-[10px]" style={{ color: "#8B5E3C" }}>Profile</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
