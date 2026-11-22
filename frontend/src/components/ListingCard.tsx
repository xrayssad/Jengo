"use client";

import { useEffect, useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, Ticket, User } from "lucide-react";
import { formatPrice, formatPriceCompact, listingUnit, type Listing } from "@/lib/api";
import { canonicalCategory, categoryConfig } from "@/lib/categories.config";
import { PlotCardFacts } from "./PlotDetail";
import { quoteStay, readFit } from "@/lib/pricing";
import PriceBreakdown from "./PriceBreakdown";
import { bedCount, formatViews, sellerVerified, shortPlace, verifiedType, viewCount, warnMissingViews, type ViewMode } from "@/lib/browse";
import { useI18n } from "@/lib/i18n";
import { freezeBrowse, useOpenListing, useReturnPulse } from "@/lib/listSession";
import BottomSheet from "./BottomSheet";
import ListingPhoto from "./ListingPhoto";
import SaveButton from "./SaveButton";
import VerifiedBadge from "./VerifiedBadge";

const RENTALS = new Set(["chumba_nyumba", "rooms-houses", "store_godown", "frame"]);

function rateKey(item: Listing) {
  if (canonicalCategory(item.category) === "plots") return "";
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
  defer = false,
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
  defer?: boolean;
}) {
  const { t, lang } = useI18n();
  const [badge, setBadge] = useState<"" | "direct" | "free" | "costs">("");
  const config = categoryConfig(item.category);
  const kind = config ? (lang === "sw" ? config.short.sw : config.short.en) : "";
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
  useEffect(() => {
    if (views == null) warnMissingViews(item.id, "GET /listings");
  }, [item.id, views]);
  const beds = bedCount(item);
  const stock = item.category === "vifaa" && item.stock != null ? item.stock : null;
  const chip = stock != null ? t("stock", { n: stock }) : beds != null ? t("bed", { n: beds }) : "";
  const rateId = rateKey(item);
  const rate = rateId ? t(rateId) : "";
  const shownRate = rate === rateId ? "" : rate;
  const enter = delay >= 0 && frame === "feed";
  const grid = layout === "grid" && frame === "feed";
  const stay = item.category === "apartment_airbnb";
  const plot = canonicalCategory(item.category) === "plots";
  const ratio: [number, number] = frame === "hero" ? [3, 4] : stay && !grid ? [4, 3] : [4, 5];
  const href = frame === "feed" ? `/tangazo/${item.id}` : `/tangazo/${item.id}?from=${frame}`;
  const openListing = () => {
    if (preview) return;
    const ids = listIds?.length ? listIds : [item.id];
    freezeBrowse(frame, ids, item.id);
  };

  const fit = readFit(item);
  const marks = [
    fit.direct_owner ? "direct" : "",
    fit.free_viewing ? "free" : "",
    fit.costs_confirmed ? "costs" : "",
  ].filter((key): key is "direct" | "free" | "costs" => Boolean(key)).slice(0, 2);
  const meta = [place, chip, views != null ? t("views", { n: formatViews(views) }) : ""].filter(Boolean).join(" · ");
  const money = frame === "rail" || frame === "hero" ? formatPriceCompact(item.price) : formatPrice(item.price);
  const photo = (
    <div className="market-tile-media">
      <Link href={href} scroll={false} transitionTypes={["nav-forward"]} className="immerse-hit" aria-label={item.title} onClick={openListing}>
        <ListingPhoto src={src} eager={eager} priority={priority} ratio={ratio} />
      </Link>
      {frame === "hero" ? <div className="immerse-shade" aria-hidden /> : null}
      {frame === "hero" && kind ? (
        <div className="immerse-top"><span className="immerse-pill">{kind}</span></div>
      ) : null}
      {photos.length > 1 && frame !== "hero" ? <span className="card-count">{photos.length}</span> : null}
      <div className="immerse-heart">
        <SaveButton item={item} variant="heart" size={16} className="heart-fab heart-fab-sm" />
      </div>
      {frame === "hero" ? (
        <div className="immerse-copy">
          <p className="immerse-title"><span className="immerse-title-text">{item.title}</span></p>
          {place ? <p className="immerse-place"><span>{place}</span></p> : null}
          <p className="immerse-price"><span>TSh {money}</span></p>
        </div>
      ) : null}
    </div>
  );
  const sheet = (
    <BottomSheet open={Boolean(badge)} title={badge ? t(badge === "direct" ? "fit.direct" : badge === "free" ? "fit.free" : "fit.costs") : ""} onClose={() => setBadge("")}>
      <p className="sheet-copy">{badge ? t(`badge.${badge}`) : ""}</p>
    </BottomSheet>
  );

  return (
    <article
      className={[
        "market-tile",
        frame === "hero" ? "is-immerse is-hero" : "is-standard",
        defer ? "is-cv" : "",
        grid ? "is-grid" : "is-large",
        stay && frame === "feed" && !grid ? "is-stay" : "",
        frame === "rail" ? "is-rail" : "",
        enter ? "card-enter" : "",
        highlight || pulsed ? "is-return" : "",
      ].filter(Boolean).join(" ")}
      data-listing-id={item.id}
      data-frame={frame}
      style={enter ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="listing-media">
        {opened && frame === "feed" ? photo : (
          <ViewTransition name={frame === "feed" ? `listing-${item.id}` : `listing-${frame}-${item.id}`} share="listing-morph" default="none">
            {photo}
          </ViewTransition>
        )}
      </div>
      {frame === "hero" ? null : (
        <div className="card-copy">
          <p className="card-price">
            <span>TSh {money}</span>
            {frame !== "rail" && shownRate ? <span className="card-rate">{shownRate}</span> : null}
          </p>
          <p className="card-title">
            <span>{item.title}</span>
            {verified ? <VerifiedBadge size="sm" type={kindVerified} /> : null}
          </p>
          {frame !== "rail" && meta ? <p className="card-meta">{meta}</p> : null}
          {frame !== "rail" && marks.length ? (
            <div className="card-badges">
              {marks.map((key) => (
                <button key={key} type="button" className="micro-badge" aria-label={t(key === "direct" ? "fit.direct" : key === "free" ? "fit.free" : "fit.costs")} onClick={() => setBadge(key)}>
                  {key === "direct" ? <User size={14} /> : key === "free" ? <Ticket size={14} /> : <Receipt size={14} />}
                </button>
              ))}
            </div>
          ) : null}
          {frame === "feed" && !grid && !plot && quoteStay(item).due > Number(item.price || 0) ? <PriceBreakdown item={item} compact /> : null}
          {frame === "feed" && !grid && plot ? <PlotCardFacts item={item} /> : null}
          {seller && verified && frame === "feed" ? <p className="card-meta">{seller}</p> : null}
        </div>
      )}
      {sheet}
    </article>
  );
}
