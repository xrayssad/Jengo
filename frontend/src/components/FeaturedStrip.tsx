"use client";

import { useMemo } from "react";
import type { Listing } from "@/lib/api";
import { pickFeatured } from "@/lib/browse";
import { useT } from "@/lib/i18n";
import ListingCard from "./ListingCard";

export default function FeaturedStrip({ items }: { items: Listing[] }) {
  const t = useT();
  const picked = useMemo(() => pickFeatured(items).slice(0, 6), [items]);
  if (!picked.length) return null;
  const ids = picked.map((item) => item.id);
  return (
    <section className="featured-strip" aria-label={t("home.featured")}>
      <h2 className="home-section-title">{t("home.featured")}</h2>
      <div className="featured-strip-row no-scrollbar">
        {picked.map((item, index) => (
          <div key={item.id} className="featured-strip-card">
            <ListingCard item={item} frame="rail" eager={index < 2} priority={index === 0} listIds={ids} />
          </div>
        ))}
      </div>
    </section>
  );
}
