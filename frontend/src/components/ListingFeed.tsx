"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useListings } from "@/lib/useListings";
import ListingCard from "./ListingCard";
import { ListingFeedSkeleton } from "./Skeletons";

function asList(category: string | string[]) {
  const raw = Array.isArray(category) ? category : [category];
  return raw.map((c) => String(c || "").trim()).filter(Boolean);
}

export default function ListingFeed({
  title,
  subtitle,
  category,
}: {
  title: string;
  subtitle: string;
  category: string | string[];
}) {
  const cats = asList(category);
  const { items, setItems, loading } = useListings({
    status: "active",
    category: cats.join(","),
    limit: 40,
  });

  useEffect(() => {
    const onLike = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as { listing_id?: string; likes_count?: number };
      if (!d.listing_id || typeof d.likes_count !== "number") return;
      setItems((cur) => cur.map((item) => (item.id === d.listing_id ? { ...item, likes_count: d.likes_count } : item)));
    };
    window.addEventListener("jengo-like", onLike);
    return () => window.removeEventListener("jengo-like", onLike);
  }, []);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div>
            <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>{title}</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{subtitle}</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-5">
        {loading && items.length === 0 && <ListingFeedSkeleton />}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>No listings yet</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">Post a listing</Link>
          </div>
        )}
        {items.length > 0 && (
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
