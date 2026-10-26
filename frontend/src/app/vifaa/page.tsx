"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";

export default function VifaaPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const res = await fetchListings({ category: "vifaa", status: "active" });
      if (!stop) {
        setItems((res.items || []).filter((item) => item.category === "vifaa"));
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "#2E1A0F" }}>Building materials</h1>
            <p className="text-sm" style={{ color: "#5C4033" }}>Cement, steel, bricks, sand</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-6 space-y-5">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} color="#8B5E3C" className="animate-spin" />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>No materials yet</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">
              Post a listing
            </Link>
          </div>
        )}
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
