"use client";

import { Bath, BedDouble, CookingPot, Droplets, Package, Ruler, Shield, Truck, Zap } from "lucide-react";
import type { Listing } from "@/lib/api";
import { canonicalCategory } from "@/lib/categories.config";
import { useI18n } from "@/lib/i18n";
import { readFit } from "@/lib/pricing";

type Item = { key: string; label: string; icon: typeof BedDouble; value?: string; on: boolean };

export default function AmenityRow({ item }: { item: Listing }) {
  const { t } = useI18n();
  const fit = readFit(item);
  const category = canonicalCategory(item.category);
  const amenities = (fit.amenities || []).join(" ").toLowerCase();
  const beds = fit.bedrooms || item.bedrooms || 0;
  const baths = fit.bathrooms || 0;
  const size = fit.size_m2 || fit.plot_size || 0;
  const has = (pattern: RegExp) => pattern.test(amenities);

  let rows: Item[] = [];
  if (category === "plots") {
    rows = [
      { key: "size", label: t("amenity.size"), icon: Ruler, value: size ? String(Math.round(size)) : "", on: size > 0 },
      { key: "tenure", label: t("amenity.tenure"), icon: Shield, value: fit.tenure ? fit.tenure.slice(0, 4) : "", on: Boolean(fit.tenure) },
      { key: "road", label: t("amenity.road"), icon: Truck, value: fit.road ? fit.road.slice(0, 3) : "", on: Boolean(fit.road) },
      { key: "power", label: t("amenity.power"), icon: Zap, on: Boolean(fit.electricity_nearby || fit.electricity || fit.power_backup) },
    ];
  } else if (category === "store_godown" || category === "frame") {
    rows = [
      { key: "size", label: t("amenity.size"), icon: Ruler, value: size ? String(Math.round(size)) : "", on: size > 0 },
      { key: "truck", label: t("amenity.truck"), icon: Truck, on: Boolean(fit.truck) },
      { key: "power", label: t("amenity.power"), icon: Zap, on: Boolean(fit.power_backup || fit.electricity) },
      { key: "security", label: t("amenity.security"), icon: Shield, on: has(/security|ulinzi|guard/) },
    ];
  } else if (category === "vifaa") {
    rows = [
      { key: "stock", label: t("amenity.stock"), icon: Package, value: item.stock != null ? String(item.stock) : "", on: item.stock != null },
      { key: "min", label: t("amenity.min"), icon: Package, value: fit.min_order ? String(fit.min_order) : "", on: Boolean(fit.min_order) },
      { key: "delivery", label: t("amenity.delivery"), icon: Truck, on: Boolean(fit.delivery_fee || fit.delivery_note) },
    ];
  } else {
    rows = [
      { key: "beds", label: t("amenity.beds"), icon: BedDouble, value: beds ? String(beds) : "", on: beds > 0 },
      { key: "baths", label: t("amenity.baths"), icon: Bath, value: baths ? String(baths) : "", on: baths > 0 },
      { key: "kitchen", label: t("amenity.kitchen"), icon: CookingPot, on: has(/kitchen|jiko/) },
      { key: "water", label: t("amenity.water"), icon: Droplets, on: Boolean(fit.water || (fit.water_nearby && fit.water_nearby !== "none")) },
      { key: "power", label: t("amenity.power"), icon: Zap, on: Boolean(fit.power_backup) },
      { key: "security", label: t("amenity.security"), icon: Shield, on: has(/security|ulinzi|guard/) },
    ];
  }

  return (
    <div className="amenity-row no-scrollbar rail-fade" aria-label={t("amenity.row")}>
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.key} className={row.on ? "amenity is-on" : "amenity"}>
            <span className="amenity-icon">
              <Icon size={20} strokeWidth={1.75} />
              {row.value ? <span className="amenity-badge">{row.value}</span> : null}
            </span>
            <span className="amenity-label">{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}
