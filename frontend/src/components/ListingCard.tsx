"use client";

import { useEffect, useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Eye, ImageIcon, MapPin } from "lucide-react";
import { catShort, formatPrice, listingUnit, type Listing } from "@/lib/api";
import { bedCount, formatViews, sellerVerified, shortPlace, viewCount, type ViewMode } from "@/lib/browse";
import { sizedImage } from "@/lib/images";
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

function ListingPhoto({ src, eager, ratio }: { src: string; eager?: boolean; ratio: [number, number] }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const sized = sizedImage(src, [480, 800, 1200]);

  useEffect(() => {
    setFailed(false);
    setReady(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="market-photo-empty">
        <ImageIcon size={28} strokeWidth={1.6} aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={sized.src}
      srcSet={sized.srcSet}
      sizes="(max-width: 900px) 92vw, 480px"
      alt=""
      width={ratio[0]}
      height={ratio[1]}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={ready ? "is-ready" : ""}
      onLoad={() => setReady(true)}
      onError={() => setFailed(true)}
    />
  );
}

export default function ListingCard({
  item,
  eager,
  delay = -1,
  layout = "large",
  frame = "feed",
  preview = false,
}: {
  item: Listing;
  eager?: boolean;
  delay?: number;
  layout?: ViewMode;
  frame?: "feed" | "hero" | "rail";
  preview?: boolean;
}) {
  const t = useT();
  const place = shortPlace(item);
  const photos = (item.images || []).filter(Boolean);
  const src = photos[0] || "";
  const verified = sellerVerified(item);
  const views = viewCount(item);
  const beds = bedCount(item);
  const stock = item.category === "vifaa" && item.stock != null ? item.stock : null;
  const chip = stock != null ? t("stock", { n: stock }) : beds != null ? t("bed", { n: beds }) : "";
  const rateId = rateKey(item);
  const rate = rateId ? t(rateId) : "";
  const shownRate = rate === rateId ? "" : rate;
  const enter = delay >= 0 && frame === "feed";
  const grid = layout === "grid" && frame === "feed";
  const stay = item.category === "apartment_airbnb";
  const ratio: [number, number] = frame === "hero" ? [3, 4] : stay && !grid ? [4, 3] : [4, 5];
  const kind = catShort[item.category || ""] || "";
  const href = frame === "feed" ? `/tangazo/${item.id}` : `/tangazo/${item.id}?from=${frame}`;

  const media = (
    <div className="market-tile-media">
      <Link href={href} transitionTypes={["nav-forward"]} className="immerse-hit" aria-label={item.title}>
        <ListingPhoto src={src} eager={eager} ratio={ratio} />
      </Link>
      <div className="immerse-shade" aria-hidden />
      <div className="immerse-top">
        {kind && !grid ? <span className="immerse-pill">{kind}</span> : null}
        {verified && !grid ? (
          <span className="immerse-verified">
            <Check size={11} strokeWidth={2.6} aria-hidden />
            {t("verified")}
          </span>
        ) : null}
      </div>
      <div className="immerse-copy">
        <p className="immerse-title">{item.title}</p>
        {!grid && place ? (
          <p className="immerse-place">
            <MapPin size={13} aria-hidden />
            <span>{place}</span>
          </p>
        ) : null}
        <p className="immerse-price">
          <span>TSh {formatPrice(item.price)}</span>
          {!grid && shownRate ? <span className="immerse-rate">{shownRate}</span> : null}
        </p>
      </div>
      {!grid ? (
        <span className="immerse-go" aria-hidden>
          <ArrowUpRight size={18} />
        </span>
      ) : null}
      <div className="immerse-heart">
        <SaveButton item={item} variant="heart" size={16} className="heart-fab heart-fab-sm" />
      </div>
    </div>
  );

  return (
    <article
      className={[
        "market-tile is-immerse",
        grid ? "is-grid" : "is-large",
        stay && !grid ? "is-stay" : "",
        frame === "hero" ? "is-hero" : "",
        frame === "rail" ? "is-rail" : "",
        enter ? "card-enter" : "",
      ].filter(Boolean).join(" ")}
      style={enter ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="listing-media">
        <ViewTransition name={frame === "feed" ? `listing-${item.id}` : `listing-${frame}-${item.id}`} share="listing-morph" default="none">
          {media}
        </ViewTransition>
      </div>
      {frame === "feed" && (views != null || chip) ? (
        <p className="immerse-foot">
          {chip ? <span>{chip}</span> : null}
          {views != null ? (
            <span>
              <Eye size={12} strokeWidth={2} aria-hidden />
              {t("views", { n: formatViews(views) })}
            </span>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
