"use client";

import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";

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
            <p className="text-xs" style={{ color: "#5C4033" }}>Picha za tangazo</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="text-center py-20">
          <Bookmark size={48} color="#D2A679" className="mx-auto mb-4 opacity-50" />
          <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna picha bado</p>
          <p className="text-sm mt-1" style={{ color: "#5C4033" }}>
            Upload ya picha itakuja baadaye.
          </p>
        </div>
      </div>
    </main>
  );
}
