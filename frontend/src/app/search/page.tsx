"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Search, MapPin, BadgeCheck, X } from "lucide-react";
import Link from "next/link";

const allListings = [
  { id: 1, title: "Chumba kizuri Kinondoni", price: "180,000", period: "/mwezi", location: "Kinondoni, Dar", verified: true, category: "Chumba & Nyumba" },
  { id: 2, title: "Apartment 2BR Masaki", price: "320,000", period: "/mwezi", location: "Masaki, Dar", verified: true, category: "Chumba & Nyumba" },
  { id: 3, title: "Studio Airbnb Mikocheni", price: "85,000", period: "/usiku", location: "Mikocheni, Dar", verified: true, category: "Apartment & Airbnb" },
  { id: 4, title: "Villa Airbnb Mbezi", price: "250,000", period: "/usiku", location: "Mbezi Beach, Dar", verified: true, category: "Apartment & Airbnb" },
  { id: 5, title: "Godown kubwa Mikocheni", price: "450,000", period: "/mwezi", location: "Mikocheni, Dar", verified: true, category: "Store & Godown" },
  { id: 6, title: "Frame ya duka Kariakoo", price: "250,000", period: "/mwezi", location: "Kariakoo, Dar", verified: true, category: "Store & Godown" },
  { id: 7, title: "Duka dogo Sinza", price: "150,000", period: "/mwezi", location: "Sinza, Dar", verified: false, category: "Store & Godown" },
];

const filters = ["Zote", "Chumba & Nyumba", "Apartment & Airbnb", "Store & Godown", "Frame"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Zote");

  const results = useMemo(() => {
    return allListings.filter((item) => {
      const matchQuery =
        !query ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase());
      const matchFilter = activeFilter === "Zote" || item.category === activeFilter;
      return matchQuery && matchFilter;
    });
  }, [query, activeFilter]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            {/* BACK → /home */}
            <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm shrink-0">
              <ArrowLeft size={18} strokeWidth={2.2} />
            </Link>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tafuta chumba, nyumba, apartment..."
                autoFocus
                className="input-chocolate w-full pl-10 pr-10 py-3 text-sm"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={16} color="#8B5E3C" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium"
                style={{
                  backgroundColor: activeFilter === f ? "#2E1A0F" : "white",
                  color: activeFilter === f ? "#FFF6ED" : "#2E1A0F",
                  border: activeFilter === f ? "none" : "1.5px solid #3D2415",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <p className="text-xs mb-4" style={{ color: "#5C4033" }}>
          {results.length} matokeo{query ? ` kwa "${query}"` : ""}
        </p>
        {results.length === 0 ? (
          <div className="text-center py-16">
            <Search size={40} color="#D2A679" className="mx-auto mb-4 opacity-60" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna matokeo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <Link
                key={item.id}
                href={`/tangazo/${item.id}`}
                className="card-lift block rounded-[18px] p-4"
                style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.2)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF6ED", color: "#8B5E3C" }}>
                      {item.category}
                    </span>
                    {item.verified && (
                      <span className="ml-2 text-[10px] font-medium" style={{ color: "#8B5E3C" }}>
                        <BadgeCheck size={11} className="inline" /> Amethibitishwa
                      </span>
                    )}
                    <h3 className="font-bold text-[15px] mt-1 truncate" style={{ color: "#2E1A0F" }}>{item.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} color="#8B5E3C" />
                      <span className="text-xs" style={{ color: "#5C4033" }}>{item.location}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[15px]" style={{ color: "#2E1A0F" }}>TZS {item.price}</p>
                    <p className="text-xs" style={{ color: "#5C4033" }}>{item.period}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
