"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "./ListingCard";

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

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "#2E1A0F" }}>{title}</h1>
            <p className="text-sm" style={{ color: "#5C4033" }}>{subtitle}</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {loading && <div className="flex justify-center py-16"><Loader2 size={28} color="#8B5E3C" className="animate-spin" /></div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-heading" style={{ color: "#2E1A0F" }}>Hakuna matangazo bado</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">Weka tangazo</Link>
          </div>
        )}
        {items.map((item, i) => (
          <ListingCard key={item.id} item={item} eager={i === 0} />
        ))}
      </div>
    </main>
  );
}
