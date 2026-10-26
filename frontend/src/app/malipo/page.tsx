"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
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
          const n = Number(item.price);
          price = Number.isFinite(n) ? n : undefined;
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
    <main className="min-h-screen pb-24" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>Payments</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Your requests and prices. Money is not taken here yet.</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="p-5 rounded-[28px]" style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}>
          <p className="text-sm" style={{ color: "var(--caramel)" }}>Request total</p>
          <p className="font-heading text-3xl mt-1">TZS {formatPrice(total)}</p>
          <p className="text-xs mt-2" style={{ color: "var(--cream)" }}>Status: unpaid. Pay when you meet the owner.</p>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" color="var(--mocha)" /></div>}

        {!loading && rows.length === 0 && (
          <div className="text-center py-12">
            <CreditCard size={32} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>No payments yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Send a request on a listing first.</p>
          </div>
        )}

        {rows.map((r, i) => (
          <Link key={i} href={`/tangazo/${r.listing_id}`} className="block p-4 sheet rounded-[24px]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-heading text-lg leading-snug" style={{ color: "var(--ink)" }}>{r.title || "Listing"}</h2>
              <span className="text-[11px] px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: "rgba(var(--caramel-rgb),0.28)", color: "var(--mocha)" }}>Unpaid</span>
            </div>
            <p className="text-sm mt-2" style={{ color: "var(--ink)" }}>{r.price ? `TZS ${formatPrice(r.price)}` : "Price unavailable"}</p>
            {r.message && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{r.message}</p>}
          </Link>
        ))}
      </div>
    </main>
  );
}
