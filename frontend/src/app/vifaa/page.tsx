"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ListingBrowse from "@/components/ListingBrowse";
import { useT } from "@/lib/i18n";
import { useListings } from "@/lib/useListings";

export default function VifaaPage() {
  const t = useT();
  const { items, loading, error } = useListings({ category: "vifaa", status: "active", limit: 40 });

  return (
    <main className="min-h-screen pb-4" style={{ backgroundColor: "var(--bg)" }}>
      <header className="topbar">
        <div className="canvas flex items-center gap-3 px-4">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label={t("back")}>
            <ArrowLeft size={18} color="currentColor" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">Building Materials</h1>
            <p className="page-note">Cement, steel, bricks, sand</p>
          </div>
        </div>
      </header>

      <div className="canvas px-4 pt-6">
        <ListingBrowse items={items} loading={loading} error={error} />
      </div>
    </main>
  );
}
