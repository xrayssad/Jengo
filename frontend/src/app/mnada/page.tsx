"use client";

import { ArrowLeft, Gavel } from "lucide-react";
import Link from "next/link";

export default function MnadaPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Mnada</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Si katika Jengo sasa</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Gavel size={40} color="#D2A679" className="mx-auto mb-3 opacity-60" />
        <p className="font-bold" style={{ color: "#2E1A0F" }}>Huduma hii haijaanza</p>
        <p className="text-sm mt-1 mb-4" style={{ color: "#5C4033" }}>
          Jengo sasa ni chumba, nyumba, apartment, store na frame.
        </p>
        <Link
          href="/home"
          className="inline-block px-6 py-3 rounded-full text-sm font-semibold"
          style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}
        >
          Rudi Home
        </Link>
      </div>
    </main>
  );
}
