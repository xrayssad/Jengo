"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { ViewTransition } from "react";
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

function shownPlace(location?: string | null, city?: string | null) {
  const parts = [location, city]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    const prev = unique[unique.length - 1];
    if (prev && prev.toLowerCase() === part.toLowerCase()) continue;
    unique.push(part);
  }
  return unique.join(", ") || "—";
}

function cachedListing(id: string) {
  if (typeof window === "undefined") return null;
  return peekListing(id);
}

export default function DetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<Listing | null>(() => cachedListing(id));
  const [loading, setLoading] = useState(() => !cachedListing(id));
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
  const place = shownPlace(item?.location, item?.city);

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
    <main className="detail-page min-h-screen">
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
          <div className="relative">
            <ViewTransition name={`listing-${item.id}`} share="listing-morph" default="none">
            <PhotoGallery
              images={item.images}
              fallback={
                <div
                  className="w-full flex items-center justify-center detail-hero-fallback"
                  style={{ background: "var(--surface-2)" }}
                >
                  <span className="text-2xl font-semibold" style={{ color: "var(--primary)" }}>
                    {catShort[item.category || ""] || "Jengo"}
                  </span>
                </div>
              }
            />
            </ViewTransition>
            <button
              type="button"
              onClick={() => router.back()}
              className="detail-float-btn absolute z-20"
              style={{ top: "calc(16px + env(safe-area-inset-top))", left: 16 }}
              aria-label="Back"
            >
              <ArrowLeft size={18} color="currentColor" />
            </button>
            <div className="absolute z-20" style={{ top: "calc(16px + env(safe-area-inset-top))", right: 16 }}>
              <SaveButton item={item} variant="heart" size={18} className="detail-float-btn" />
            </div>
          </div>

          <div className="canvas-read px-4 pt-5">
            <ViewTransition enter="detail-copy" default="none">
            <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="detail-price">
                  TZS {formatPrice(item.price)}
                  <span className="detail-unit">
                    {item.category === "vifaa"
                      ? listingUnit(item)
                        ? `/ ${unitLabel(listingUnit(item))}`
                        : ""
                      : periodLabel(item.period)}
                  </span>
                </p>
                <p className="detail-place">
                  <MapPin size={14} color="var(--muted)" />
                  <span>{place}</span>
                </p>
              </div>
              {ago ? <span className="time-pill shrink-0">{ago}</span> : null}
            </div>

            <h1 className="detail-title">{item.title}</h1>
            </div>
            </ViewTransition>
            <div className="seller-card">
              <PosterName item={item} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {specs.map((spec) => (
                <div key={spec.label} className="stat-pill">
                  <p className="stat-pill-label">{spec.label}</p>
                  <p className="stat-pill-value">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <SocialActions item={item} />
            </div>

            <div className="mt-6">
              <p className="detail-heading">Listing information</p>
              <p className="detail-copy whitespace-pre-wrap">
                {description || "No extra description."}
              </p>
            </div>

            {item.category === "vifaa" && (
              <div className="mt-5">
                <label className="detail-qty-label">Quantity</label>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                  placeholder="1"
                  className="detail-qty w-full px-4 text-sm"
                />
              </div>
            )}
          </div>

          <div className="detail-cta-bar">
            <div className="detail-cta-row">
              {callHref ? (
                <a href={callHref} className="detail-cta">
                  <Phone size={16} />
                  Call
                </a>
              ) : (
                <Link
                  href={`/tuma-ombi?listing=${item.id}&title=${encodeURIComponent(item.title)}&category=${encodeURIComponent(item.category || "")}&qty=${encodeURIComponent(qty)}`}
                  className="detail-cta"
                >
                  <Phone size={16} />
                  Request
                </Link>
              )}
              <Link
                href={`/chat/${item.id}?title=${encodeURIComponent(item.title)}`}
                className="detail-cta detail-cta-secondary"
              >
                <Mail size={16} />
                Message
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
