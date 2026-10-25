"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { createReview, fetchBookings, fetchListing, formatPrice, periodLabel, setBookingStatus } from "@/lib/api";

type Row = {
  id: string;
  listing_id?: string;
  title: string;
  price?: number;
  period?: string;
  location?: string;
  message?: string;
  status?: string;
  reviewed?: boolean;
};

export default function RisitiPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rating, setRating] = useState<Record<string, number>>({});
  const [comment, setComment] = useState<Record<string, string>>({});

  useEffect(() => {
    let stop = false;
    (async () => {
      const out: Row[] = [];
      try {
        const res = await fetchBookings(undefined, "sent");
        for (const b of res.items || []) {
          if (b.status !== "accepted" && b.status !== "moved_in") continue;
          try {
            const item = await fetchListing(b.listing_id);
            out.push({
              id: b.id,
              listing_id: b.listing_id,
              title: item.title,
              price: Number(item.price),
              period: item.period,
              location: item.location,
              message: b.message,
              status: b.status,
              reviewed: Boolean(b.review),
            });
          } catch {}
        }
      } catch {}
      if (!stop) {
        setRows(out);
        setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, []);

  const confirmMoveIn = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      await setBookingStatus(id, "moved_in");
      setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status: "moved_in" } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuthibitisha.");
    } finally {
      setBusyId(null);
    }
  };

  const submitReview = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      await createReview({ booking_id: id, rating: rating[id] || 5, comment: comment[id] || "" });
      setRows((cur) => cur.map((r) => (r.id === id ? { ...r, reviewed: true } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuweka tathmini.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen pb-24 overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #2E1A0F" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Risiti</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Maombi yaliyokubaliwa. Pesa hazikatwi hapa.</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {loading && <p className="text-center py-10" style={{ color: "#5C4033" }}>Inapakia...</p>}
        {error && <p className="text-sm text-center py-2 font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
        {!loading && rows.length === 0 && <p className="text-center py-16 font-heading" style={{ color: "#2E1A0F" }}>Hakuna risiti. Kubali ombi kwanza.</p>}
        {rows.map((r) => (
          <div key={r.id} className="market-card p-5">
            <p className="text-[10px] font-bold uppercase" style={{ color: "#8B5E3C" }}>
              {r.status === "moved_in" ? "Imehamia" : "Imekubaliwa"}
            </p>
            <h2 className="font-heading mt-1" style={{ color: "#2E1A0F" }}>{r.title}</h2>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>{r.location}</p>
            <p className="text-lg font-heading mt-2" style={{ color: "#2E1A0F" }}>
              TZS {r.price ? formatPrice(r.price) : "—"}
              <span className="text-sm font-normal" style={{ color: "#5C4033" }}> {periodLabel(r.period || "")}</span>
            </p>
            <p className="text-xs mt-2" style={{ color: "#8B5E3C" }}>Nambari: {r.id.slice(0, 8)}</p>
            {r.status === "accepted" && (
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => confirmMoveIn(r.id)}
                className="btn-primary w-full mt-4 py-2.5 rounded-[14px] text-sm font-semibold"
                style={{ opacity: busyId === r.id ? 0.7 : 1 }}
              >
                Nimehamia
              </button>
            )}
            {r.status === "moved_in" && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "#5E7F4F" }}>Imehamia</p>
                <p className="text-sm" style={{ color: "#5C4033" }}>10% imerekodiwa, haijakatwa.</p>
                {r.reviewed ? (
                  <p className="text-sm font-semibold" style={{ color: "#8B5E3C" }}>Tathmini imewasilishwa</p>
                ) : (
                  <div className="pt-2">
                    <p className="text-xs font-semibold mb-2" style={{ color: "#2E1A0F" }}>Tathmini</p>
                    <div className="flex gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating((cur) => ({ ...cur, [r.id]: n }))}
                          className="w-9 h-9 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: (rating[r.id] || 5) >= n ? "#2E1A0F" : "white",
                            color: (rating[r.id] || 5) >= n ? "#FFF6ED" : "#2E1A0F",
                            border: "1px solid #2E1A0F",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <input
                      value={comment[r.id] || ""}
                      onChange={(e) => setComment((cur) => ({ ...cur, [r.id]: e.target.value }))}
                      placeholder="Maelezo (si lazima)"
                      className="input-chocolate w-full px-3 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => submitReview(r.id)}
                      className="btn-secondary w-full mt-2 py-2.5 rounded-[14px] text-sm font-semibold"
                    >
                      Tuma tathmini
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
