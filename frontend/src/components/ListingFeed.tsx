"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "./ListingCard";
import { ListingFeedSkeleton } from "./Skeletons";

function asList(category: string | string[]) {
  const raw = Array.isArray(category) ? category : [category];
  return raw.map((c) => String(c || "").trim()).filter(Boolean);
}

async function loadCats(cats: string[]) {
  if (cats.length <= 1) {
    const res = await fetchListings({ category: cats[0], status: "active" });
    return (res.items || []).filter((item) => !cats[0] || item.category === cats[0]);
  }
  const rows = await Promise.all(cats.map((c) => fetchListings({ category: c, status: "active" })));
  const seen = new Set<string>();
  const out: Listing[] = [];
  for (const res of rows) {
    for (const item of res.items || []) {
      if (!item.id || seen.has(item.id)) continue;
      if (item.category && !cats.includes(item.category)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  out.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return out;
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
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const next = await loadCats(cats);
      if (!stop) {
        setItems(next);
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [cats.join(",")]);

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
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {loading && <ListingFeedSkeleton />}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>No listings yet</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">Post a listing</Link>
          </div>
        )}
        {items.map((item, i) => (
          <ListingCard key={item.id} item={item} eager={i === 0} />
        ))}
      </div>
    </main>
  );
}
