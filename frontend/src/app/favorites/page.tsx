"use client";

import { ArrowLeft, Heart, MapPin } from "lucide-react";
import Link from "next/link";

const favorites = [
  { id: 1, title: "Apartment 2BR Masaki", price: "320,000", period: "/mwezi", location: "Masaki, Dar", type: "image" },
  { id: 3, title: "Studio Airbnb Mikocheni", price: "85,000", period: "/usiku", location: "Mikocheni, Dar", type: "image" },
  { id: 5, title: "Godown Mikocheni", price: "450,000", period: "/mwezi", location: "Mikocheni, Dar", type: "image" },
];

export default function FavoritesPage() {
  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Vipendwa</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Favorites zako</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} color="#D2A679" className="mx-auto mb-4 opacity-50" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna vipendwa bado</p>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>Bofya moyo kwenye tangazo kuhifadhi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((f) => (
              <Link
                key={f.id}
                href={`/tangazo/${f.id}`}
                className="rounded-[16px] overflow-hidden"
                style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
              >
                <div className="aspect-square flex items-center justify-center relative" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
                  <Heart size={28} color="#D2A679" fill="#D2A679" />
                </div>
                <div className="p-2.5">
                  <h3 className="font-bold text-xs truncate" style={{ color: "#2E1A0F" }}>{f.title}</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: "#5C4033" }}>{f.location}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: "#2E1A0F" }}>TZS {f.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
