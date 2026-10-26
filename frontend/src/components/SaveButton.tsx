"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { Bookmark } from "lucide-react";
import type { Listing } from "@/lib/api";
import { isSaved, toggleSaved } from "@/lib/social";

export default function SaveButton({
  item,
  className,
  style,
  size = 22,
}: {
  item: Listing;
  className?: string;
  style?: CSSProperties;
  size?: number;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isSaved(item.id)), [item.id]);

  const press = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOn(toggleSaved(item));
  };

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
      <Bookmark size={size} color="var(--ink)" fill={on ? "var(--ink)" : "none"} />
    </button>
  );
}
