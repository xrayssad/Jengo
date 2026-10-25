"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Tag, FileText, Loader2, MessageSquare } from "lucide-react";
import { fetchListing, formatPrice, periodLabel, catLabel, type Listing } from "@/lib/api";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";

export default function DetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchListing(id);
        if (!stop) setItem(data);
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : "Haipatikani");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [id]);

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3" style={{ backgroundColor: "rgba(255,246,237,0.92)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
          <ArrowLeft size={18} color="#2E1A0F" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "#2E1A0F" }}>{item?.title || "Tangazo"}</h1>
          <p className="text-[11px]" style={{ color: "#8B5E3C" }}>{item ? catLabel[item.category || ""] || item.category : "…"}</p>
        </div>
        
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        {loading && <div className="flex justify-center py-20"><Loader2 size={32} color="#8B5E3C" className="animate-spin" /></div>}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="font-bold mb-2" style={{ color: "#A6452E" }}>{error}</p>
            <Link href="/discover" className="text-sm font-semibold" style={{ color: "#8B5E3C" }}>Rudi Discover</Link>
          </div>
        )}
        {!loading && item && (
          <>
            {item.images?.[0] ? (
              <img src={item.images[0]} alt="" className="w-full rounded-[24px] mb-4 object-cover" style={{ height: 220 }} />
            ) : (
              <div className="w-full rounded-[24px] mb-4 flex items-center justify-center" style={{ height: 220, background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
                <span className="text-sm font-bold" style={{ color: "#D2A679" }}>{catLabel[item.category || ""] || "Jengo"}</span>
              </div>
            )}
            <h2 className="text-xl font-bold mb-1" style={{ color: "#2E1A0F" }}>{item.title}</h2>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={14} color="#8B5E3C" />
              <span className="text-sm" style={{ color: "#5C4033" }}>{item.location}{item.city ? `, ${item.city}` : ""}</span>
            </div>
            <div className="p-4 rounded-[18px] mb-5" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
              <div className="flex items-center gap-2">
                <Tag size={18} color="#8B5E3C" />
                <p className="text-lg font-bold" style={{ color: "#2E1A0F" }}>
                  TZS {formatPrice(item.price)}
                  <span className="text-sm font-normal" style={{ color: "#5C4033" }}> {periodLabel(item.period)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 mb-5">
              <LikeButton id={item.id} count={item.likes_count} />
              <SaveButton item={item} />
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} color="#8B5E3C" />
                <h3 className="text-sm font-bold" style={{ color: "#2E1A0F" }}>Maelezo</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#5C4033" }}>{item.description?.trim() || "Hakuna maelezo ya ziada."}</p>
            </div>
          </>
        )}
      </div>

      {!loading && item && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3" style={{ backgroundColor: "rgba(255,246,237,0.97)", borderTop: "1px solid rgba(210,166,121,0.4)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="max-w-md mx-auto flex gap-3">
            <Link href={`/tuma-ombi?listing=${item.id}&title=${encodeURIComponent(item.title)}`} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] font-semibold text-sm" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
              <MessageSquare size={18} />
              Tuma Ombi
            </Link>
            <Link href={`/chat/${item.id}?title=${encodeURIComponent(item.title)}`} className="flex items-center justify-center px-4 rounded-[16px] font-semibold text-sm" style={{ border: "1.5px solid #3D2415", color: "#2E1A0F", backgroundColor: "white" }}>
              Ujumbe
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
