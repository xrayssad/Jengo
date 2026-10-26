"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { fetchListings, shopCategories, type Listing } from "@/lib/api";

const chips = [
  { id: "", label: "All" },
  { id: "chumba_nyumba", label: "Houses / Rooms" },
  { id: "store_godown", label: "Godown / Store" },
  { id: "apartment_airbnb", label: "Apartment & Airbnb" },
  { id: "maduka", label: "Shop frames" },
  { id: "vifaa", label: "Building materials" },
];

const shop = new Set(shopCategories);

export default function DiscoverPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const res = await fetchListings({ status: "active" });
      if (!stop) {
        setItems(res.items || []);
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (cat === "maduka" && !shop.has(item.category || "")) return false;
      if (cat && cat !== "maduka" && item.category !== cat) return false;
      if (!needle) return true;
      return [item.title, item.location, item.city, item.category].filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [items, q, cat]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3 glass">
        <div className="max-w-md mx-auto">
          <p className="text-sm" style={{ color: "var(--mocha)" }}>Browse</p>
          <h1 className="font-heading text-[34px] leading-[1.05]" style={{ color: "var(--ink)" }}>Discover</h1>
          <div className="mt-4 flex items-center gap-2 px-4 py-3 sheet rounded-full">
            <Search size={16} color="var(--mocha)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or area" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--ink)" }} />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {chips.map((c) => (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setCat(c.id)}
                className={`px-3.5 py-1.5 text-sm shrink-0 ${cat === c.id ? "rounded-full" : "chip"}`}
                style={cat === c.id ? { backgroundColor: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink)" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {loading && <div className="flex justify-center py-16"><Loader2 className="animate-spin" color="var(--mocha)" /></div>}
        {!loading && shown.length === 0 && (
          <div className="text-center py-16">
            <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>No listings</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">Post a listing</Link>
          </div>
        )}
        {shown.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
