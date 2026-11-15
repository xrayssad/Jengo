"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Eye, MapPin } from "lucide-react";
import { catShort, formatPrice, listingUnit, type Listing } from "@/lib/api";
import { bedCount, formatViews, sellerVerified, shortPlace, verifiedType, viewCount, type ViewMode } from "@/lib/browse";
import { useT } from "@/lib/i18n";
import { freezeBrowse, useOpenListing, useReturnPulse } from "@/lib/listSession";
import ListingPhoto from "./ListingPhoto";
import SaveButton from "./SaveButton";
import VerifiedBadge from "./VerifiedBadge";

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
  priority = false,
  delay = -1,
  layout = "large",
  frame = "feed",
  preview = false,
  listIds,
  highlight = false,
}: {
  item: Listing;
  eager?: boolean;
  priority?: boolean;
  delay?: number;
  layout?: ViewMode;
  frame?: "feed" | "hero" | "rail";
  preview?: boolean;
  listIds?: string[];
  highlight?: boolean;
}) {
  const t = useT();
  const pulsed = useReturnPulse(item.id, frame);
  const path = usePathname() || "";
  const active = useOpenListing(item.id);
  const opened = path.startsWith("/tangazo/") && active;
  const place = shortPlace(item);
  const photos = (item.images || []).filter(Boolean);
  const src = photos[0] || "";
  const verified = sellerVerified(item);
  const kindVerified = verifiedType(item);
  const seller = (item.owner_name || item.owner_username || "").trim();
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
        <Link
          href={href}
          scroll={false}
          transitionTypes={["nav-forward"]}
          className="immerse-hit"
          aria-label={item.title}
          onClick={() => {
            if (preview) return;
            const ids = listIds?.length ? listIds : [item.id];
            freezeBrowse(frame, ids, item.id);
          }}
        >
        <ListingPhoto src={src} eager={eager} priority={priority} ratio={ratio} />
      </Link>
      <div className="immerse-shade" aria-hidden />
      <div className="immerse-top">
        {kind && !grid ? <span className="immerse-pill">{kind}</span> : null}
      </div>
      <div className="immerse-copy">
        <p className="immerse-title">
          <span className="immerse-title-text">{item.title}</span>
        </p>
        {verified ? (
          <p className="immerse-seller">
            {seller ? <span>{seller}</span> : null}
            <VerifiedBadge size="sm" type={kindVerified} />
          </p>
        ) : null}
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
        {views != null && frame !== "feed" ? (
          <p className="immerse-views">
            <Eye size={12} strokeWidth={2} aria-hidden />
            {t("views", { n: formatViews(views) })}
          </p>
        ) : null}
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
        highlight || pulsed ? "is-return" : "",
      ].filter(Boolean).join(" ")}
      data-listing-id={item.id}
      data-frame={frame}
      style={enter ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="listing-media">
        {opened ? media : (
          <ViewTransition name={frame === "feed" ? `listing-${item.id}` : `listing-${frame}-${item.id}`} share="listing-morph" default="none">
            {media}
          </ViewTransition>
        )}
      </div>
      {frame === "feed" && (views != null || chip || item.views_7d != null) ? (
        <p className="immerse-foot">
          {chip ? <span>{chip}</span> : null}
          {views != null ? (
            <span>
              <Eye size={12} strokeWidth={2} aria-hidden />
              {t("views", { n: formatViews(views) })}
            </span>
          ) : null}
          {item.views_7d != null ? <span>{t("views.week", { n: formatViews(item.views_7d) })}</span> : null}
        </p>
      ) : null}
    </article>
  );
}
