"use client";

import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { likeListing } from "@/lib/api";
import { isLiked, setLiked } from "@/lib/social";

export default function LikeButton({ id, count }: { id: string; count?: number }) {
  const [on, setOn] = useState(false);
  const [n, setN] = useState(count || 0);
  const [ready, setReady] = useState(false);

  if (!ready && typeof window !== "undefined") {
    setReady(true);
    setOn(isLiked(id));
  }

  const press = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !on;
    setOn(next);
    setLiked(id, next);
    setN((v) => Math.max(0, v + (next ? 1 : -1)));
    try {
      const server = await likeListing(id, next);
      setN(server);
    } catch {
      /* idadi ya simu inabaki ikiwa seva haina column bado */
    }
  };

  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={press} className="flex items-center gap-1.5" aria-label="Like">
      <Heart size={22} color={on ? "#A6452E" : "#2E1A0F"} fill={on ? "#A6452E" : "none"} />
      <span className="text-sm font-semibold" style={{ color: "#2E1A0F" }}>{n}</span>
    </button>
  );
}
