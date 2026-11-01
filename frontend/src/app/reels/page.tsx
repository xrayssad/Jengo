"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Pause, Play, Plus, Volume2, VolumeX } from "lucide-react";
import PosterName from "@/components/PosterName";
import ReelActions from "@/components/ReelActions";
import { fetchReels, getAuthUser, type Reel } from "@/lib/api";
import { hushAllReels, hushVideo, watchReelVideo } from "@/lib/reelsMedia";

function ReelSkeleton() {
  return (
    <div className="reel-skeleton" aria-busy="true" aria-label="Loading reels">
      <div className="reel-skel-shimmer" />
      <div className="reel-skel-meta">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="reel-skel-bone h-10 w-10 rounded-full" />
            <span className="reel-skel-bone h-3 w-28" />
          </div>
          <span className="reel-skel-bone mt-4 h-3 w-52 block" />
          <span className="reel-skel-bone mt-2 h-3 w-36 block" />
        </div>
        <div className="flex flex-col items-center gap-5">
          <span className="reel-skel-bone h-10 w-10 rounded-full" />
          <span className="reel-skel-bone h-10 w-10 rounded-full" />
          <span className="reel-skel-bone h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ReelSlide({
  item,
  active,
  live,
  muted,
  onMutedChange,
}: {
  item: Reel;
  active: boolean;
  live: boolean;
  muted: boolean;
  onMutedChange: (next: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const tap = useRef<{ y: number; t: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);
  const flashTimer = useRef<number>(0);

  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const unwatch = watchReelVideo(el);
    el.muted = muted;
    el.defaultMuted = muted;
    el.volume = 1;
    let alive = true;

    const shouldPlay = () => alive && live && active && !paused && !document.hidden;

    const playIfNeeded = () => {
      if (!shouldPlay()) {
        hushVideo(el);
        return;
      }
      el.play()
        .then(() => {
          if (!shouldPlay()) hushVideo(el);
        })
        .catch(() => undefined);
    };

    if (!active || !live) el.currentTime = 0;
    playIfNeeded();

    const onHide = () => {
      if (document.hidden) hushVideo(el);
      else playIfNeeded();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);

    return () => {
      alive = false;
      hushVideo(el);
      unwatch();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [active, live, muted, paused]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const applyMute = (next: boolean) => {
    const el = video.current;
    if (el) {
      el.muted = next;
      el.defaultMuted = next;
      el.volume = 1;
    }
    onMutedChange(next);
  };

  const toggleSound = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    applyMute(!muted);
  };

  const showFlash = (kind: "play" | "pause") => {
    setFlash(kind);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 480);
  };

  const togglePlayback = () => {
    if (!active || !live) return;
    const next = !paused;
    setPaused(next);
    showFlash(next ? "pause" : "play");
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
        togglePlayback();
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
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        onPlaying={() => setReady(true)}
      />
      {!ready ? <ReelSkeleton /> : null}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(17,12,9,0.22) 0%, transparent 24%, transparent 62%, rgba(17,12,9,0.2) 100%)" }}
      />
      {flash ? (
        <div className="reel-flash" aria-hidden>
          <div className="reel-flash-icon">
            {flash === "pause" ? <Pause size={30} color="#FFF6ED" fill="#FFF6ED" /> : <Play size={30} color="#FFF6ED" fill="#FFF6ED" />}
          </div>
        </div>
      ) : null}
      {paused && !flash ? (
        <div className="reel-flash" aria-hidden>
          <div className="reel-flash-icon reel-flash-hold">
            <Play size={30} color="#FFF6ED" fill="#FFF6ED" />
          </div>
        </div>
      ) : null}
      <div className="reel-meta">
        <div className="min-w-0 flex-1 pointer-events-none">
          <PosterName item={item} tone="photo" />
          {item.caption ? (
            <p className="text-sm mt-2 leading-snug line-clamp-4" style={{ color: "#FFF6ED", textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}>
              {item.caption}
            </p>
          ) : null}
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,246,237,0.72)" }}>
            {paused ? "Paused · tap to play" : "Tap to pause"}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const path = usePathname() || "";
  const live = path === "/reels";
  const signedIn = Boolean(getAuthUser());

  useEffect(() => {
    let stop = false;
    fetchReels(40)
      .then((res) => {
        if (!stop) setItems(res.items || []);
      })
      .catch((err) => {
        if (!stop) setError(err instanceof Error ? err.message : "Could not load reels");
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
      hushAllReels();
    };
  }, []);

  useEffect(() => {
    if (!live) hushAllReels();
  }, [live]);

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
        <div className="w-full max-w-[480px] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs" style={{ color: "rgba(255,246,237,0.72)" }}>Jengo</p>
            <h1 className="font-heading text-3xl leading-none" style={{ color: "#FFF6ED" }}>Reels</h1>
          </div>
          <Link
            href={signedIn ? "/reels/new" : "/login"}
            className="reel-add-btn shrink-0"
            aria-label="Add new reel"
            style={{ background: "rgba(17, 12, 9, 0.32)", color: "#FFFFFF", border: "1.5px solid #FFFFFF" }}
          >
            <Plus size={16} strokeWidth={2.6} color="#FFFFFF" />
            <span>Add reel</span>
          </Link>
        </div>
      </header>

      {error ? (
        <div className="h-full flex items-center justify-center px-8 text-center">
          <p className="text-sm" style={{ color: "#FFF6ED" }}>{error}</p>
        </div>
      ) : loading ? (
        <ReelSkeleton />
      ) : items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center px-8 text-center">
          <Clapperboard size={36} color="#C4A35A" />
          <p className="font-heading text-3xl mt-4" style={{ color: "#FFF6ED" }}>No reels yet</p>
          <p className="text-sm mt-2" style={{ color: "rgba(255,246,237,0.72)" }}>Post a short walk-through of a room, shop or site.</p>
          <Link
            href={signedIn ? "/reels/new" : "/login"}
            className="reel-add-btn mt-5"
            style={{ background: "rgba(17, 12, 9, 0.32)", color: "#FFFFFF", border: "1.5px solid #FFFFFF" }}
          >
            <Plus size={16} strokeWidth={2.6} color="#FFFFFF" />
            <span>Add reel</span>
          </Link>
        </div>
      ) : (
        <div ref={scroller} className="reel-scroller">
          {items.map((item, i) => (
            <div key={item.id} data-reel={i} className="h-full">
              <ReelSlide item={item} active={i === active} live={live} muted={muted} onMutedChange={setMuted} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
