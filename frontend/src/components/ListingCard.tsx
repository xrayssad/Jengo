"use client";

import Link from "next/link";
import { catShort, formatPrice, listingUnit, periodLabel, unitLabel, type Listing } from "@/lib/api";
import SaveButton from "./SaveButton";

export default function ListingCard({ item, eager }: { item: Listing; eager?: boolean }) {
  const place = [item.location, item.city].filter(Boolean).join(", ");
  const photos = (item.images || []).filter(Boolean);
  const type = catShort[item.category || ""] || "Listing";
  const rate =
    item.category === "vifaa"
      ? listingUnit(item)
        ? unitLabel(listingUnit(item))
        : ""
      : (periodLabel(item.period) || "").replace(/^\//, "");

  const specs = [
    type,
    rate || null,
    item.category === "vifaa" && item.stock != null ? `${item.stock} in stock` : null,
  ].filter(Boolean);

  return (
    <article className="estate-card">
      <div className="relative">
        <Link href={`/tangazo/${item.id}`} className="block">
          {photos[0] ? (
            <div className="estate-card-media">
              <img
                src={photos[0]}
                alt=""
                className="w-full h-full object-cover"
                loading={eager ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          ) : (
            <div className="estate-card-media flex items-center justify-center" style={{ background: "linear-gradient(165deg, var(--blush), var(--cream))" }}>
              <span className="text-lg font-semibold" style={{ color: "var(--mocha)" }}>{type}</span>
            </div>
          )}
        </Link>
        <div className="absolute top-3 right-3 z-10">
          <SaveButton
            item={item}
            variant="heart"
            size={18}
            className="heart-fab"
          />
        </div>
      </div>

      <Link href={`/tangazo/${item.id}`} className="block px-4 pt-3.5 pb-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[22px] font-bold leading-none tracking-tight" style={{ color: "var(--ink)" }}>
            TZS {formatPrice(item.price)}
          </p>
          {place ? (
            <p className="text-[13px] text-right leading-snug line-clamp-1 min-w-0" style={{ color: "var(--muted)" }}>
              {place}
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-[13px] leading-snug line-clamp-1" style={{ color: "var(--mocha)" }}>
          {item.title}
        </p>
        {specs.length > 0 ? (
          <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "var(--muted)" }}>
            {specs.join("  ·  ")}
          </p>
        ) : null}
      </Link>
    </article>
  );
}
