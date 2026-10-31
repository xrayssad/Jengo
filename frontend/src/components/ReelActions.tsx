"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Bookmark, Heart } from "lucide-react";
import { likeReel, type Reel } from "@/lib/api";
import { isLiked, isSaved, setLiked, toggleSavedReel } from "@/lib/social";

type LikePing = { reel_id?: string; likes_count?: number };

export default function ReelActions({ item }: { item: Reel }) {
  const [liked, setOn] = useState(false);
  const [n, setN] = useState(item.likes_count || 0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOn(isLiked(item.id));
    setSaved(isSaved(item.id));
    setN(item.likes_count || 0);
  }, [item.id, item.likes_count]);

  useEffect(() => {
    const onLike = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as LikePing;
      if (String(d.reel_id || "") !== String(item.id)) return;
      if (typeof d.likes_count === "number") setN(d.likes_count);
    };
    const onSaved = () => setSaved(isSaved(item.id));
    window.addEventListener("jengo-reel-like", onLike);
    window.addEventListener("jengo-saved", onSaved);
    return () => {
      window.removeEventListener("jengo-reel-like", onLike);
      window.removeEventListener("jengo-saved", onSaved);
    };
  }, [item.id]);

  const pressLike = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !liked;
    setOn(next);
    setLiked(item.id, next);
    const nextCount = Math.max(0, n + (next ? 1 : -1));
    setN(nextCount);
    window.dispatchEvent(new CustomEvent("jengo-reel-like", { detail: { reel_id: item.id, likes_count: nextCount } }));
    try {
      const server = await likeReel(item.id, next);
      setN(server);
      window.dispatchEvent(new CustomEvent("jengo-reel-like", { detail: { reel_id: item.id, likes_count: server } }));
    } catch {
      /* keep optimistic count */
    }
  };

  const pressSave = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleSavedReel(item));
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <button type="button" onClick={pressLike} className="flex flex-col items-center gap-1" aria-label="Like">
        <Heart size={28} color="#FFF6ED" fill={liked ? "#E07A5F" : "none"} />
        <span className="text-xs font-semibold" style={{ color: "#FFF6ED" }}>{n}</span>
      </button>
      <button type="button" onClick={pressSave} className="flex flex-col items-center gap-1" aria-label={saved ? "Remove from Saved" : "Save reel"}>
        <Bookmark size={26} color="#FFF6ED" fill={saved ? "#FFF6ED" : "none"} />
        <span className="text-xs font-semibold" style={{ color: "#FFF6ED" }}>{saved ? "Saved" : "Save"}</span>
      </button>
    </div>
  );
}
