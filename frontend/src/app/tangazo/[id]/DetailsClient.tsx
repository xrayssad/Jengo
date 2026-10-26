"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2, Phone } from "lucide-react";
import { fetchListing, formatPrice, periodLabel, catLabel, listingUnit, unitLabel, listingPhones, phoneTelHref, phoneWaHref, type Listing } from "@/lib/api";
import SaveButton from "@/components/SaveButton";
import SocialActions from "@/components/SocialActions";
import PhotoGallery from "@/components/PhotoGallery";

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

  const specs = item
    ? [
        { label: "Aina", value: catLabel[item.category || ""] || item.category || "—" },
        {
          label: item.category === "vifaa" ? "Kipimo" : "Kipindi",
          value: item.category === "vifaa" ? (unitLabel(listingUnit(item)) || "—") : (periodLabel(item.period) || "—"),
        },
        item.category === "vifaa" && item.stock != null
          ? { label: "Stock", value: String(item.stock) }
          : { label: "Hali", value: "Inapatikana" },
      ]
    : [];

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
            <PhotoGallery
              images={item.images}
              fallback={
                <div className="w-full flex items-center justify-center" style={{ height: "78vh", minHeight: 420, background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
                  <span className="font-heading text-2xl" style={{ color: "#D2A679" }}>{catLabel[item.category || ""] || "Jengo"}</span>
                </div>
              }
            />
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center icon-glass"
            >
              <ArrowLeft size={18} color="#2E1A0F" />
            </button>
            <div className="absolute top-4 right-4 z-20">
              <SaveButton
                item={item}
                className="w-10 h-10 rounded-full flex items-center justify-center icon-glass"
              />
            </div>
          </div>
          <div className="max-w-md mx-auto px-4 -mt-14 relative z-10">
            <div className="sheet rounded-[28px] p-5">
              <h1 className="font-heading text-[32px] leading-[1.05]" style={{ color: "#2E1A0F" }}>{item.title}</h1>
              <p className="flex items-center gap-1.5 mt-2 text-sm" style={{ color: "#5C4033" }}>
                <MapPin size={14} color="#8B5E3C" />
                {[item.location, item.city].filter(Boolean).join(", ") || "—"}
              </p>
              <p className="mt-3 font-heading text-3xl leading-none" style={{ color: "#2E1A0F" }}>
                TZS {formatPrice(item.price)}
                <span className="text-sm font-normal ml-1" style={{ color: "#5C4033" }}>
                  {item.category === "vifaa"
                    ? (listingUnit(item) ? ` / ${unitLabel(listingUnit(item))}` : "")
                    : periodLabel(item.period)}
                </span>
              </p>
              <div className="flex gap-2 mt-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="spec-pill flex-1">
                    <p className="text-[11px]" style={{ color: "#8B5E3C" }}>{spec.label}</p>
                    <p className="text-sm mt-0.5" style={{ color: "#2E1A0F" }}>{spec.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <SocialActions item={item} />
              </div>
            </div>
            {listingPhones(item).length > 0 && (
              <div className="sheet rounded-[28px] p-5 mt-4">
                <p className="text-sm" style={{ color: "#8B5E3C" }}>Mawasiliano</p>
                <div className="mt-3 space-y-2">
                  {listingPhones(item).map((n) => (
                    <div key={n} className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm" style={{ color: "#2E1A0F" }}>
                        <Phone size={14} color="#8B5E3C" />
                        {n}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <a href={phoneTelHref(n)} className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
                          Piga
                        </a>
                        <a href={phoneWaHref(n)} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full" style={{ border: "1px solid #C4A35A", color: "#2E1A0F" }}>
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="sheet rounded-[28px] p-5 mt-4">
              <p className="text-sm" style={{ color: "#8B5E3C" }}>Maelezo</p>
              <p className="text-sm leading-relaxed mt-2 whitespace-pre-wrap" style={{ color: "#5C4033" }}>
                {(listingPhones(item).length
                  ? item.description?.replace(/\n*Simu:\s*.+$/m, "").trim()
                  : item.description?.trim()) || "Hakuna maelezo ya ziada."}
              </p>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <div className="nav-island max-w-md mx-auto px-4 py-3">
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
