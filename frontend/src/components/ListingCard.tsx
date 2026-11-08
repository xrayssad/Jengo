"use client";

import Link from "next/link";
import { Heart, Images, MapPin } from "lucide-react";
import { catShort, formatPrice, listingUnit, unitLabel, type Listing } from "@/lib/api";
import SaveButton from "./SaveButton";

const periodShort: Record<string, string> = {
  mwezi: "/mo",
  miezi_3: "/3 mo",
  miezi_6: "/6 mo",
  mwaka: "/yr",
  usiku: "/night",
  siku: "/day",
  wiki: "/wk",
};

const wash: Record<string, string> = {
  chumba_nyumba: "linear-gradient(165deg, #F6E7D8, #E4C7A8)",
  apartment_airbnb: "linear-gradient(165deg, #F8EBDD, #D2A679)",
  store_godown: "linear-gradient(165deg, #EFE0CE, #C4A35A)",
  frame: "linear-gradient(165deg, #F7E8D6, #C9A07A)",
  vifaa: "linear-gradient(165deg, #EAD6C4, #8B5E3C)",
};

function placeLine(item: Listing) {
  const city = (item.city || "").trim();
  const location = (item.location || "").trim();
  if (location && city && location.toLowerCase().includes(city.toLowerCase())) return location;
  return [location, city].filter(Boolean).join(", ");
}

export default function ListingCard({
  item,
  eager,
  delay = 0,
}: {
  item: Listing;
  eager?: boolean;
  delay?: number;
}) {
  const place = placeLine(item);
  const photos = (item.images || []).filter(Boolean);
  const type = catShort[item.category || ""] || "Listing";
  const rate =
    item.category === "vifaa"
      ? listingUnit(item)
        ? `/${unitLabel(listingUnit(item))}`
        : ""
      : periodShort[item.period || ""] || "";
  const likes = item.likes_count || 0;
  const stock =
    likes > 0 || item.category !== "vifaa" || item.stock == null ? "" : `${item.stock} left`;

  return (
    <article className="market-tile rise" style={{ animationDelay: `${Math.min(delay, 280)}ms` }}>
      <div className="market-tile-media">
        <Link href={`/tangazo/${item.id}`} className="block h-full w-full" aria-label={item.title}>
          {photos[0] ? (
            <img
              src={photos[0]}
              alt=""
              loading={eager ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center px-3 text-center"
              style={{ background: wash[item.category || ""] || "linear-gradient(165deg, var(--blush), var(--cream))" }}
            >
              <span className="text-[13px] font-semibold" style={{ color: "var(--mocha)" }}>{type}</span>
            </div>
          )}
        </Link>
        {item.verified ? <span className="market-verified">Verified</span> : null}
        {photos.length > 1 ? (
          <span className="market-count">
            <Images size={12} strokeWidth={2} aria-hidden />
            {photos.length}
          </span>
        ) : null}
        <div className="absolute top-2 right-2 z-10">
          <SaveButton item={item} variant="heart" size={16} className="heart-fab heart-fab-sm" />
        </div>
      </div>

      <Link href={`/tangazo/${item.id}`} className="market-body">
        <p className="market-price">
          <span>TZS {formatPrice(item.price)}</span>
          {rate ? <span className="market-rate">{rate}</span> : null}
        </p>
        <p className="market-title">{item.title}</p>
        <p className="market-place">
          <MapPin size={12} color="var(--mocha)" aria-hidden />
          <span>{place || type}</span>
        </p>
        {(likes > 0 || stock) && (
          <p className="market-meta">
            <span>{type}</span>
            {likes > 0 ? (
              <span className="market-meta-aside">
                <Heart size={12} strokeWidth={2} aria-hidden />
                {likes}
              </span>
            ) : (
              <span className="market-meta-aside">{stock}</span>
            )}
          </p>
        )}
      </Link>
    </article>
  );
}
