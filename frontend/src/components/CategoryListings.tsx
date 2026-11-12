"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { fetchListings, type Listing } from "@/lib/api";
import ListingBrowse from "@/components/ListingBrowse";
import { useT } from "@/lib/i18n";

type Props = {
  title: string;
  category: string;
  icon: LucideIcon;
  variant?: "cream" | "dark";
  tabs?: React.ReactNode;
};

export default function CategoryListings({
  title,
  category,
  icon: Icon,
  tabs,
}: Props) {
  const t = useT();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchListings({ category, status: "active" });
        if (!cancelled) setItems(res.items || []);
      } catch {
        if (!cancelled) setError("Could not load listings. Check that the API is running.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <main className="min-h-screen pb-4" style={{ backgroundColor: "var(--bg)" }}>
      <header className="topbar">
        <div className="canvas px-4">
          <div className="flex items-center gap-3">
            <Link href="/home" className="soft-icon-btn shrink-0" aria-label={t("back")}>
              <ArrowLeft size={18} strokeWidth={2.2} color="currentColor" />
            </Link>
            <div className="min-w-0">
              <h1 className="page-title flex items-center gap-2">
                <Icon size={18} strokeWidth={1.8} aria-hidden />
                {title}
              </h1>
              <p className="page-note">
                {loading ? "Loading..." : `${items.length} available`}
              </p>
            </div>
          </div>
          {tabs}
        </div>
      </header>

      <div className="canvas px-4 py-6">
        <ListingBrowse items={items} loading={loading} error={error} />
      </div>
    </main>
  );
}
