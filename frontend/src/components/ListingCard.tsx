"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
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

function placeLine(item: Listing) {
  const city = (item.city || "").trim();
  const location = (item.location || "").trim();
  if (location && city && location.toLowerCase().includes(city.toLowerCase())) return location;
  return [location, city].filter(Boolean).join(", ");
}

export default function ListingCard({ item, eager }: { item: Listing; eager?: boolean }) {
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
    <article className="market-tile">
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
              className="flex h-full w-full items-center justify-center px-2 text-center"
              style={{ background: "linear-gradient(165deg, var(--blush), var(--cream))" }}
            >
              <span className="text-[13px] font-semibold" style={{ color: "var(--mocha)" }}>{type}</span>
            </div>
          )}
        </Link>
        {item.verified ? <span className="market-verified">Verified</span> : null}
        <div className="absolute top-2 right-2 z-10">
          <SaveButton item={item} variant="heart" size={15} className="heart-fab heart-fab-sm" />
        </div>
      </div>

      <Link href={`/tangazo/${item.id}`} className="block px-0.5 pt-2">
        <p className="market-price">
          <span>TZS {formatPrice(item.price)}</span>
          {rate ? <span className="market-rate">{rate}</span> : null}
        </p>
        <p className="market-title">{item.title}</p>
        <p className="market-meta">
          <span>{place || type}</span>
          {likes > 0 ? (
            <span className="market-meta-aside">
              <Heart size={11} strokeWidth={2} aria-hidden />
              {likes}
            </span>
          ) : stock ? (
            <span className="market-meta-aside">{stock}</span>
          ) : null}
        </p>
      </Link>
    </article>
  );
}
