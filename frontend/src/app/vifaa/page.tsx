"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { ListingFeedSkeleton } from "@/components/Skeletons";

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
    <main className="min-h-screen pb-24" style={{ backgroundColor: "var(--paper)" }}>
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div>
            <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>Building Materials</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Cement, steel, bricks, sand</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-6 space-y-5">
        {loading && <ListingFeedSkeleton />}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>No materials yet</p>
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
