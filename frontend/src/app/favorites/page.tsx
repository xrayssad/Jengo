"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Clapperboard } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import PosterName from "@/components/PosterName";
import { type Listing } from "@/lib/api";
import { readSaved, type SavedPost } from "@/lib/social";

function ReelFavorite({ item }: { item: SavedPost }) {
  return (
    <Link href="/reels" className="estate-card block overflow-hidden">
      <div className="relative" style={{ height: 220, backgroundColor: "var(--ink-2)" }}>
        {item.thumb_url || item.images?.[0] ? (
          <img src={item.thumb_url || item.images?.[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Clapperboard size={28} color="var(--gold)" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,12,9,0.72), transparent 55%)" }} />
        <div className="absolute left-3 right-3 bottom-3">
          <PosterName item={item} tone="photo" />
          <p className="text-sm mt-1 truncate" style={{ color: "#FFF6ED" }}>{item.title}</p>
        </div>
      </div>
    </Link>
  );
}

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
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>Favorites</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Saved listings and reels</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {items.length === 0 && (
          <div className="text-center py-16">
            <Bookmark size={28} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>No favorites yet</p>
            <p className="text-sm mt-2 px-4" style={{ color: "var(--muted)" }}>Tap the bookmark on a listing or reel to see it here.</p>
          </div>
        )}
        {items.map((item) =>
          item.kind === "reel" ? (
            <ReelFavorite key={item.id} item={item} />
          ) : (
            <ListingCard key={item.id} item={item as Listing} />
          ),
        )}
      </div>
    </main>
  );
}
