"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Clapperboard } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import PosterName from "@/components/PosterName";
import { ListingFeedSkeleton } from "@/components/Skeletons";
import { type Listing } from "@/lib/api";
import { readSaved, type SavedPost } from "@/lib/social";

type SavedBlock =
  | { kind: "listings"; key: string; items: SavedPost[] }
  | { kind: "reel"; key: string; item: SavedPost };

function groupSaved(items: SavedPost[]): SavedBlock[] {
  const blocks: SavedBlock[] = [];
  for (const item of items) {
    if (item.kind === "reel") {
      blocks.push({ kind: "reel", key: item.id, item });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === "listings") last.items.push(item);
    else blocks.push({ kind: "listings", key: item.id, items: [item] });
  }
  return blocks;
}

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
          <p className="text-sm mt-1 truncate font-semibold" style={{ color: "#FFF6ED" }}>{item.title}</p>
        </div>
      </div>
    </Link>
  );
}

export default function FavoritesPage() {
  const [items, setItems] = useState<SavedPost[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(readSaved());
      setReady(true);
    };
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
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>Saved</p>
            <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>Favorites</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Saved listings and reels</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {!ready && <ListingFeedSkeleton count={4} />}
        {ready && items.length === 0 && (
          <div className="text-center py-16">
            <Bookmark size={28} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>No favorites yet</p>
            <p className="text-sm mt-2 px-4" style={{ color: "var(--muted)" }}>Tap the bookmark on a listing or reel to see it here.</p>
          </div>
        )}
        {ready && groupSaved(items).map((block) =>
          block.kind === "reel" ? (
            <ReelFavorite key={block.key} item={block.item} />
          ) : (
            <div key={block.key} className="listing-grid">
              {block.items.map((item, i) => (
                <ListingCard key={item.id} item={item as Listing} eager={i < 2} />
              ))}
            </div>
          ),
        )}
      </div>
    </main>
  );
}
