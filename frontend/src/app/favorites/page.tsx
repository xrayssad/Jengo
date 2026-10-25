"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { formatPrice, periodLabel } from "@/lib/api";
import { readSaved, type SavedPost } from "@/lib/social";

export default function FavoritesPage() {
  const [items, setItems] = useState<SavedPost[]>([]);
  useEffect(() => setItems(readSaved()), []);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Favorites</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Post ulizohifadhi, pamoja na maelezo</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {items.length === 0 && (
          <div className="text-center py-16">
            <Bookmark size={32} color="#D2A679" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna favorites bado</p>
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
            {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-36 object-cover rounded-[14px] mb-3" />}
            <Link href={`/tangazo/${item.id}`}>
              <h2 className="font-bold" style={{ color: "#2E1A0F" }}>{item.title}</h2>
              <p className="text-sm mt-1" style={{ color: "#5C4033" }}>{item.location}{item.city ? `, ${item.city}` : ""}</p>
              <p className="text-sm mt-1" style={{ color: "#2E1A0F" }}>TZS {formatPrice(item.price)} {periodLabel(item.period)}</p>
            </Link>
            <Link href={`/chat/${item.id}?title=${encodeURIComponent(item.title)}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#8B5E3C" }}>
              <MessageCircle size={16} /> Andika ujumbe
            </Link>
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
