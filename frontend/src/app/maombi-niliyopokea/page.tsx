"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { fetchBookings, fetchListing, setBookingStatus, type Booking } from "@/lib/api";
import { readIds } from "@/lib/mine";

type Row = Booking & { title?: string };

export default function IncomingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const out: Row[] = [];
    for (const id of readIds()) {
      let title = "Tangazo";
      try {
        title = (await fetchListing(id)).title;
      } catch {}
      try {
        const res = await fetchBookings(id);
        for (const b of res.items || []) out.push({ ...b, title });
      } catch {}
    }
    setRows(out);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "accepted" | "rejected") => {
    await setBookingStatus(id, status);
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Maombi niliyopokea</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Kubali au kataa</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {loading && <p className="text-center py-10" style={{ color: "#5C4033" }}>Inapakia...</p>}
        {!loading && rows.length === 0 && <p className="text-center py-16 font-bold" style={{ color: "#2E1A0F" }}>Hakuna ombi</p>}
        {rows.map((r) => (
          <div key={r.id} className="p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
            <h2 className="font-bold" style={{ color: "#2E1A0F" }}>{r.title}</h2>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>{r.message || "Hakuna ujumbe"}</p>
            <p className="text-xs mt-2 font-semibold" style={{ color: "#8B5E3C" }}>{r.status || "pending"}</p>
            {r.status !== "accepted" && r.status !== "rejected" && (
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => decide(r.id, "accepted")} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[14px] text-sm font-semibold" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
                  <Check size={16} /> Kubali
                </button>
                <button type="button" onClick={() => decide(r.id, "rejected")} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[14px] text-sm font-semibold" style={{ border: "1.5px solid #3D2415", color: "#2E1A0F" }}>
                  <X size={16} /> Kataa
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
