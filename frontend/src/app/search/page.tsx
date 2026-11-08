"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { SearchSkeleton } from "@/components/Skeletons";
import { useListings } from "@/lib/useListings";

const filters = [
  { id: "", label: "All" },
  { id: "chumba_nyumba", label: "Rooms & Houses" },
  { id: "apartment_airbnb", label: "Apartment & Airbnb" },
  { id: "store_godown", label: "Shops Store & Godown" },
  { id: "frame", label: "Shop Frames" },
  { id: "vifaa", label: "Building Materials" },
];

function SearchInner() {
  const search = useSearchParams();
  const initialQ = search.get("q") || "";
  const initialCat = filters.some((f) => f.id === (search.get("category") || ""))
    ? search.get("category") || ""
    : "";
  const [query, setQuery] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ.trim());
  const [category, setCategory] = useState(initialCat);
  const { items, loading, error } = useListings({
    status: "active",
    category: category || undefined,
    q: debounced || undefined,
    limit: 40,
  });

  useEffect(() => {
    setQuery(initialQ);
    setCategory(initialCat);
  }, [initialQ, initialCat]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
            </Link>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>Browse</p>
              <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>Search</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3.5 sheet rounded-full">
            <Search size={16} color="var(--mocha)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or street"
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--ink)" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={16} color="var(--mocha)" />
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {filters.map((f) => {
              const active = category === f.id;
              return (
                <button
                  key={f.id || "zote"}
                  type="button"
                  onClick={() => setCategory(f.id)}
                  className="px-3.5 py-2 text-[13px] font-medium shrink-0 rounded-full"
                  style={
                    active
                      ? { backgroundColor: "var(--ink)", color: "var(--paper)", boxShadow: "var(--shadow-quiet)" }
                      : { color: "var(--ink)", background: "var(--surface)", border: "1px solid rgba(var(--caramel-rgb),0.32)", boxShadow: "var(--shadow-quiet)" }
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-5">
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          {loading ? "Loading..." : query ? `${items.length} listings in ${query}` : `${items.length} results`}
        </p>

        {loading && items.length === 0 && <SearchSkeleton />}

        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "var(--error)" }}>{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <Search size={40} color="var(--caramel)" className="mx-auto mb-4 opacity-60" />
            <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
              {query || category ? "No listings match this city or street" : "No listings yet"}
            </p>
            {!query && !category && (
              <Link
                href="/weka-tangazo"
                className="btn-primary inline-block mt-4 px-6 py-3 rounded-full text-sm font-semibold"
              >
                Post a listing
              </Link>
            )}
          </div>
        )}

        {items.length > 0 && !error && (
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
          <div className="max-w-md mx-auto px-5 py-8">
            <SearchSkeleton />
          </div>
        </main>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
