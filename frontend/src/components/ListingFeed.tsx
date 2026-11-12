"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useListings } from "@/lib/useListings";
import ListingBrowse from "./ListingBrowse";

function asList(category: string | string[]) {
  const raw = Array.isArray(category) ? category : [category];
  return raw.map((c) => String(c || "").trim()).filter(Boolean);
}

export default function ListingFeed({
  title,
  subtitle,
  category,
}: {
  title: string;
  subtitle: string;
  category: string | string[];
}) {
  const t = useT();
  const cats = asList(category);
  const { items, setItems, loading, error } = useListings({
    status: "active",
    category: cats.join(","),
    limit: 40,
  });

  useEffect(() => {
    const onLike = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as { listing_id?: string; likes_count?: number };
      if (!d.listing_id || typeof d.likes_count !== "number") return;
      setItems((cur) => cur.map((item) => (item.id === d.listing_id ? { ...item, likes_count: d.likes_count } : item)));
    };
    window.addEventListener("jengo-like", onLike);
    return () => window.removeEventListener("jengo-like", onLike);
  }, []);

  return (
    <main className="min-h-screen pb-4" style={{ backgroundColor: "var(--bg)" }}>
      <header className="topbar">
        <div className="canvas flex items-center gap-3 px-4">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label={t("back")}>
            <ArrowLeft size={18} color="currentColor" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">{title}</h1>
            <p className="page-note">{subtitle}</p>
          </div>
        </div>
      </header>
      <div className="canvas px-4 pt-6">
        <ListingBrowse items={items} loading={loading} error={error} />
      </div>
    </main>
  );
}
