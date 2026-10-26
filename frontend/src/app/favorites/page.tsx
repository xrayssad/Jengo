"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { type Listing } from "@/lib/api";
import { readSaved } from "@/lib/social";

export default function FavoritesPage() {
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    const sync = () => setItems(readSaved() as Listing[]);
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
            <p className="text-sm" style={{ color: "var(--muted)" }}>Saved with a bookmark</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {items.length === 0 && (
          <div className="text-center py-16">
            <Bookmark size={28} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>No favorites yet</p>
            <p className="text-sm mt-2 px-4" style={{ color: "var(--muted)" }}>Tap the bookmark on a listing to see it here.</p>
          </div>
        )}
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
