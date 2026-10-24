"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { Heart } from "lucide-react";

const KEY = "jengo_favorites";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function FavoriteButton({
  id,
  listingId,
  size = 20,
  className,
  style,
}: {
  id?: string;
  listingId?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const itemId = id || listingId || "";
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(read().includes(itemId));
  }, [itemId]);

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const toggle = (e: MouseEvent) => {
    stop(e);
    if (!itemId) return;
    const cur = read();
    const next = cur.includes(itemId) ? cur.filter((x) => x !== itemId) : [itemId, ...cur];
    localStorage.setItem(KEY, JSON.stringify(next));
    setOn(next.includes(itemId));
  };

  return (
    <button
      type="button"
      aria-label={on ? "Ondoa vipendwa" : "Weka vipendwa"}
      onMouseDown={stop}
      onClick={toggle}
      className={className || "w-10 h-10 rounded-full flex items-center justify-center"}
      style={style || { backgroundColor: "white", border: "1.5px solid #3D2415" }}
    >
      <Heart size={size} color={on ? "#A6452E" : "#8B5E3C"} fill={on ? "#A6452E" : "none"} />
    </button>
  );
}
