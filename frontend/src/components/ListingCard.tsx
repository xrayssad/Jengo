"use client";

import { useEffect, useRef, useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { Check, Eye, MapPin } from "lucide-react";
import { formatPrice, listingUnit, type Listing } from "@/lib/api";
import { bedCount, formatViews, sellerVerified, shortPlace, viewCount, type ViewMode } from "@/lib/browse";
import { useT } from "@/lib/i18n";
import SaveButton from "./SaveButton";

const RENTALS = new Set(["chumba_nyumba", "store_godown", "frame"]);

function rateKey(item: Listing) {
  if (item.category === "vifaa") {
    const unit = listingUnit(item);
    return unit ? `unit.${unit}` : "unit.kipande";
  }
  if (item.period) return `period.${item.period}`;
  if (item.category === "apartment_airbnb") return "period.usiku";
  if (RENTALS.has(item.category || "")) return "period.mwezi";
  return "";
}

export default function ListingCard({
  item,
  eager,
  delay = -1,
  layout = "grid",
}: {
  item: Listing;
  eager?: boolean;
  delay?: number;
  layout?: ViewMode;
}) {
  const t = useT();
  const place = shortPlace(item);
  const photos = (item.images || []).filter(Boolean);
  const src = photos[0] || "";
  const imgRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const verified = sellerVerified(item);
  const views = viewCount(item);
  const beds = bedCount(item);
  const stock = item.category === "vifaa" && item.stock != null ? item.stock : null;
  const chip = stock != null ? t("stock", { n: stock }) : beds != null ? t("bed", { n: beds }) : "";
  const rateId = rateKey(item);
  const rate = rateId ? t(rateId) : "";
  const shownRate = rate === rateId ? "" : rate;
  const enter = delay >= 0;
  const row = layout === "list";

  useEffect(() => {
    setReady(false);
    const node = imgRef.current;
    if (node?.complete && node.naturalWidth > 0) setReady(true);
  }, [src]);

  return (
    <article
      className={`${row ? "market-tile is-row" : "market-tile"}${enter ? " card-enter" : ""}`}
      style={enter ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="listing-media">
        <ViewTransition name={`listing-${item.id}`} share="listing-morph" default="none">
          <div className="market-tile-media">
            <Link href={`/tangazo/${item.id}`} transitionTypes={["nav-forward"]} className="block h-full w-full" aria-label={item.title}>
              {src ? (
                <img
                  ref={imgRef}
                  src={src}
                  alt=""
                  loading={eager ? "eager" : "lazy"}
                  decoding="async"
                  className={ready ? "is-ready" : ""}
                  onLoad={() => setReady(true)}
                  onError={() => setReady(true)}
                />
              ) : (
                <div className="market-photo-empty" />
              )}
            </Link>
            {verified ? (
              <span className="market-verified">
                <Check size={11} strokeWidth={2.6} aria-hidden />
                {t("verified")}
              </span>
            ) : null}
          </div>
        </ViewTransition>
        <div className="absolute top-2 right-2 z-10">
          <SaveButton item={item} variant="heart" size={16} className="heart-fab heart-fab-sm" />
        </div>
      </div>

      <Link href={`/tangazo/${item.id}`} transitionTypes={["nav-forward"]} className="market-body">
        <p className="market-price">
          <span className="market-price-num">TSh&nbsp;{formatPrice(item.price)}</span>
          {shownRate ? <span className="market-rate">{shownRate}</span> : null}
        </p>
        <p className="market-title">{item.title}</p>
        {(place || views != null) && (
          <p className="market-meta">
            <span className="market-place">
              {place ? (
                <>
                  <MapPin size={12} color="currentColor" aria-hidden />
                  <span>{place}</span>
                </>
              ) : (
                <span />
              )}
            </span>
            {views != null ? (
              <span className="market-views">
                <Eye size={12} strokeWidth={2} aria-hidden />
                {t("views", { n: formatViews(views) })}
              </span>
            ) : null}
          </p>
        )}
        {chip ? <p className="market-chip">{chip}</p> : null}
      </Link>
    </article>
  );
}
