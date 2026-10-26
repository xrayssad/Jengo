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
        <header className="sticky top-0 z-20 px-5 py-4 glass">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
              <ArrowLeft size={18} color="var(--ink)" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>My requests</h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Sent by you</p>
            </div>
          </div>
        </header>
        <div className="max-w-md mx-auto px-5 pt-5 space-y-3">
          {loading && <p className="text-center py-10" style={{ color: "var(--muted)" }}>Loading...</p>}
          {!loading && rows.length === 0 && <p className="text-center py-16 font-heading text-2xl" style={{ color: "var(--ink)" }}>You have not sent a request yet</p>}
          {rows.map((r) => (
            <div key={r.id} className="sheet rounded-[28px] p-5">
              <h2 className="font-heading" style={{ color: "var(--ink)" }}>{r.title}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{r.message || "No message"}</p>
              <p className="text-xs mt-2 font-semibold" style={{ color: "var(--mocha)" }}>{r.status || "pending"}</p>
              {r.status === "accepted" && (
                <Link href={`/bookings/${r.id}/chat`} className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold">
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
