"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { fetchListing, formatPrice, periodLabel, catLabel, listingUnit, unitLabel, type Listing } from "@/lib/api";
import SaveButton from "@/components/SaveButton";
import SocialActions from "@/components/SocialActions";

export default function DetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState("1");

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
      {loading && <div className="flex justify-center py-24"><Loader2 size={28} color="#8B5E3C" className="animate-spin" /></div>}
      {!loading && error && (
        <div className="text-center py-16 px-5">
          <p className="font-heading mb-2" style={{ color: "#A6452E" }}>{error}</p>
          <Link href="/discover" className="text-sm font-semibold" style={{ color: "#8B5E3C" }}>Rudi Discover</Link>
        </div>
      )}
      {!loading && item && (
        <>
          <div className="relative">
            {item.images?.[0] ? (
              <img src={item.images[0]} alt="" className="w-full h-[52vh] object-cover" />
            ) : (
              <div className="w-full h-[52vh] flex items-center justify-center" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
                <span className="font-heading" style={{ color: "#D2A679" }}>{catLabel[item.category || ""] || "Jengo"}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,246,237,0.92)", border: "1px solid rgba(46,26,15,0.15)" }}
            >
              <ArrowLeft size={18} color="#2E1A0F" />
            </button>
            <div className="absolute top-4 right-4">
              <SaveButton
                item={item}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,246,237,0.92)", border: "1px solid rgba(46,26,15,0.15)" }}
              />
            </div>
          </div>
          <div className="max-w-md mx-auto px-5 -mt-6 relative z-10">
            <div className="soft-card p-5">
              <h1 className="font-heading text-2xl leading-snug" style={{ color: "#2E1A0F" }}>{item.title}</h1>
              <p className="flex items-center gap-1.5 mt-2 text-sm" style={{ color: "#5C4033" }}>
                <MapPin size={14} color="#8B5E3C" />
                {[item.location, item.city].filter(Boolean).join(", ")}
              </p>
              <p className="mt-3 font-semibold text-lg" style={{ color: "#2E1A0F" }}>
                TZS {formatPrice(item.price)}
                <span className="text-sm font-normal" style={{ color: "#5C4033" }}>
                  {item.category === "vifaa"
                    ? (listingUnit(item) ? ` / ${unitLabel(listingUnit(item))}` : "")
                    : periodLabel(item.period)}
                </span>
              </p>
              {item.category === "vifaa" && item.stock != null && (
                <p className="text-sm mt-1" style={{ color: "#8B5E3C" }}>Stock: {item.stock}</p>
              )}
              <div className="mt-4">
                <SocialActions item={item} />
              </div>
            </div>
            <p className="text-sm leading-relaxed mt-6 whitespace-pre-wrap" style={{ color: "#5C4033" }}>
              {item.description?.trim() || "Hakuna maelezo ya ziada."}
            </p>
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-30 px-5 py-3" style={{ backgroundColor: "rgba(255,246,237,0.96)", borderTop: "1px solid rgba(210,166,121,0.35)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <div className="max-w-md mx-auto">
              {item.category === "vifaa" && (
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                  placeholder="Kiasi"
                  className="input-chocolate w-full mb-2 px-4 py-2.5 text-sm"
                />
              )}
              <Link
                href={`/tuma-ombi?listing=${item.id}&title=${encodeURIComponent(item.title)}&category=${encodeURIComponent(item.category || "")}&qty=${encodeURIComponent(qty)}`}
                className="btn-primary flex items-center justify-center w-full py-3.5 rounded-full text-sm font-semibold"
              >
                Tuma ombi
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
