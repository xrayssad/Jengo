"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ListingBrowse from "@/components/ListingBrowse";
import { canonicalCategory } from "@/lib/categories.config";
import { useListings } from "@/lib/useListings";

const chips = [
  { id: "", label: "All" },
  { id: "rooms-houses", label: "Rooms & Houses" },
  { id: "apartment_airbnb", label: "Apartment & Airbnb" },
  { id: "store_godown", label: "Shops Store & Godown" },
  { id: "frame", label: "Shop Frames" },
  { id: "plots", label: "Plots" },
  { id: "vifaa", label: "Building Materials" },
];

export default function DiscoverPage() {
  const { items, loading, error, pending, stale, refresh } = useListings({ status: "active", limit: 40 });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (cat && canonicalCategory(item.category) !== cat && item.category !== cat) return false;
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
        <ListingBrowse items={shown} loading={loading} error={error} pending={pending} stale={stale} onRefresh={() => { void refresh(); }} />
      </div>
    </main>
  );
}
