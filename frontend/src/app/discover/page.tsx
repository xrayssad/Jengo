"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { fetchListings, type Listing } from "@/lib/api";

const chips = [
  { id: "", label: "Vyote" },
  { id: "chumba_nyumba", label: "Nyumba" },
  { id: "apartment_airbnb", label: "Airbnb" },
  { id: "store_godown", label: "Maduka" },
  { id: "vifaa", label: "Vifaa" },
];

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
      if (cat && item.category !== cat) return false;
      if (!needle) return true;
      return [item.title, item.location, item.city, item.category].filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [items, q, cat]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3 glass">
        <div className="max-w-md mx-auto">
          <h1 className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>Discover</h1>
          <div className="mt-3 flex items-center gap-2 px-4 py-3" style={{ backgroundColor: "white", border: "1px solid rgba(46,26,15,0.16)", borderRadius: 999 }}>
            <Search size={16} color="#8B5E3C" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta jina au eneo" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#2E1A0F" }} />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {chips.map((c) => (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setCat(c.id)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0"
                style={{ backgroundColor: cat === c.id ? "#2E1A0F" : "white", color: cat === c.id ? "#FFF6ED" : "#2E1A0F", border: "1px solid rgba(46,26,15,0.16)" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {loading && <div className="flex justify-center py-16"><Loader2 className="animate-spin" color="#8B5E3C" /></div>}
        {!loading && shown.length === 0 && (
          <div className="text-center py-16">
            <p className="font-heading" style={{ color: "#2E1A0F" }}>Hakuna tangazo</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">Weka tangazo</Link>
          </div>
        )}
        {shown.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
