"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { Bookmark, Heart } from "lucide-react";
import type { Listing } from "@/lib/api";
import { isSaved, toggleSaved } from "@/lib/social";

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
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isSaved(item.id)), [item.id]);

  const press = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOn(toggleSaved(item));
  };

  const Icon = variant === "heart" ? Heart : Bookmark;
  const stroke = variant === "heart" ? (on ? "var(--error)" : "var(--ink)") : "var(--ink)";
  const fill = on ? (variant === "heart" ? "var(--error)" : "var(--ink)") : "none";

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={press}
      aria-label={on ? "Remove from Saved" : "Save listing"}
      className={className || "flex items-center gap-1"}
      style={style}
    >
      <Icon size={size} color={stroke} fill={fill} strokeWidth={1.8} />
    </button>
  );
}
