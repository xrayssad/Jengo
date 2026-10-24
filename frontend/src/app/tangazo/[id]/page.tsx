"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, BadgeCheck, Tag, FileText,
  Loader2, MessageSquare, Share2
} from "lucide-react";
import {
  fetchListing, formatPrice, periodLabel, catLabel, type Listing
} from "@/lib/api";

export default function TangazoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchListing(id);
        if (!cancelled) setItem(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Haipatikani");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: "#FFF6ED" }}>
      <header
        className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3"
        style={{
          backgroundColor: "rgba(255,246,237,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(210,166,121,0.35)",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}
        >
          <ArrowLeft size={18} color="#2E1A0F" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "#2E1A0F" }}>
            {item?.title || "Tangazo"}
          </h1>
          <p className="text-[11px]" style={{ color: "#8B5E3C" }}>
            {item ? catLabel[item.category || ""] || item.category : "…"}
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} color="#8B5E3C" className="animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="font-bold mb-2" style={{ color: "#A6452E" }}>{error}</p>
            <Link href="/discover" className="text-sm font-semibold" style={{ color: "#8B5E3C" }}>
              Rudi Discover
            </Link>
          </div>
        )}

        {!loading && item && (
          <>
            {/* Image placeholder */}
            <div
              className="relative w-full rounded-[24px] overflow-hidden mb-4 flex items-center justify-center"
              style={{
                height: 220,
                background: "linear-gradient(165deg, #3D2415, #2E1A0F)",
                boxShadow: "0 12px 36px rgba(46,26,15,0.2)",
              }}
            >
              <span className="text-sm font-bold px-4 text-center" style={{ color: "#D2A679" }}>
                {catLabel[item.category || ""] || "Jengo"}
              </span>
              {item.verified && (
                <span
                  className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(210,166,121,0.95)", color: "#2E1A0F" }}
                >
                  <BadgeCheck size={12} /> Amethibitishwa
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ color: "#2E1A0F" }}>
              {item.title}
            </h2>

            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={14} color="#8B5E3C" />
              <span className="text-sm" style={{ color: "#5C4033" }}>
                {item.location}
                {item.city ? `, ${item.city}` : ""}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-4 rounded-[18px] mb-5"
              style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
            >
              <div className="flex items-center gap-2">
                <Tag size={18} color="#8B5E3C" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "#8B5E3C" }}>Bei</p>
                  <p className="text-lg font-bold" style={{ color: "#2E1A0F" }}>
                    TZS {formatPrice(item.price)}
                    <span className="text-sm font-normal" style={{ color: "#5C4033" }}>
                      {" "}{periodLabel(item.period)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} color="#8B5E3C" />
                <h3 className="text-sm font-bold" style={{ color: "#2E1A0F" }}>Maelezo</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#5C4033" }}>
                {item.description?.trim() || "Hakuna maelezo ya ziada."}
              </p>
            </div>

            <p className="text-[11px] mb-4" style={{ color: "#8B5E3C" }}>
              Imewekwa: {item.created_at ? new Date(item.created_at).toLocaleDateString("sw-TZ") : "—"}
            </p>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      {!loading && item && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3"
          style={{
            backgroundColor: "rgba(255,246,237,0.97)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(210,166,121,0.4)",
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="max-w-md mx-auto flex gap-3">
            <Link
              href={`/tuma-ombi?listing=${item.id}&title=${encodeURIComponent(item.title)}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] font-semibold text-sm"
              style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}
            >
              <MessageSquare size={18} />
              Tuma Ombi
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
