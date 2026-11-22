"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  Hammer,
  Home,
  LandPlot,
  LayoutGrid,
  Store,
  Warehouse,
  X,
} from "lucide-react";
import { HOME_TILES, sheetTiles, tileCopy, type HomeTile } from "@/lib/categories.config";
import { useI18n } from "@/lib/i18n";

const ICONS = {
  home: Home,
  building: Building2,
  warehouse: Warehouse,
  store: Store,
  land: LandPlot,
  boxes: Boxes,
  hammer: Hammer,
  all: LayoutGrid,
};

function TileButton({
  tile,
  active,
  onPick,
}: {
  tile: HomeTile;
  active: boolean;
  onPick: (tile: HomeTile) => void;
}) {
  const { lang } = useI18n();
  const copy = tileCopy(tile.id, lang);
  const Icon = ICONS[tile.icon] || Home;
  return (
    <button
      type="button"
      className={active ? "cat-tile cat-pop is-on" : "cat-tile cat-pop"}
      aria-label={copy.label}
      aria-pressed={tile.action === "filter" ? active : undefined}
      onClick={() => onPick(tile)}
    >
      <span className="cat-tile-icon">
        <Icon size={26} strokeWidth={1.6} />
      </span>
      <span className="cat-tile-label">{copy.short}</span>
    </button>
  );
}

export default function CategoryGrid({
  active,
  sheet,
  onSheet,
  onFilter,
}: {
  active: string;
  sheet: boolean;
  onSheet: (open: boolean) => void;
  onFilter: (id: string) => void;
}) {
  const router = useRouter();
  const { lang, t } = useI18n();

  useEffect(() => {
    if (!sheet) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, onSheet]);

  const pick = (tile: HomeTile) => {
    if (tile.action === "sheet") {
      onSheet(true);
      return;
    }
    if (tile.action === "route" && tile.href) {
      router.push(tile.href);
      onSheet(false);
      return;
    }
    onFilter(tile.id);
    onSheet(false);
  };

  const overlay = sheet ? (
    <div className="cat-sheet" role="presentation" onClick={() => onSheet(false)}>
      <div className="cat-sheet-panel sheet-pop" role="dialog" aria-label={t("cat.all")} onClick={(event) => event.stopPropagation()}>
        <div className="cat-sheet-bar">
          <p>{t("cat.all")}</p>
          <button type="button" className="soft-icon-btn" aria-label={t("close")} onClick={() => onSheet(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="cat-sheet-grid">
          {sheetTiles().map((tile) => {
            const copy = tileCopy(tile.id, lang);
            const Icon = ICONS[tile.icon] || Home;
            const on = active === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                className={on ? "cat-sheet-row is-on" : "cat-sheet-row"}
                onClick={() => pick(tile)}
              >
                <Icon size={18} strokeWidth={1.6} />
                <span>{copy.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="cat-grid no-scrollbar rail-fade" role="list">
        {HOME_TILES.map((tile) => (
          <TileButton key={tile.id} tile={tile} active={active === tile.id} onPick={pick} />
        ))}
      </div>
      {overlay && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
    </>
  );
}
