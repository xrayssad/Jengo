"use client";

import { Home, Store, Building2, KeyRound, Search, Plus, User, Menu, MessageCircle, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const categories = [
  { title: "Apartments", description: "Mwezi · miezi 3 · 6 · mwaka", icon: Building2, href: "/nyumba" },
  { title: "Airbnb", description: "Usiku · siku · wiki", icon: KeyRound, href: "/airbnb" },
  { title: "Store & Godown", description: "Mwezi · miezi 3 · 6 · mwaka", icon: Store, href: "/maduka" },
  { title: "Frame za Maduka", description: "Frame / stall za biashara", icon: LayoutGrid, href: "/maduka" },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-30 px-4 py-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#D2A679" }}>
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
        {menuOpen && (
          <div className="max-w-md mx-auto mt-3 rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-3.5 text-sm font-medium" style={{ color: "#2E1A0F", borderBottom: "1px solid rgba(61,36,21,0.1)" }}>Profile</Link>
            <Link href="/messages" onClick={() => setMenuOpen(false)} className="block px-4 py-3.5 text-sm font-medium" style={{ color: "#2E1A0F", borderBottom: "1px solid rgba(61,36,21,0.1)" }}>Messages</Link>
            <Link href="/weka-tangazo" onClick={() => setMenuOpen(false)} className="block px-4 py-3.5 text-sm font-medium" style={{ color: "#2E1A0F", borderBottom: "1px solid rgba(61,36,21,0.1)" }}>Weka Tangazo</Link>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3.5 text-sm font-medium" style={{ color: "#A6452E" }}>Tokaa</Link>
          </div>
        )}
      </header>

      <div className="max-w-md mx-auto px-4 pt-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Chagua unachotafuta</h2>
        <p className="text-sm mb-5" style={{ color: "#5C4033" }}>Apartments · Airbnb · Store · Frame</p>

        <Link href="/search" className="flex items-center gap-3 px-4 py-3.5 mb-6 rounded-[18px]" style={{ backgroundColor: "white", border: "1.5px solid rgba(210,166,121,0.6)" }}>
          <Search size={18} color="#8B5E3C" />
          <span className="text-sm" style={{ color: "#8B5E3C" }}>Tafuta apartment, airbnb, store...</span>
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 glass" style={{ borderTop: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          <Link href="/home" className="flex flex-col items-center gap-0.5 py-1 px-3">
            <Home size={22} color="#2E1A0F" strokeWidth={2.2} />
            <span className="text-[10px] font-semibold" style={{ color: "#2E1A0F" }}>Home</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center gap-0.5 py-1 px-3">
            <MessageCircle size={22} color="#8B5E3C" strokeWidth={1.8} />
            <span className="text-[10px]" style={{ color: "#8B5E3C" }}>Chat</span>
          </Link>
          <Link href="/weka-tangazo" className="w-14 h-14 -mt-5 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(165deg, #8B5E3C, #2E1A0F)", boxShadow: "0 6px 20px rgba(46,26,15,0.35)" }}>
            <Plus size={26} color="#FFF6ED" strokeWidth={2.5} />
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-0.5 py-1 px-3">
            <Search size={22} color="#8B5E3C" strokeWidth={1.8} />
            <span className="text-[10px]" style={{ color: "#8B5E3C" }}>Tafuta</span>
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
