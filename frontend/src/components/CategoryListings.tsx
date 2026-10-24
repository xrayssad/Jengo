"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, BadgeCheck, Heart, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { fetchListings, formatPrice, periodLabel, type Listing } from "@/lib/api";

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
  variant = "cream",
  tabs,
}: Props) {
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
        if (!cancelled) setError("Imeshindikana kupakia. Hakikisha API inaendesha.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const dark = variant === "dark";

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header
        className="sticky top-0 z-20 px-4 py-3.5 glass"
        style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm"
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
            </Link>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>
                {title}
              </h1>
              <p className="text-xs" style={{ color: "#5C4033" }}>
                {loading ? "Inapakia..." : `${items.length} yanapatikana`}
              </p>
            </div>
          </div>
          {tabs}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={32} color="#8B5E3C" className="animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "#A6452E" }}>
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <Icon size={40} color="#D2A679" className="mx-auto mb-3 opacity-60" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>
              Hakuna matangazo bado
            </p>
            <p className="text-sm mt-1 mb-4" style={{ color: "#5C4033" }}>
              Wewe wa kwanza kuweka!
            </p>
            <Link
              href="/weka-tangazo"
              className="inline-block px-6 py-3 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}
            >
              Weka Tangazo
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          items.map((item) => (
            <Link
              key={item.id}
              href={`/tangazo/${item.id}`}
              className="card-lift block rounded-[22px] overflow-hidden"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(210,166,121,0.4)",
                boxShadow: "0 8px 24px rgba(46,26,15,0.08)",
              }}
            >
              <div
                className="relative h-44 flex items-center justify-center overflow-hidden"
                style={{
                  background: dark
                    ? "linear-gradient(165deg, #3D2415, #2E1A0F)"
                    : "linear-gradient(160deg, #FFF6ED 0%, #E8D5B7 100%)",
                }}
              >
                <Icon size={52} color={dark ? "#D2A679" : "#8B5E3C"} strokeWidth={1.35} />
                {item.verified && (
                  <div className="badge-shimmer absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[#FFF6ED]">
                    <BadgeCheck size={13} strokeWidth={2.2} /> Amethibitishwa
                  </div>
                )}
                <div
                  className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "white",
                    boxShadow: "0 2px 10px rgba(46,26,15,0.12)",
                  }}
                >
                  <Heart size={16} color="#8B5E3C" strokeWidth={2} />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-[15px] leading-snug" style={{ color: "#2E1A0F" }}>
                    {item.title}
                  </h3>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[15px]" style={{ color: "#2E1A0F" }}>
                      TZS {formatPrice(item.price)}
                    </p>
                    <p className="text-xs" style={{ color: "#5C4033" }}>
                      {periodLabel(item.period)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <MapPin size={13} color="#8B5E3C" strokeWidth={2} />
                  <span className="text-xs" style={{ color: "#5C4033" }}>
                    {item.location || item.city || "—"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </main>
  );
}
