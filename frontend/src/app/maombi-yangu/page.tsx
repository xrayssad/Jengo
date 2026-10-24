"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readBookings, type SavedBooking } from "@/lib/mine";

export default function Page() {
  const [items, setItems] = useState<SavedBooking[]>([]);
  useEffect(() => setItems(readBookings()), []);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Maombi yangu</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Uliyotuma kwenye simu hii</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {items.length === 0 && <p className="text-center py-16 font-bold" style={{ color: "#2E1A0F" }}>Bado hujaweka ombi</p>}
        {items.map((b, i) => (
          <Link key={i} href={`/tangazo/${b.listing_id}`} className="block p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
            <h2 className="font-bold" style={{ color: "#2E1A0F" }}>{b.title || "Tangazo"}</h2>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>{b.message}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
