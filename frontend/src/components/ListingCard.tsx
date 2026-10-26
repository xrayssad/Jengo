"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { catLabel, formatPrice, listingUnit, periodLabel, unitLabel, type Listing } from "@/lib/api";
import SocialActions from "./SocialActions";

export default function ListingCard({ item }: { item: Listing }) {
  const place = [item.location, item.city].filter(Boolean).join(", ");
  const rate =
    item.category === "vifaa"
      ? listingUnit(item)
        ? ` / ${unitLabel(listingUnit(item))}`
        : ""
      : periodLabel(item.period);

  return (
    <article className="estate-card">
      <Link href={`/tangazo/${item.id}`} className="block relative">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt="" className="w-full h-[280px] object-cover" />
        ) : (
          <div className="w-full h-[280px] flex items-center justify-center" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
            <span className="font-heading text-xl" style={{ color: "#D2A679" }}>{catLabel[item.category || ""] || "Jengo"}</span>
          </div>
        )}
        <div className="photo-dock">
          <p className="font-heading text-[28px] leading-none" style={{ color: "#2E1A0F" }}>
            TZS {formatPrice(item.price)}
            <span className="text-sm font-normal ml-1" style={{ color: "#5C4033" }}>{rate}</span>
          </p>
          <h2 className="font-heading text-lg leading-snug mt-1.5" style={{ color: "#2E1A0F" }}>{item.title}</h2>
          {place ? (
            <p className="flex items-center gap-1 mt-1 text-sm" style={{ color: "#5C4033" }}>
              <MapPin size={13} color="#8B5E3C" />
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
