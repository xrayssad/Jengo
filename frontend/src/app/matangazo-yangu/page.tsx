"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { fetchListing, type Listing } from "@/lib/api";
import { readIds } from "@/lib/mine";

export default function Page() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      const ids = readIds();
      const out: Listing[] = [];
      for (const id of ids) {
        try {
          out.push(await fetchListing(id));
        } catch {}
      }
      if (!stop) {
        setItems(out);
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "#2E1A0F" }}>Matangazo yangu</h1>
            <p className="text-sm" style={{ color: "#5C4033" }}>Uliyoweka</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {loading && <div className="flex justify-center py-16"><Loader2 className="animate-spin" color="#8B5E3C" /></div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-heading" style={{ color: "#2E1A0F" }}>Bado hujaweka tangazo</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">Weka Tangazo</Link>
          </div>
        )}
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
