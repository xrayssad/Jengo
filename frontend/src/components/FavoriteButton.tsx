"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const KEY = "jengo_favorites";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function FavoriteButton({
  listingId,
  size = 20,
}: {
  listingId: string;
  size?: number;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(read().includes(listingId));
  }, [listingId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = read();
    const next = cur.includes(listingId)
      ? cur.filter((id) => id !== listingId)
      : [listingId, ...cur];
    localStorage.setItem(KEY, JSON.stringify(next));
    setOn(next.includes(listingId));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Vipendwa"
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}
    >
      <Heart
        size={size}
        color={on ? "#A6452E" : "#8B5E3C"}
        fill={on ? "#A6452E" : "none"}
      />
    </button>
  );
}
