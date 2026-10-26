"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { catLabel, formatPrice, listingUnit, periodLabel, unitLabel, type Listing } from "@/lib/api";
import SocialActions from "./SocialActions";

export default function ListingCard({ item, eager }: { item: Listing; eager?: boolean }) {
  const place = [item.location, item.city].filter(Boolean).join(", ");
  const photos = (item.images || []).filter(Boolean);
  const rate =
    item.category === "vifaa"
      ? listingUnit(item)
        ? ` / ${unitLabel(listingUnit(item))}`
        : ""
      : periodLabel(item.period);

  return (
    <article className="estate-card">
      <Link href={`/tangazo/${item.id}`} className="block relative">
        {photos[0] ? (
          <div className="w-full overflow-hidden" style={{ height: "min(72vw, 520px)", minHeight: 360, backgroundColor: "var(--ink-2)" }}>
            <img
              src={photos[0]}
              alt=""
              className="w-full h-full object-cover"
              loading={eager ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ) : (
          <div className="w-full flex items-center justify-center" style={{ height: "min(72vw, 520px)", minHeight: 360, background: "linear-gradient(165deg, var(--ink-2), var(--ink))" }}>
            <span className="font-heading text-xl" style={{ color: "var(--caramel)" }}>{catLabel[item.category || ""] || "Jengo"}</span>
          </div>
        )}
        {photos.length > 1 && (
          <span
            className="absolute top-3 right-3 text-[11px] px-2 py-1"
            style={{ backgroundColor: "rgba(var(--veil-rgb),0.72)", color: "var(--gold)" }}
          >
            {photos.length} photos
          </span>
        )}
        <div className="photo-dock">
          <p className="font-heading text-[28px] leading-none" style={{ color: "var(--ink)" }}>
            TZS {formatPrice(item.price)}
            <span className="text-sm font-normal ml-1" style={{ color: "var(--muted)" }}>{rate}</span>
          </p>
          <h2 className="font-heading text-lg leading-snug mt-1.5" style={{ color: "var(--ink)" }}>{item.title}</h2>
          {place ? (
            <p className="flex items-center gap-1 mt-1 text-sm" style={{ color: "var(--muted)" }}>
              <MapPin size={13} color="var(--mocha)" />
              {place}
            </p>
          ) : null}
        </div>
      </Link>
      <div className="px-4 py-3">
        <SocialActions item={item} />
      </div>
    </article>
  );
}
