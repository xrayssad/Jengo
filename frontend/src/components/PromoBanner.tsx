"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function PromoBanner() {
  const t = useT();
  return (
    <Link href="/kazi" className="promo-banner">
      <img src="/real/materials.jpg" alt="" width={800} height={340} />
      <span className="immerse-shade" aria-hidden />
      <span className="promo-copy">
        <span className="promo-title">
          {t("promo.before")}
          <em>{t("promo.accent")}</em>
          {t("promo.after")}
        </span>
        <span className="promo-cta">{t("promo.cta")}</span>
      </span>
    </Link>
  );
}
