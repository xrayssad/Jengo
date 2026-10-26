"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, MapPin } from "lucide-react";
import { formatPrice, periodLabel } from "@/lib/api";
import { readSaved, type SavedPost } from "@/lib/social";

export default function FavoritesPage() {
  const [items, setItems] = useState<SavedPost[]>([]);

  useEffect(() => {
    const sync = () => setItems(readSaved());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("jengo-saved", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("jengo-saved", sync);
    };
  }, []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Vipendwa</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Matangazo uliyohifadhi kwa bookmark</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {items.length === 0 && (
          <div className="text-center py-16">
            <Bookmark size={28} color="#D2A679" className="mx-auto mb-3" />
            <p className="font-heading" style={{ color: "#2E1A0F" }}>Hakuna vipendwa bado</p>
            <p className="text-sm mt-2" style={{ color: "#5C4033" }}>Bofya bookmark kwenye tangazo ili lionekane hapa.</p>
          </div>
        )}
        {items.map((item) => (
          <Link key={item.id} href={`/tangazo/${item.id}`} className="soft-card overflow-hidden card-lift block">
            {item.images?.[0] ? (
              <img src={item.images[0]} alt="" className="w-full h-52 object-cover" />
            ) : (
              <div className="w-full h-36" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }} />
            )}
            <div className="p-4">
              <h2 className="font-heading text-lg leading-snug" style={{ color: "#2E1A0F" }}>{item.title}</h2>
              <p className="flex items-center gap-1 mt-1.5 text-sm" style={{ color: "#5C4033" }}>
                <MapPin size={13} color="#8B5E3C" />
                {[item.location, item.city].filter(Boolean).join(", ") || "—"}
              </p>
              <p className="mt-2 font-semibold" style={{ color: "#2E1A0F" }}>
                TZS {formatPrice(item.price)}
                <span className="text-sm font-normal" style={{ color: "#5C4033" }}> {periodLabel(item.period)}</span>
              </p>
              <p className="text-xs mt-2 font-semibold" style={{ color: "#8B5E3C" }}>Fungua, kisha tuma Ujumbe kwa mwenye tangazo</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
