"use client";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { fetchListing, formatPrice, periodLabel, type Listing } from "@/lib/api";
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
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Matangazo yangu</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Uliyoweka kwenye simu hii</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {loading && <div className="flex justify-center py-16"><Loader2 className="animate-spin" color="#8B5E3C" /></div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Bado hujaweka tangazo</p>
            <Link href="/weka-tangazo" className="inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>Weka Tangazo</Link>
          </div>
        )}
        {items.map((item) => (
          <Link key={item.id} href={`/tangazo/${item.id}`} className="block p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
            <h2 className="font-bold" style={{ color: "#2E1A0F" }}>{item.title}</h2>
            <p className="text-sm mt-1" style={{ color: "#2E1A0F" }}>TZS {formatPrice(item.price)} <span style={{ color: "#5C4033" }}>{periodLabel(item.period)}</span></p>
          </Link>
        ))}
      </div>
          <BottomNav />
    </main>
  );
}
