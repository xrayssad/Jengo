"use client";

import { ArrowLeft, Bookmark, ImageIcon } from "lucide-react";
import Link from "next/link";

const saved = [
  { id: 1, label: "Chumba Kinondoni" },
  { id: 2, label: "Apartment Masaki" },
  { id: 3, label: "Godown Mikocheni" },
  { id: 4, label: "Frame Kariakoo" },
];

export default function SavedPage() {
  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Picha zilizohifadhiwa</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Images ulizohifadhi</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        {saved.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={48} color="#D2A679" className="mx-auto mb-4 opacity-50" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna picha bado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {saved.map((s) => (
              <div
                key={s.id}
                className="rounded-[16px] overflow-hidden aspect-square flex flex-col items-center justify-center gap-2"
                style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)", border: "1px solid rgba(210,166,121,0.2)" }}
              >
                <ImageIcon size={32} color="#D2A679" strokeWidth={1.5} />
                <p className="text-[11px] font-medium px-2 text-center" style={{ color: "#F5E6D3" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
