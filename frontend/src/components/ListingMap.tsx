"use client";

import dynamic from "next/dynamic";
import { getAuthUser, type Listing } from "@/lib/api";
import { APPROXIMATE_RADIUS_M, publicMapIsApproximate } from "@/lib/geo";
import { readFit } from "@/lib/pricing";
import { canonicalCategory } from "@/lib/categories.config";
import { useT } from "@/lib/i18n";

const MapPreview = dynamic(() => import("./MapPreview"), { ssr: false });

export default function ListingMap({ item }: { item: Listing }) {
  const t = useT();
  if (item.lat == null || item.lng == null) return null;
  const fit = readFit(item);
  const me = getAuthUser();
  const owner = Boolean(me?.user_id && item.owner_id && me.user_id === item.owner_id);
  const approximate = publicMapIsApproximate(canonicalCategory(item.category), Boolean(fit.show_exact), owner);
  return (
    <div className="mt-4">
      <p className="detail-heading">{approximate ? t("geo.approxTitle") : t("geo.map")}</p>
      <div className="overflow-hidden" style={{ borderRadius: 18 }}>
        <MapPreview lat={item.lat} lng={item.lng} approximate={approximate} accuracyM={approximate ? APPROXIMATE_RADIUS_M : undefined} />
      </div>
      {approximate ? <p className="wizard-tip">{t("geo.approxNote")}</p> : null}
    </div>
  );
}
