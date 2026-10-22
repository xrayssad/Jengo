"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, BadgeCheck, Heart, TrendingUp, Sparkles, Clock } from "lucide-react";
import Link from "next/link";

const tabs = [
  { id: "popular", label: "Popular", icon: Sparkles },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "latest", label: "Latest", icon: Clock },
];

const data: Record<string, { id: number; title: string; price: string; period: string; location: string; category: string; verified: boolean }[]> = {
  popular: [
    { id: 1, title: "Apartment 2BR Masaki", price: "320,000", period: "/mwezi", location: "Masaki, Dar", category: "Chumba & Nyumba", verified: true },
    { id: 3, title: "Studio Airbnb Mikocheni", price: "85,000", period: "/usiku", location: "Mikocheni, Dar", category: "Apartment & Airbnb", verified: true },
    { id: 5, title: "Godown kubwa Mikocheni", price: "450,000", period: "/mwezi", location: "Mikocheni, Dar", category: "Store & Godown", verified: true },
  ],
  trending: [
    { id: 2, title: "Chumba Kinondoni", price: "180,000", period: "/mwezi", location: "Kinondoni, Dar", category: "Chumba & Nyumba", verified: true },
    { id: 6, title: "Frame ya duka Kariakoo", price: "250,000", period: "/mwezi", location: "Kariakoo, Dar", category: "Frame", verified: true },
    { id: 4, title: "Villa Airbnb Mbezi", price: "250,000", period: "/usiku", location: "Mbezi Beach, Dar", category: "Apartment & Airbnb", verified: true },
  ],
  latest: [
    { id: 7, title: "Duka dogo Sinza", price: "150,000", period: "/mwezi", location: "Sinza, Dar", category: "Store & Godown", verified: false },
    { id: 1, title: "Apartment 2BR Masaki", price: "320,000", period: "/mwezi", location: "Masaki, Dar", category: "Chumba & Nyumba", verified: true },
    { id: 3, title: "Studio Airbnb Mikocheni", price: "85,000", period: "/usiku", location: "Mikocheni, Dar", category: "Apartment & Airbnb", verified: true },
  ],
};

export default function DiscoverPage() {
  const [tab, setTab] = useState("popular");
  const listings = data[tab] || [];

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
              <ArrowLeft size={18} strokeWidth={2.2} />
            </Link>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Discover</h1>
              <p className="text-xs" style={{ color: "#5C4033" }}>Popular · Trending · Latest</p>
            </div>
          </div>
          <div className="flex gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-xs font-semibold"
                  style={{
                    backgroundColor: active ? "#2E1A0F" : "white",
                    color: active ? "#FFF6ED" : "#2E1A0F",
                    border: active ? "none" : "1.5px solid #3D2415",
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {listings.map((item) => (
          <Link
            key={item.id + tab}
            href={`/tangazo/${item.id}`}
            className="card-lift flex gap-3 p-3 rounded-[18px]"
            style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.15)" }}
          >
            <div
              className="w-24 h-24 rounded-[14px] shrink-0 flex items-center justify-center"
              style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}
            >
              <span className="text-[10px] font-bold" style={{ color: "#D2A679" }}>{item.category}</span>
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex items-center gap-1 mb-0.5">
                {item.verified && (
                  <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: "#8B5E3C" }}>
                    <BadgeCheck size={11} /> Amethibitishwa
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm truncate" style={{ color: "#2E1A0F" }}>{item.title}</h3>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} color="#8B5E3C" />
                <span className="text-xs truncate" style={{ color: "#5C4033" }}>{item.location}</span>
              </div>
              <p className="font-bold text-sm mt-1.5" style={{ color: "#2E1A0F" }}>
                TZS {item.price}
                <span className="text-xs font-normal" style={{ color: "#5C4033" }}> {item.period}</span>
              </p>
            </div>
            <button type="button" className="self-start p-1.5" onClick={(e) => e.preventDefault()}>
              <Heart size={18} color="#8B5E3C" />
            </button>
          </Link>
        ))}
      </div>
    </main>
  );
}
