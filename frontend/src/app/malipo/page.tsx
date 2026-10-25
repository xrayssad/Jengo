"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { fetchListing, formatPrice } from "@/lib/api";
import { readBookings, type SavedBooking } from "@/lib/mine";

type Row = SavedBooking & { price?: number; period?: string };

export default function MalipoPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      const base = readBookings();
      const out: Row[] = [];
      for (const b of base) {
        let price: number | undefined;
        let period: string | undefined;
        try {
          const item = await fetchListing(b.listing_id);
          price = item.price;
          period = item.period;
        } catch {}
        out.push({ ...b, price, period });
      }
      if (!stop) {
        setRows(out);
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  const total = rows.reduce((s, r) => s + (r.price || 0), 0);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Malipo</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Maombi yako na bei. Pesa bado hazikatwi hapa.</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="p-4 rounded-[18px]" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
          <p className="text-[11px] uppercase" style={{ color: "#D2A679" }}>Jumla ya maombi</p>
          <p className="text-2xl font-bold mt-1">TZS {formatPrice(total)}</p>
          <p className="text-xs mt-1" style={{ color: "#F5E6D3" }}>Hali: haijalipwa. Lipa ukikutana na mwenye tangazo.</p>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" color="#8B5E3C" /></div>}

        {!loading && rows.length === 0 && (
          <div className="text-center py-12">
            <CreditCard size={32} color="#D2A679" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna malipo bado</p>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>Tuma ombi kwenye tangazo kwanza.</p>
          </div>
        )}

        {rows.map((r, i) => (
          <Link key={i} href={`/tangazo/${r.listing_id}`} className="block p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold" style={{ color: "#2E1A0F" }}>{r.title || "Tangazo"}</h2>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "#F5E6D3", color: "#8B5E3C" }}>HAIJALIPWA</span>
            </div>
            <p className="text-sm mt-2" style={{ color: "#2E1A0F" }}>{r.price ? `TZS ${formatPrice(r.price)}` : "Bei haipatikani"}</p>
            {r.message && <p className="text-xs mt-1" style={{ color: "#5C4033" }}>{r.message}</p>}
          </Link>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
