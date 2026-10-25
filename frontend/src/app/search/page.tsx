"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchListings, type Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";

const filters = [
  { id: "", label: "Zote" },
  { id: "chumba_nyumba", label: "Chumba & Nyumba" },
  { id: "apartment_airbnb", label: "Apartment & Airbnb" },
  { id: "store_godown", label: "Store & Godown" },
  { id: "frame", label: "Frame" },
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
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(initialQ);
    setCategory(initialCat);
  }, [initialQ, initialCat]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchListings({
          status: "active",
          category: category || undefined,
          q: debounced || undefined,
        });
        if (!cancelled) setItems(res.items || []);
      } catch {
        if (!cancelled) setError("Imeshindikana kupakia. Hakikisha API inaendesha.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, category]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm shrink-0">
              <ArrowLeft size={18} strokeWidth={2.2} />
            </Link>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tafuta chumba, nyumba, apartment..."
                autoFocus
                className="input-chocolate w-full pl-10 pr-10 py-3 text-sm"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={16} color="#8B5E3C" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => {
              const active = category === f.id;
              return (
                <button
                  key={f.id || "zote"}
                  type="button"
                  onClick={() => setCategory(f.id)}
                  className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium"
                  style={{
                    backgroundColor: active ? "#2E1A0F" : "white",
                    color: active ? "#FFF6ED" : "#2E1A0F",
                    border: active ? "none" : "1.5px solid #3D2415",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <p className="text-xs mb-4" style={{ color: "#5C4033" }}>
          {loading ? "Inapakia..." : `${items.length} matokeo`}
          {!loading && query ? ` kwa "${query}"` : ""}
        </p>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={32} color="#8B5E3C" className="animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "#A6452E" }}>{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <Search size={40} color="#D2A679" className="mx-auto mb-4 opacity-60" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>
              {query || category ? "Hakuna matokeo" : "Hakuna matangazo bado"}
            </p>
            {!query && !category && (
              <Link
                href="/weka-tangazo"
                className="inline-block mt-4 px-6 py-3 rounded-full text-sm font-semibold"
                style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}
              >
                Weka Tangazo
              </Link>
            )}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-5">
            {items.map((item) => (
              <ListingCard key={item.id} item={item} />
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
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF6ED" }}>
          <Loader2 size={28} color="#8B5E3C" className="animate-spin" />
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
