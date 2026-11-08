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
      <header className="topbar">
        <div className="canvas px-5">
          <div className="flex items-center gap-3">
            <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
            </Link>
            <div className="min-w-0">
              <h1 className="page-title">{title}</h1>
              <p className="page-note">
                {loading ? "Loading..." : `${items.length} available`}
              </p>
            </div>
          </div>
          {tabs}
        </div>
      </header>

      <div className="canvas px-4 py-6">
        {loading && <ListingFeedSkeleton />}
        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "var(--error)" }}>{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="empty-panel">
            <Icon size={36} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="lead">No listings yet</p>
            <p className="hint">Be the first to post.</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-6 py-3 text-sm">
              Post a listing
            </Link>
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="listing-grid">
            {items.map((item, i) => (
              <ListingCard key={item.id} item={item} eager={i < 4} delay={Math.min(i, 5) * 45} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
