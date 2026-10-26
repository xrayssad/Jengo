"use client";

import { ArrowLeft, Gavel } from "lucide-react";
import Link from "next/link";

export default function MnadaPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>Auction</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Not in Jengo now</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Gavel size={40} color="var(--caramel)" className="mx-auto mb-3 opacity-60" />
        <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>This service has not started</p>
        <p className="text-sm mt-1 mb-4" style={{ color: "var(--muted)" }}>
          Jengo is rooms, houses, apartments, stores and shop frames.
        </p>
        <Link
          href="/home"
          className="btn-primary inline-block px-6 py-3 rounded-full text-sm font-semibold"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
