"use client";

import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";

export default function SavedPage() {
  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>Saved photos</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Listing photos</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="text-center py-20">
          <Bookmark size={48} color="var(--caramel)" className="mx-auto mb-4 opacity-50" />
          <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>No photos yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Saved listing photos will appear here.
          </p>
        </div>
      </div>
    </main>
  );
}
