"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { Bookmark } from "lucide-react";
import type { Listing } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { haptic } from "@/lib/motion";
import { isSaved, toggleSaved } from "@/lib/social";
import HeartMark from "./HeartMark";

export default function SaveButton({
  item,
  className,
  style,
  size = 22,
  variant = "bookmark",
}: {
  item: Listing;
  className?: string;
  style?: CSSProperties;
  size?: number;
  variant?: "bookmark" | "heart";
}) {
  const t = useT();
  const [on, setOn] = useState(false);
  const [burst, setBurst] = useState<"like" | "unlike" | null>(null);
  useEffect(() => setOn(isSaved(item.id)), [item.id]);
  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(null), 520);
    return () => window.clearTimeout(t);
  }, [burst]);

  const press = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleSaved(item);
    setOn(next);
    if (variant === "heart") {
      setBurst(next ? "like" : "unlike");
      if (next) haptic(10);
    }
  };

  const Icon = Bookmark;
  const stroke = "currentColor";
  const fill = on ? "currentColor" : "none";

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={press}
      aria-label={on ? t("unsave") : t("save")}
      className={className || "flex items-center gap-1"}
      style={style}
    >
      {variant === "heart" ? (
        <HeartMark on={on} burst={burst} size={size} />
      ) : (
        <Icon size={size} color={stroke} fill={fill} strokeWidth={1.8} />
      )}
    </button>
  );
}
