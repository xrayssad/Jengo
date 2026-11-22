"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Listing } from "@/lib/api";
import { pickFresh } from "@/lib/browse";
import { useT } from "@/lib/i18n";
import { usePersistentScroll } from "@/lib/listSession";
import ListingCard from "./ListingCard";

export default function FreshRail({ items, version = 0, title, allowSingle = false }: { items: Listing[]; version?: number; title?: string; allowSingle?: boolean }) {
  const t = useT();
  const railRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);
  const count = items.length;
  const pickedIds = useMemo(() => (now ? pickFresh(items, 8, now).map((item) => item.id) : []), [version, now, count]);
  const fresh = pickedIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is Listing => Boolean(item));
  usePersistentScroll("fresh", railRef, fresh.length > 1);
  if (fresh.length < (allowSingle ? 1 : 2)) return null;

  return (
    <section className="fresh-block bleed-cancel" aria-label={title || t("fresh")}>
      <div className="fresh-head">
        <h2 className="home-section-title">{title || t("fresh")}</h2>
        <Link href="/discover" className="see-all">
          {t("seeAll")}
          <i aria-hidden><ChevronRight size={16} /></i>
        </Link>
      </div>
      <div ref={railRef} className="fresh-rail no-scrollbar">
        {fresh.map((item, index) => (
          <div key={item.id} className="fresh-slide">
            <ListingCard item={item} frame="rail" eager={index < 2} priority={index === 0} listIds={pickedIds} />
          </div>
        ))}
      </div>
    </section>
  );
}
