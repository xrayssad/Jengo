"use client";

import { useMemo, useState } from "react";
import { LocateFixed, X } from "lucide-react";
import BottomSheet from "./BottomSheet";
import { REGIONS, readRecentRegions } from "@/lib/browse";
import { useT } from "@/lib/i18n";

export default function LocationSheet({
  open,
  value,
  places,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: string;
  places: string[];
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const recent = useMemo(() => (open ? readRecentRegions() : []), [open]);
  const popular = useMemo(() => {
    const seen = new Set<string>();
    return [...REGIONS, ...places].filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [places]);
  const match = (name: string) => !needle || name.toLowerCase().includes(needle);
  const recentShown = recent.filter(match);
  const popularShown = popular.filter((name) => match(name) && !recentShown.includes(name));

  const pick = (name: string) => {
    setQuery("");
    onSelect(name);
  };

  return (
    <BottomSheet
      open={open}
      title={t("loc.choose")}
      onClose={() => {
        setQuery("");
        onClose();
      }}
    >
      <input
        className="sheet-search"
        value={query}
        placeholder={t("loc.search")}
        onChange={(event) => setQuery(event.target.value)}
      />
      {!needle || t("region.all").toLowerCase().includes(needle) ? (
        <button type="button" className={value === "all" ? "sheet-option is-on" : "sheet-option"} onClick={() => pick("all")}>
          {t("region.all")}
        </button>
      ) : null}
      <button type="button" className={value === "near" ? "sheet-option is-on" : "sheet-option"} onClick={() => pick("near")}>
        <LocateFixed size={16} aria-hidden />
        {t("near")}
      </button>
      {value !== "all" && value !== "near" ? (
        <button type="button" className="sheet-option" onClick={() => pick("all")}>
          <X size={16} aria-hidden />
          {t("loc.clear")}
        </button>
      ) : null}
      {recentShown.length ? (
        <div className="loc-group">
          <p>{t("loc.recent")}</p>
          {recentShown.map((name) => (
            <button key={`recent-${name}`} type="button" className={value === name ? "sheet-option is-on" : "sheet-option"} onClick={() => pick(name)}>
              {name}
            </button>
          ))}
        </div>
      ) : null}
      {popularShown.length ? (
        <div className="loc-group">
          <p>{t("loc.popular")}</p>
          {popularShown.map((name) => (
            <button key={name} type="button" className={value === name ? "sheet-option is-on" : "sheet-option"} onClick={() => pick(name)}>
              {name}
            </button>
          ))}
        </div>
      ) : null}
    </BottomSheet>
  );
}
