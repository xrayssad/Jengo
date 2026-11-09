"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { fetchBookings, fetchListing, type Booking } from "@/lib/api";

type Row = Booking & { title?: string };

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      const out: Row[] = [];
      try {
        const res = await fetchBookings(undefined, "sent");
        for (const b of res.items || []) {
          let title = "Listing";
          try {
            title = (await fetchListing(b.listing_id)).title;
          } catch {}
          out.push({ ...b, title });
        }
      } catch {}
      if (!stop) {
        setRows(out);
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <AuthGate>
      <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
        <header className="topbar">
          <div className="canvas-read flex items-center gap-3 px-5">
            <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} color="var(--ink)" />
            </Link>
            <div className="min-w-0">
              <h1 className="page-title">My requests</h1>
              <p className="page-note">Sent by you</p>
            </div>
          </div>
        </header>
        <div className="canvas-read px-5 pt-6 space-y-3">
          {loading && <p className="text-center py-10" style={{ color: "var(--muted)" }}>Loading...</p>}
          {!loading && rows.length === 0 && (
            <div className="empty-panel">
              <p className="lead">You have not sent a request yet</p>
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className="sheet rounded-[28px] p-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>{r.title}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{r.message || "No message"}</p>
              <p className="text-xs mt-2 font-semibold" style={{ color: "var(--mocha)" }}>{r.status || "pending"}</p>
              {r.status === "accepted" && (
                <Link href={`/bookings/${r.id}/chat`} className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm">
                  <Send size={15} /> Write a message
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>
    </AuthGate>
  );
}
