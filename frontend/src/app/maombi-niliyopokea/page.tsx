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
    <main className="min-h-screen pb-24 overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">Requests I received</h1>
            <p className="page-note">Accept or decline</p>
          </div>
        </div>
      </header>
      <div className="canvas-read px-5 pt-6 space-y-4">
        {loading && <p className="text-center py-10" style={{ color: "var(--muted)" }}>Loading...</p>}
        {!loading && rows.length === 0 && (
          <div className="empty-panel">
            <p className="lead">No requests</p>
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="sheet rounded-[28px] p-5">
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>{r.title}</h2>
            {r.quantity != null && (
              <p className="text-sm mt-1 font-semibold" style={{ color: "var(--mocha)" }}>Quantity: {r.quantity}</p>
            )}
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{r.message || "No message"}</p>
            <p className="text-xs mt-2 font-semibold" style={{ color: "var(--mocha)" }}>{r.status || "pending"}</p>
            {r.status !== "accepted" && r.status !== "rejected" && r.status !== "moved_in" && (
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => decide(r.id, "accepted")} className="btn-primary flex-1 flex items-center justify-center gap-1 py-2.5 text-sm">
                  <Check size={16} /> Accept
                </button>
                <button type="button" onClick={() => decide(r.id, "rejected")} className="btn-secondary flex-1 flex items-center justify-center gap-1 py-2.5 text-sm">
                  <X size={16} /> Decline
                </button>
              </div>
            )}
            {r.status === "accepted" && (
              <Link href={`/bookings/${r.id}/chat`} className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm">
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
