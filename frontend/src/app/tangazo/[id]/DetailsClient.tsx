"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import {
  catLabel,
  catShort,
  fetchListing,
  formatPrice,
  peekListing,
  listingPhones,
  listingUnit,
  periodLabel,
  phoneTelHref,
  timeAgo,
  unitLabel,
  type Listing,
} from "@/lib/api";
import SaveButton from "@/components/SaveButton";
import SocialActions from "@/components/SocialActions";
import PhotoGallery from "@/components/PhotoGallery";
import PosterName from "@/components/PosterName";
import { DetailSkeleton } from "@/components/Skeletons";

export default function DetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState("1");

  useLayoutEffect(() => {
    const cached = peekListing(id);
    if (!cached) return;
    setItem(cached);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let stop = false;
    const cached = peekListing(id);
    if (!cached) setLoading(true);
    (async () => {
      try {
        const data = await fetchListing(id);
        if (!stop) {
          setItem(data);
          setError("");
        }
      } catch (e) {
        if (!stop && !cached) setError(e instanceof Error ? e.message : "Not available");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [id]);

  const phones = item ? listingPhones(item) : [];
  const callHref = phones[0] ? phoneTelHref(phones[0]) : "";
  const ago = item ? timeAgo(item.created_at) : "";

  const specs = item
    ? [
        {
          label: "Type",
          value: catShort[item.category || ""] || catLabel[item.category || ""] || "—",
        },
        {
          label: item.category === "vifaa" ? "Unit" : "Period",
          value:
            item.category === "vifaa"
              ? unitLabel(listingUnit(item)) || "—"
              : (periodLabel(item.period) || "—").replace(/^\//, "") || "—",
        },
        item.category === "vifaa" && item.stock != null
          ? { label: "Stock", value: String(item.stock) }
          : { label: "Status", value: "Open" },
        item.city || item.location
          ? { label: "Area", value: item.city || String(item.location || "").split(",")[0] || "—" }
          : { label: "Photos", value: String((item.images || []).filter(Boolean).length || 0) },
      ]
    : [];

  const description =
    item &&
    (phones.length
      ? item.description?.replace(/\n*(?:Simu|Phone):\s*.+$/m, "").trim()
      : item.description?.trim());

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: "var(--paper)" }}>
      {loading && <DetailSkeleton />}
      {!loading && error && (
        <div className="text-center py-16 px-5">
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--error)" }}>{error}</p>
          <Link href="/discover" className="text-sm font-semibold" style={{ color: "var(--mocha)" }}>
            Back to Discover
          </Link>
        </div>
      )}
      {!loading && item && (
        <>
          <div className="relative detail-hero">
            <PhotoGallery
              images={item.images}
              fallback={
                <div
                  className="w-full flex items-center justify-center detail-hero-fallback"
                  style={{ background: "linear-gradient(165deg, var(--blush), var(--cream))" }}
                >
                  <span className="text-2xl font-semibold" style={{ color: "var(--mocha)" }}>
                    {catShort[item.category || ""] || "Jengo"}
                  </span>
                </div>
              }
            />
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute top-4 left-4 z-20 soft-icon-btn"
              aria-label="Back"
            >
              <ArrowLeft size={18} color="var(--ink)" />
            </button>
            <div className="absolute top-4 right-4 z-20">
              <SaveButton item={item} variant="heart" size={18} className="heart-fab" />
            </div>
          </div>

          <div className="max-w-md mx-auto px-5 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: "var(--ink)" }}>
                  TZS {formatPrice(item.price)}
                  <span className="text-sm font-medium ml-1.5" style={{ color: "var(--muted)" }}>
                    {item.category === "vifaa"
                      ? listingUnit(item)
                        ? `/ ${unitLabel(listingUnit(item))}`
                        : ""
                      : periodLabel(item.period)}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 mt-2.5 text-[14px]" style={{ color: "var(--muted)" }}>
                  <MapPin size={14} color="var(--mocha)" />
                  <span className="line-clamp-2">
                    {[item.location, item.city].filter(Boolean).join(", ") || "—"}
                  </span>
                </p>
              </div>
              {ago ? <span className="time-pill shrink-0">{ago}</span> : null}
            </div>

            <h1 className="mt-4 text-[20px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
              {item.title}
            </h1>
            <div className="mt-2">
              <PosterName item={item} />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-5">
              {specs.map((spec) => (
                <div key={spec.label} className="stat-pill">
                  <p className="stat-pill-value">{spec.value}</p>
                  <p className="stat-pill-label">{spec.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <SocialActions item={item} />
            </div>

            <div className="mt-6">
              <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                Listing information
              </p>
              <p className="text-[14px] leading-relaxed mt-2 whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
                {description || "No extra description."}
              </p>
            </div>

            {item.category === "vifaa" && (
              <div className="mt-5">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--mocha)" }}>
                  Quantity
                </label>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                  placeholder="1"
                  className="input-chocolate w-full px-4 py-3 text-sm"
                />
              </div>
            )}
          </div>

          <div
            className="fixed bottom-0 left-0 right-0 z-30 px-4"
            style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
          >
            <div className="max-w-md mx-auto flex gap-2.5">
              <Link
                href={`/chat/${item.id}?title=${encodeURIComponent(item.title)}`}
                className="detail-cta flex-1"
              >
                <Mail size={16} />
                Message
              </Link>
              {callHref ? (
                <a href={callHref} className="detail-cta flex-1">
                  <Phone size={16} />
                  Call
                </a>
              ) : (
                <Link
                  href={`/tuma-ombi?listing=${item.id}&title=${encodeURIComponent(item.title)}&category=${encodeURIComponent(item.category || "")}&qty=${encodeURIComponent(qty)}`}
                  className="detail-cta flex-1"
                >
                  <Phone size={16} />
                  Request
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
