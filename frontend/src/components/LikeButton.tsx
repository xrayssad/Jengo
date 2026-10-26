"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { likeListing } from "@/lib/api";
import { isLiked, setLiked } from "@/lib/social";
import { useInboxLive } from "./MqttInbox";

type LikePing = { listing_id?: string; likes_count?: number };

export default function LikeButton({ id, count }: { id: string; count?: number }) {
  const [on, setOn] = useState(false);
  const [n, setN] = useState(count || 0);
  const skipProps = useRef(false);
  const { watchListing } = useInboxLive();

  useEffect(() => {
    setOn(isLiked(id));
    skipProps.current = false;
  }, [id]);

  useEffect(() => {
    if (skipProps.current) return;
    if (typeof count === "number") setN(count);
  }, [count]);

  useEffect(() => watchListing(id), [id, watchListing]);

  useEffect(() => {
    const onLike = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as LikePing;
      if (String(d.listing_id || "") !== String(id)) return;
      if (typeof d.likes_count === "number") setN(d.likes_count);
    };
    window.addEventListener("jengo-like", onLike);
    return () => window.removeEventListener("jengo-like", onLike);
  }, [id]);

  const press = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !on;
    skipProps.current = true;
    setOn(next);
    setLiked(id, next);
    const nextCount = Math.max(0, n + (next ? 1 : -1));
    setN(nextCount);
    window.dispatchEvent(new CustomEvent("jengo-like", { detail: { listing_id: id, likes_count: nextCount } }));
    try {
      const server = await likeListing(id, next);
      setN(server);
      window.dispatchEvent(new CustomEvent("jengo-like", { detail: { listing_id: id, likes_count: server } }));
    } catch {
      /* idadi ya simu inabaki ikiwa seva haina column bado */
    }
  };

  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={press} className="flex items-center gap-1.5" aria-label="Like">
      <Heart size={22} color={on ? "var(--error)" : "var(--ink)"} fill={on ? "var(--error)" : "none"} />
      <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{n}</span>
    </button>
  );
}
