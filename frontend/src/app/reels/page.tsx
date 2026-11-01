"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Clapperboard, Plus, Volume2, VolumeX } from "lucide-react";
import PosterName from "@/components/PosterName";
import ReelActions from "@/components/ReelActions";
import { fetchReels, getAuthUser, type Reel } from "@/lib/api";

function ReelSlide({
  item,
  active,
  muted,
  onMutedChange,
}: {
  item: Reel;
  active: boolean;
  muted: boolean;
  onMutedChange: (next: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const tap = useRef<{ y: number; t: number } | null>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.muted = muted;
    el.defaultMuted = muted;
    el.volume = 1;
    if (active) {
      el.play().catch(() => undefined);
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [active, muted]);

  const applyMute = (next: boolean) => {
    const el = video.current;
    if (el) {
      el.muted = next;
      el.defaultMuted = next;
      el.volume = 1;
      if (active) el.play().catch(() => undefined);
    }
    onMutedChange(next);
  };

  const toggleSound = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    applyMute(!muted);
  };

  return (
    <section
      className="reel-slide relative snap-start snap-always"
      onPointerDown={(e) => {
        tap.current = { y: e.clientY, t: Date.now() };
      }}
      onPointerUp={(e) => {
        const start = tap.current;
        tap.current = null;
        if (!start) return;
        if ((e.target as HTMLElement).closest("button,a")) return;
        if (Math.abs(e.clientY - start.y) > 12 || Date.now() - start.t > 400) return;
        applyMute(!muted);
      }}
    >
      <video
        ref={video}
        src={item.video_url}
        poster={item.thumb_url || undefined}
        className="reel-video pointer-events-none"
        playsInline
        loop
        muted={muted}
        preload={active ? "auto" : "metadata"}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(17,12,9,0.22) 0%, transparent 24%, transparent 62%, rgba(17,12,9,0.2) 100%)" }}
      />
      <div className="reel-meta">
        <div className="min-w-0 flex-1 pointer-events-none">
          <PosterName item={item} tone="photo" />
          {item.caption ? (
            <p className="text-sm mt-2 leading-snug line-clamp-4" style={{ color: "#FFF6ED", textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}>
              {item.caption}
            </p>
          ) : null}
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,246,237,0.72)" }}>
            {muted ? "Tap for sound" : "Sound on"}
          </p>
        </div>
        <div className="shrink-0">
          <ReelActions item={item} />
          <button
            type="button"
            onClick={toggleSound}
            className="mt-5 mx-auto flex flex-col items-center gap-1"
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
          >
            {muted ? <VolumeX size={26} color="#FFF6ED" /> : <Volume2 size={26} color="#FFF6ED" />}
            <span className="text-xs font-semibold" style={{ color: "#FFF6ED" }}>{muted ? "Muted" : "Sound"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ReelsPage() {
  const [items, setItems] = useState<Reel[]>([]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
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
      <header
        className="absolute top-0 left-0 right-0 z-20 px-4 flex items-center justify-center"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <div className="w-full max-w-[480px] flex items-center justify-between">
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
        </div>
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
              <ReelSlide item={item} active={i === active} muted={muted} onMutedChange={setMuted} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
