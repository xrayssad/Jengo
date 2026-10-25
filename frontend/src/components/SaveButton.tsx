"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Bookmark } from "lucide-react";
import type { Listing } from "@/lib/api";
import { isSaved, toggleSaved } from "@/lib/social";

export default function SaveButton({ item }: { item: Listing }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isSaved(item.id)), [item.id]);

  const press = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOn(toggleSaved(item));
  };

  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={press} aria-label="Favorites" className="flex items-center gap-1">
      <Bookmark size={22} color="#2E1A0F" fill={on ? "#2E1A0F" : "none"} />
    </button>
  );
}
