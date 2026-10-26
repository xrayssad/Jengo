"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { fetchBookings, fetchListing, setBookingStatus, type Booking } from "@/lib/api";

type Row = Booking & { title?: string };

export default function IncomingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const out: Row[] = [];
    try {
      const res = await fetchBookings(undefined, "incoming");
      for (const b of res.items || []) {
          let title = "Listing";
        try {
          title = (await fetchListing(b.listing_id)).title;
        } catch {}
        out.push({ ...b, title });
      }
    } catch {}
    setRows(out);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "accepted" | "rejected") => {
    await setBookingStatus(id, status);
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <AuthGate>
    <main className="min-h-screen pb-24 overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "#2E1A0F" }}>Requests I received</h1>
            <p className="text-sm" style={{ color: "#5C4033" }}>Accept or decline</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {loading && <p className="text-center py-10" style={{ color: "#5C4033" }}>Loading...</p>}
        {!loading && rows.length === 0 && <p className="text-center py-16 font-heading" style={{ color: "#2E1A0F" }}>No requests</p>}
        {rows.map((r) => (
          <div key={r.id} className="sheet rounded-[28px] p-5">
            <h2 className="font-heading" style={{ color: "#2E1A0F" }}>{r.title}</h2>
            {r.quantity != null && (
              <p className="text-sm mt-1 font-semibold" style={{ color: "#8B5E3C" }}>Quantity: {r.quantity}</p>
            )}
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>{r.message || "No message"}</p>
            <p className="text-xs mt-2 font-semibold" style={{ color: "#8B5E3C" }}>{r.status || "pending"}</p>
            {r.status !== "accepted" && r.status !== "rejected" && r.status !== "moved_in" && (
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => decide(r.id, "accepted")} className="btn-primary flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[14px] text-sm font-semibold">
                  <Check size={16} /> Accept
                </button>
                <button type="button" onClick={() => decide(r.id, "rejected")} className="btn-secondary flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[14px] text-sm font-semibold">
                  <X size={16} /> Decline
                </button>
              </div>
            )}
            {r.status === "accepted" && (
              <Link href={`/bookings/${r.id}/chat`} className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold">
                Write a message
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
    </AuthGate>
  );
}
