"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, MapPin, BadgeCheck, Heart, TrendingUp, Sparkles, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchListings, formatPrice, periodLabel, type Listing } from "@/lib/api";

const tabs = [
  { id: "latest", label: "Mpya", icon: Clock },
  { id: "popular", label: "Maarufu", icon: Sparkles },
  { id: "trending", label: "Zinazovuma", icon: TrendingUp },
];

const catLabel: Record<string, string> = {
  chumba_nyumba: "Chumba & Nyumba",
  apartment_airbnb: "Apartment & Airbnb",
  store_godown: "Store & Godown",
  frame: "Frame za Maduka",
};

export default function DiscoverPage() {
  const [tab, setTab] = useState("latest");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchListings({ status: "active" });
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
  }, []);

  const shown = useMemo(() => {
    const list = [...items];
    if (tab === "latest") {
      list.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    } else if (tab === "popular" || tab === "trending") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }
    return list;
  }, [items, tab]);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{
        backgroundColor: "rgba(255,246,237,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(210,166,121,0.4)",
      }}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
              <ArrowLeft size={18} color="#2E1A0F" />
            </Link>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Discover</h1>
              <p className="text-xs" style={{ color: "#5C4033" }}>
                {loading ? "Inapakia..." : `${items.length} matangazo`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-xs font-semibold"
                  style={{
                    backgroundColor: active ? "#2E1A0F" : "white",
                    color: active ? "#FFF6ED" : "#2E1A0F",
                    border: active ? "none" : "1.5px solid #3D2415",
                  }}>
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={32} color="#8B5E3C" className="animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-sm py-10" style={{ color: "#A6452E" }}>{error}</p>
        )}

        {!loading && !error && shown.length === 0 && (
          <div className="text-center py-16">
            <Sparkles size={40} color="#D2A679" className="mx-auto mb-3 opacity-60" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna matangazo bado</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "#5C4033" }}>Wewe wa kwanza kuweka!</p>
            <Link href="/weka-tangazo" className="inline-block px-6 py-3 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
              Weka Tangazo
            </Link>
          </div>
        )}

        {!loading &&
          shown.map((item) => (
            <Link
              key={item.id}
              href={`/tangazo/${item.id}`}
              className="flex gap-3 p-3 rounded-[18px] block"
              style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
            >
              <div className="w-24 h-24 rounded-[14px] shrink-0 flex items-center justify-center"
                style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
                <span className="text-[9px] font-bold text-center px-1" style={{ color: "#D2A679" }}>
                  {catLabel[item.category || ""] || item.category || "Jengo"}
                </span>
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                {item.verified && (
                  <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: "#8B5E3C" }}>
                    <BadgeCheck size={11} /> Amethibitishwa
                  </span>
                )}
                <h3 className="font-bold text-sm truncate" style={{ color: "#2E1A0F" }}>{item.title}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={11} color="#8B5E3C" />
                  <span className="text-xs truncate" style={{ color: "#5C4033" }}>
                    {item.location || item.city || "—"}
                  </span>
                </div>
                <p className="font-bold text-sm mt-1.5" style={{ color: "#2E1A0F" }}>
                  TZS {formatPrice(item.price)}
                  <span className="text-xs font-normal" style={{ color: "#5C4033" }}>
                    {" "}{periodLabel(item.period)}
                  </span>
                </p>
              </div>
              <span className="self-start p-1.5">
                <Heart size={18} color="#8B5E3C" />
              </span>
            </Link>
          ))}
      </div>
    </main>
  );
}
