"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { ListingFeedSkeleton } from "@/components/Skeletons";
import { useListings } from "@/lib/useListings";

export default function VifaaPage() {
  const { items, loading } = useListings({ category: "vifaa", status: "active", limit: 40 });

  return (
    <main className="min-h-screen pb-4" style={{ backgroundColor: "var(--bg)" }}>
      <header className="topbar">
        <div className="canvas flex items-center gap-3 px-4">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="currentColor" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">Building Materials</h1>
            <p className="page-note">Cement, steel, bricks, sand</p>
          </div>
        </div>
      </header>

      <div className="canvas px-4 pt-6">
        {loading && items.length === 0 && <ListingFeedSkeleton />}
        {!loading && items.length === 0 && (
          <div className="empty-panel">
            <p className="lead">No materials yet</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 text-sm">
              Post a listing
            </Link>
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
