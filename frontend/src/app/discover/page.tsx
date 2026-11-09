"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { ListingFeedSkeleton } from "@/components/Skeletons";
import { shopCategories } from "@/lib/api";
import { useListings } from "@/lib/useListings";

const chips = [
  { id: "", label: "All" },
  { id: "chumba_nyumba", label: "Rooms & Houses" },
  { id: "store_godown", label: "Shops Store & Godown" },
  { id: "apartment_airbnb", label: "Apartment & Airbnb" },
  { id: "maduka", label: "Shop Frames" },
  { id: "vifaa", label: "Building Materials" },
];

const shop = new Set(shopCategories);

export default function DiscoverPage() {
  const { items, loading } = useListings({ status: "active", limit: 40 });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (cat === "maduka" && !shop.has(item.category || "")) return false;
      if (cat && cat !== "maduka" && item.category !== cat) return false;
      if (!needle) return true;
      return [item.title, item.location, item.city, item.category, item.owner_name, item.owner_username].filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [items, q, cat]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas px-5">
          <h1 className="page-title">Discover</h1>
          <div className="search-field mt-4">
            <Search size={18} color="var(--mocha)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or area" aria-label="Search listings" className="flex-1 bg-transparent text-[15px] outline-none" style={{ color: "var(--ink)" }} />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {chips.map((c) => (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setCat(c.id)}
                className={cat === c.id ? "filter-chip is-on" : "filter-chip"}
                aria-pressed={cat === c.id}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="canvas px-4 pt-6">
        {loading && items.length === 0 && <ListingFeedSkeleton />}
        {!loading && shown.length === 0 && (
          <div className="empty-panel">
            <p className="lead">No listings</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 text-sm">Post a listing</Link>
          </div>
        )}
        {shown.length > 0 && (
          <div className="listing-grid">
            {shown.map((item, i) => (
              <ListingCard key={item.id} item={item} eager={i < 4} delay={i < 8 ? i * 50 : -1} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
