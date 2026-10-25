"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { fetchBookings, fetchListing, formatPrice, periodLabel, setBookingStatus } from "@/lib/api";
import { readIds } from "@/lib/mine";

type Row = {
  id: string;
  title: string;
  price?: number;
  period?: string;
  location?: string;
  message?: string;
  status?: string;
};

export default function RisitiPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      const out: Row[] = [];
      for (const id of readIds()) {
        try {
          const item = await fetchListing(id);
          const res = await fetchBookings(id);
          for (const b of res.items || []) {
            if (b.status === "accepted" || b.status === "moved_in") {
              out.push({
                id: b.id,
                title: item.title,
                price: Number(item.price),
                period: item.period,
                location: item.location,
                message: b.message,
                status: b.status,
              });
            }
          }
        } catch {}
      }
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

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Risiti</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Maombi yaliyokubaliwa. Pesa hazikatwi hapa.</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {loading && <p className="text-center py-10" style={{ color: "#5C4033" }}>Inapakia...</p>}
        {error && <p className="text-sm text-center py-2 font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
        {!loading && rows.length === 0 && <p className="text-center py-16 font-bold" style={{ color: "#2E1A0F" }}>Hakuna risiti. Kubali ombi kwanza.</p>}
        {rows.map((r) => (
          <div key={r.id} className="p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: "#8B5E3C" }}>
              {r.status === "moved_in" ? "Imehamia" : "Imekubaliwa"}
            </p>
            <h2 className="font-bold mt-1" style={{ color: "#2E1A0F" }}>{r.title}</h2>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>{r.location}</p>
            <p className="text-lg font-bold mt-2" style={{ color: "#2E1A0F" }}>
              TZS {r.price ? formatPrice(r.price) : "—"}
              <span className="text-sm font-normal" style={{ color: "#5C4033" }}> {periodLabel(r.period || "")}</span>
            </p>
            <p className="text-xs mt-2" style={{ color: "#8B5E3C" }}>Nambari: {r.id.slice(0, 8)}</p>
            {r.status === "accepted" && (
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => confirmMoveIn(r.id)}
                className="w-full mt-3 py-2.5 rounded-[14px] text-sm font-semibold"
                style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED", opacity: busyId === r.id ? 0.7 : 1 }}
              >
                Nimehamia
              </button>
            )}
            {r.status === "moved_in" && (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold" style={{ color: "#5E7F4F" }}>Imehamia</p>
                <p className="text-sm" style={{ color: "#5C4033" }}>10% imerekodiwa, haijakatwa.</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
