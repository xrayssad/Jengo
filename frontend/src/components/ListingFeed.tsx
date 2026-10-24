"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { fetchListings, formatPrice, periodLabel, catLabel, type Listing } from "@/lib/api";
import FavoriteButton from "@/components/FavoriteButton";

export default function ListingFeed({
  title,
  subtitle,
  category,
}: {
  title: string;
  subtitle: string;
  category: string;
}) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const res = await fetchListings({ category, status: "active" });
      if (!stop) {
        setItems(res.items || []);
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [category]);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header
        className="sticky top-0 z-20 px-4 py-3.5"
        style={{
          backgroundColor: "rgba(255,246,237,0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(210,166,121,0.35)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link
            href="/home"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}
          >
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>{title}</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>{subtitle}</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} color="#8B5E3C" className="animate-spin" />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna matangazo bado</p>
            <Link href="/weka-tangazo" className="inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
              Weka Tangazo
            </Link>
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="relative p-4 rounded-[18px]"
            style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
          >
            <div className="absolute top-3 right-3 z-10">
              <FavoriteButton id={item.id} size={18} />
            </div>
          <Link
            href={`/tangazo/${item.id}`}
            className="block"
          >
            {item.images?.[0] && (
              <img src={item.images[0]} alt="" className="w-full h-40 object-cover rounded-[14px] mb-3" />
            )}
            <p className="text-[10px] font-bold uppercase" style={{ color: "#8B5E3C" }}>
              {catLabel[item.category || ""] || item.category}
            </p>
            <h2 className="font-bold mt-1" style={{ color: "#2E1A0F" }}>{item.title}</h2>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} color="#8B5E3C" />
              <span className="text-xs" style={{ color: "#5C4033" }}>{item.location}{item.city ? `, ${item.city}` : ""}</span>
            </div>
            <p className="font-bold mt-2" style={{ color: "#2E1A0F" }}>
              TZS {formatPrice(item.price)}
              <span className="text-xs font-normal" style={{ color: "#5C4033" }}> {periodLabel(item.period)}</span>
            </p>
          </Link>
          </div>
        ))}
      </div>
          <BottomNav />
    </main>
  );
}
