"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/api";
import { pickFresh } from "@/lib/browse";
import { useT } from "@/lib/i18n";
import ListingCard from "./ListingCard";

export default function FreshRail({ items }: { items: Listing[] }) {
  const t = useT();
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);
  const fresh = pickFresh(items, 8, now);
  if (fresh.length < 2) return null;

  return (
    <section className="fresh-block bleed-cancel" aria-label={t("fresh")}>
      <div className="fresh-head">
        <h2 className="home-section-title">{t("fresh")}</h2>
        <Link href="/discover" className="home-see-all">
          {t("viewAll")}
        </Link>
      </div>
      <div className="fresh-rail no-scrollbar">
        {fresh.map((item) => (
          <div key={item.id} className="fresh-slide">
            <ListingCard item={item} frame="rail" />
          </div>
        ))}
      </div>
    </section>
  );
}
