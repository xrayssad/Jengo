"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";

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
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
              <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>{title}</h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {loading ? "Loading..." : `${items.length} available`}
              </p>
            </div>
          </div>
          {tabs}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={32} color="var(--mocha)" className="animate-spin" />
          </div>
        )}
        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "var(--error)" }}>{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <Icon size={40} color="var(--caramel)" className="mx-auto mb-3 opacity-60" />
            <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>No listings yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "var(--muted)" }}>Be the first to post.</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block px-6 py-3 rounded-full text-sm font-semibold">
              Post a listing
            </Link>
          </div>
        )}
        {!loading && !error && items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
