"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { ListingFeedSkeleton } from "@/components/Skeletons";

type Props = {
  title: string;
  category: string;
  icon: LucideIcon;
  variant?: "cream" | "dark";
  tabs?: React.ReactNode;
};

export default function CategoryListings({
  title,
  category,
  icon: Icon,
  tabs,
}: Props) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchListings({ category, status: "active" });
        if (!cancelled) setItems(res.items || []);
      } catch {
        if (!cancelled) setError("Could not load listings. Check that the API is running.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
            </Link>
            <div>
              <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>{title}</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                {loading ? "Loading..." : `${items.length} available`}
              </p>
            </div>
          </div>
          {tabs}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5">
        {loading && <ListingFeedSkeleton />}
        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "var(--error)" }}>{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <Icon size={40} color="var(--caramel)" className="mx-auto mb-3 opacity-60" />
            <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>No listings yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "var(--muted)" }}>Be the first to post.</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block px-6 py-3 rounded-full text-sm font-semibold">
              Post a listing
            </Link>
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="listing-grid">
            {items.map((item, i) => (
              <ListingCard key={item.id} item={item} eager={i < 2} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
