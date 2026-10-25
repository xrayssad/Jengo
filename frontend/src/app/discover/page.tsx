"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, MessageCircle, Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import SaveImageButton from "@/components/SaveImageButton";
import { fetchListings, formatPrice, periodLabel, catLabel, type Listing } from "@/lib/api";

export default function DiscoverPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"mpya" | "maarufu">("mpya");

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const res = await fetchListings({ status: "active", sort: sort === "maarufu" ? "likes" : "new" });
      if (!stop) {
        setItems(res.items || []);
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [sort]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = items.filter((item) => {
      if (!needle) return true;
      return [item.title, item.location, item.city, item.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    return list;
  }, [items, q, sort]);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto">
          <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Discover</h1>
          <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-[16px]" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <Search size={16} color="#8B5E3C" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta jina au eneo" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#2E1A0F" }} />
          </div>
          <div className="flex gap-2 mt-3">
            {(["mpya", "maarufu"] as const).map((key) => (
              <button key={key} type="button" onClick={() => setSort(key)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: sort === key ? "#2E1A0F" : "white", color: sort === key ? "#FFF6ED" : "#2E1A0F", border: "1px solid #D2A679" }}>
                {key === "mpya" ? "Mpya" : "Maarufu"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-6 space-y-5">
        {loading && <div className="flex justify-center py-16"><Loader2 className="animate-spin" color="#8B5E3C" /></div>}
        {!loading && shown.length === 0 && <p className="text-center py-16 font-bold" style={{ color: "#2E1A0F" }}>Hakuna tangazo</p>}
        {shown.map((item) => (
          <div key={item.id} className="market-card p-5">
            <Link href={`/tangazo/${item.id}`} className="block">
              {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-40 object-cover rounded-[14px] mb-3" />}
              <p className="text-[10px] font-bold uppercase" style={{ color: "#8B5E3C" }}>{catLabel[item.category || ""] || item.category}</p>
              <h2 className="font-heading mt-1" style={{ color: "#2E1A0F" }}>{item.title}</h2>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} color="#8B5E3C" />
                <span className="text-xs" style={{ color: "#5C4033" }}>{item.location}{item.city ? `, ${item.city}` : ""}</span>
              </div>
              <p className="font-bold mt-2" style={{ color: "#2E1A0F" }}>
                TZS {formatPrice(item.price)}
                <span className="text-xs font-normal" style={{ color: "#5C4033" }}> {periodLabel(item.period)}</span>
              </p>
            </Link>
            <div className="flex items-center gap-5 mt-3">
              <LikeButton id={item.id} count={item.likes_count} />
              <SaveButton item={item} />
              <SaveImageButton id={item.id} title={item.title} url={item.images?.[0]} />
              <Link href={`/chat/${item.id}?title=${encodeURIComponent(item.title)}`} aria-label="Ujumbe">
                <MessageCircle size={22} color="#2E1A0F" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
