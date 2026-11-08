"use client";

import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";

export default function SavedPage() {
  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">Saved photos</h1>
            <p className="page-note">Listing photos</p>
          </div>
        </div>
      </header>

      <div className="canvas-read px-5 pt-6">
        <div className="empty-panel">
          <Bookmark size={32} color="var(--caramel)" className="mx-auto mb-3" />
          <p className="lead">No photos yet</p>
          <p className="hint">Saved listing photos will appear here.</p>
        </div>
      </div>
    </main>
  );
}
