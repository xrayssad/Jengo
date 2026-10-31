"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clapperboard, Plus } from "lucide-react";
import PosterName from "@/components/PosterName";
import ReelActions from "@/components/ReelActions";
import { fetchReels, getAuthUser, type Reel } from "@/lib/api";

function ReelSlide({
  item,
  active,
}: {
  item: Reel;
  active: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (active) {
      el.play().catch(() => undefined);
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [active]);

  return (
    <section className="reel-slide relative snap-start snap-always">
      <video
        ref={video}
        src={item.video_url}
        poster={item.thumb_url || undefined}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        loop
        muted={muted}
        preload={active ? "auto" : "metadata"}
        onClick={() => setMuted((cur) => !cur)}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(17,12,9,0.28) 0%, transparent 22%, transparent 58%, rgba(17,12,9,0.78) 100%)" }} />
      <div className="absolute right-3 bottom-28 z-10">
        <ReelActions item={item} />
      </div>
      <div className="absolute left-4 right-20 bottom-8 z-10">
        <PosterName item={item} tone="photo" />
        {item.caption ? (
          <p className="text-sm mt-2 leading-snug" style={{ color: "#FFF6ED", textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}>
            {item.caption}
          </p>
        ) : null}
        <p className="text-[11px] mt-2" style={{ color: "rgba(255,246,237,0.72)" }}>
          {muted ? "Tap for sound" : "Sound on"}
        </p>
      </div>
    </section>
  );
}

export default function ReelsPage() {
  const [items, setItems] = useState<Reel[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const signedIn = Boolean(getAuthUser());

  useEffect(() => {
    let stop = false;
    fetchReels(40)
      .then((res) => {
        if (!stop) setItems(res.items || []);
      })
      .catch((err) => {
        if (!stop) setError(err instanceof Error ? err.message : "Could not load reels");
      });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const slides = Array.from(root.querySelectorAll("[data-reel]"));
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!hit) return;
        const i = Number((hit.target as HTMLElement).dataset.reel);
        if (Number.isFinite(i)) setActive(i);
      },
      { root, threshold: 0.65 },
    );
    slides.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  return (
    <main className="reel-stage">
      <header className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: "rgba(255,246,237,0.72)" }}>Jengo</p>
          <h1 className="font-heading text-3xl leading-none" style={{ color: "#FFF6ED" }}>Reels</h1>
        </div>
        <Link
          href={signedIn ? "/reels/new" : "/login"}
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,246,237,0.16)", boxShadow: "0 0 0 1px rgba(255,246,237,0.28)" }}
          aria-label="Post a reel"
        >
          <Plus size={20} color="#FFF6ED" strokeWidth={2.4} />
        </Link>
      </header>

      {error ? (
        <div className="h-full flex items-center justify-center px-8 text-center">
          <p className="text-sm" style={{ color: "#FFF6ED" }}>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center px-8 text-center">
          <Clapperboard size={36} color="#C4A35A" />
          <p className="font-heading text-3xl mt-4" style={{ color: "#FFF6ED" }}>No reels yet</p>
          <p className="text-sm mt-2" style={{ color: "rgba(255,246,237,0.72)" }}>Post a short walk-through of a room, shop or site.</p>
          <Link href={signedIn ? "/reels/new" : "/login"} className="btn-primary mt-5 px-5 py-3 rounded-full text-sm font-semibold">
            Post a reel
          </Link>
        </div>
      ) : (
        <div ref={scroller} className="reel-scroller">
          {items.map((item, i) => (
            <div key={item.id} data-reel={i} className="h-full">
              <ReelSlide item={item} active={i === active} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
