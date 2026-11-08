"use client";

import { ArrowLeft, Gavel } from "lucide-react";
import Link from "next/link";

export default function MnadaPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">Auction</h1>
            <p className="page-note">Not in Jengo now</p>
          </div>
        </div>
      </header>

      <div className="canvas-read px-5">
        <div className="empty-panel">
          <Gavel size={32} color="var(--caramel)" className="mx-auto mb-3" />
          <p className="lead">This service has not started</p>
          <p className="hint">Jengo is rooms, houses, apartments, stores and shop frames.</p>
          <Link href="/home" className="btn-primary inline-block mt-4 px-6 py-3 text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
