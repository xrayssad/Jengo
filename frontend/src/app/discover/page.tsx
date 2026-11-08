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
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto">
          <p className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>Browse</p>
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>Discover</h1>
          <div className="mt-4 flex items-center gap-2 px-4 py-3.5 sheet rounded-full">
            <Search size={16} color="var(--mocha)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or area" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--ink)" }} />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {chips.map((c) => (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setCat(c.id)}
                className="px-3.5 py-2 text-[13px] font-medium shrink-0 rounded-full"
                style={
                  cat === c.id
                    ? { backgroundColor: "var(--ink)", color: "var(--paper)", boxShadow: "var(--shadow-quiet)" }
                    : { color: "var(--ink)", background: "var(--surface)", border: "1px solid rgba(var(--caramel-rgb),0.32)", boxShadow: "var(--shadow-quiet)" }
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-5">
        {loading && items.length === 0 && <ListingFeedSkeleton />}
        {!loading && shown.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>No listings</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">Post a listing</Link>
          </div>
        )}
        {shown.length > 0 && (
          <div className="listing-grid">
            {shown.map((item, i) => (
              <ListingCard key={item.id} item={item} eager={i < 2} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
