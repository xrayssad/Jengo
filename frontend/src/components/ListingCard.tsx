"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { catLabel, formatPrice, periodLabel, type Listing } from "@/lib/api";
import SocialActions from "./SocialActions";

export default function ListingCard({ item }: { item: Listing }) {
  return (
    <article className="soft-card overflow-hidden card-lift">
      <Link href={`/tangazo/${item.id}`} className="block">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt="" className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-52 flex items-center justify-center" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
            <span className="text-sm font-semibold" style={{ color: "#D2A679" }}>{catLabel[item.category || ""] || "Jengo"}</span>
          </div>
        )}
        <div className="p-4">
          <h2 className="font-heading text-lg leading-snug" style={{ color: "#2E1A0F" }}>{item.title}</h2>
          <p className="flex items-center gap-1 mt-1.5 text-sm" style={{ color: "#5C4033" }}>
            <MapPin size={13} color="#8B5E3C" />
            {[item.location, item.city].filter(Boolean).join(", ")}
          </p>
          <p className="mt-2 font-semibold" style={{ color: "#2E1A0F" }}>
            TZS {formatPrice(item.price)}
            <span className="text-sm font-normal" style={{ color: "#5C4033" }}> {periodLabel(item.period)}</span>
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <SocialActions item={item} />
      </div>
    </article>
  );
}
