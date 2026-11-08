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
      <header className="topbar">
        <div className="canvas px-5">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
            </Link>
            <h1 className="page-title">Search</h1>
          </div>
          <div className="search-field">
            <Search size={18} color="var(--mocha)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City or street"
              autoFocus
              aria-label="Search by city or street"
              className="flex-1 bg-transparent text-[15px] outline-none"
              style={{ color: "var(--ink)" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={16} color="var(--mocha)" />
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {filters.map((f) => {
              const active = category === f.id;
              return (
                <button
                  key={f.id || "zote"}
                  type="button"
                  onClick={() => setCategory(f.id)}
                  className={active ? "filter-chip is-on" : "filter-chip"}
                  aria-pressed={active}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="canvas px-4 pt-6">
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          {loading ? "Loading..." : query ? `${items.length} listings in ${query}` : `${items.length} results`}
        </p>

        {loading && items.length === 0 && <SearchSkeleton />}

        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "var(--error)" }}>{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="empty-panel">
            <Search size={32} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="lead">
              {query || category ? "No listings match this city or street" : "No listings yet"}
            </p>
            {!query && !category && (
              <Link
                href="/weka-tangazo"
                className="btn-primary inline-block mt-4 px-6 py-3 text-sm"
              >
                Post a listing
              </Link>
            )}
          </div>
        )}

        {items.length > 0 && !error && (
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
          <div className="canvas px-5 py-8">
            <SearchSkeleton />
          </div>
        </main>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
