"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "./ListingCard";

export default function ListingFeed({
  title,
  subtitle,
  category,
}: {
  title: string;
  subtitle: string;
  category: string;
}) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const res = await fetchListings({ category, status: "active" });
      if (!stop) {
        setItems((res.items || []).filter((item) => item.category === category));
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [category]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>{title}</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>{subtitle}</p>
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
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
