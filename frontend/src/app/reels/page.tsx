"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Pause, Play, Plus, Volume2, VolumeX } from "lucide-react";
import PosterName from "@/components/PosterName";
import ReelActions from "@/components/ReelActions";
import { fetchReels, getAuthUser, type Reel } from "@/lib/api";
import {
  hushAllReels,
  hushVideo,
  reelPrefetchSrc,
  watchReelDataSaver,
  watchReelVideo,
} from "@/lib/reelsMedia";

type ReelMode = "play" | "prefetch" | "poster";

function formatReelTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ReelSeek({ video, active }: { video: RefObject<HTMLVideoElement | null>; active: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const [now, setNow] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const stamp = () => {
      if (!drag.current) {
        setNow(el.currentTime || 0);
        const next = el.duration;
        if (Number.isFinite(next) && next > 0) setDur(next);
      }
    };
    const onMeta = () => {
      const next = el.duration;
      if (Number.isFinite(next) && next > 0) setDur(next);
    };
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    onMeta();
    stamp();
    if (!active) {
      return () => {
        el.removeEventListener("loadedmetadata", onMeta);
        el.removeEventListener("durationchange", onMeta);
      };
    }
    let raf = 0;
    const sync = () => {
      stamp();
      raf = window.requestAnimationFrame(sync);
    };
    raf = window.requestAnimationFrame(sync);
    return () => {
      window.cancelAnimationFrame(raf);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
    };
  }, [video, active]);

  const seekAt = (clientX: number) => {
    const el = video.current;
    const bar = track.current;
    if (!el || !bar || !dur) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    el.currentTime = pct * dur;
    setNow(el.currentTime);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekAt(e.clientX);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    e.preventDefault();
    e.stopPropagation();
    seekAt(e.clientX);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current = false;
  };

  const pct = dur > 0 ? Math.min(100, (now / dur) * 100) : 0;

  return (
    <div
      className="reel-seek"
      data-reel-seek
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 12, padding: "0 14px 10px" }}
    >
      <div className="reel-seek-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          className="reel-seek-time"
          style={{ color: "#FFF6ED", fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: "2.15em", textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}
        >
          {formatReelTime(now)}
        </span>
        <div
          ref={track}
          className="reel-seek-track"
          role="slider"
          tabIndex={0}
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={Math.floor(dur) || 0}
          aria-valuenow={Math.floor(now)}
          aria-valuetext={`${formatReelTime(now)} of ${formatReelTime(dur)}`}
          style={{ flex: 1, height: 22, display: "flex", alignItems: "center", touchAction: "none", cursor: "pointer" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            const el = video.current;
            if (!el || !dur) return;
            if (e.key === "ArrowRight") {
              e.preventDefault();
              el.currentTime = Math.min(dur, el.currentTime + 2);
              setNow(el.currentTime);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              el.currentTime = Math.max(0, el.currentTime - 2);
              setNow(el.currentTime);
            }
          }}
        >
          <div className="reel-seek-rail" style={{ position: "relative", width: "100%", height: 3, borderRadius: 999, background: "rgba(255,246,237,0.28)" }}>
            <div className="reel-seek-fill" style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "#FFF6ED" }} />
            <span
              className="reel-seek-knob"
              style={{
                position: "absolute",
                top: "50%",
                left: `${pct}%`,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#FFF6ED",
                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
        <span
          className="reel-seek-time reel-seek-time-end"
          style={{ color: "#FFF6ED", fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: "2.15em", textAlign: "right", textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}
        >
          {formatReelTime(dur)}
        </span>
      </div>
    </div>
  );
}

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
  mode,
  live,
  muted,
  onMutedChange,
}: {
  item: Reel;
  mode: ReelMode;
  live: boolean;
  muted: boolean;
  onMutedChange: (next: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const tap = useRef<{ y: number; t: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);
  const flashTimer = useRef<number>(0);
  const retries = useRef(0);
  const mountVideo = mode === "play" || mode === "prefetch";
  const playing = mode === "play";

  useEffect(() => {
    if (!playing) setPaused(false);
  }, [playing]);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    retries.current = 0;
  }, [item.video_url, mode]);

  // Keep the element in the watch registry only while a player is mounted.
  // Do not re-run on play↔prefetch so a warm buffer is not wiped mid-swipe.
  useEffect(() => {
    if (!mountVideo) return;
    const el = video.current;
    if (!el) return;
    return watchReelVideo(el);
  }, [mountVideo, item.id]);

  useEffect(() => {
    const el = video.current;
    if (!el || !mountVideo) return;

    let alive = true;
    el.volume = 1;

    if (mode === "prefetch") {
      const warm = reelPrefetchSrc(item.video_url);
      el.muted = true;
      el.defaultMuted = true;
      el.preload = "auto";
      el.loop = false;
      if (el.getAttribute("src") !== warm) {
        el.src = warm;
        el.load();
      }
      const stopWarm = () => {
        if (!alive) return;
        hushVideo(el);
        try {
          el.preload = "none";
        } catch {
          /* ignore */
        }
      };
      const onReady = () => {
        stopWarm();
        try {
          if (el.currentTime > 0.05) el.currentTime = 0;
        } catch {
          /* ignore */
        }
      };
      el.addEventListener("loadeddata", onReady);
      el.addEventListener("canplay", onReady);
      // Nudge some mobile browsers to actually fetch the short start.
      el.play()
        .then(() => {
          if (!alive) return;
          window.setTimeout(stopWarm, 120);
        })
        .catch(() => undefined);

      return () => {
        alive = false;
        el.removeEventListener("loadeddata", onReady);
        el.removeEventListener("canplay", onReady);
        hushVideo(el);
      };
    }

    // Active / play mode
    el.muted = muted;
    el.defaultMuted = muted;
    el.loop = true;
    el.preload = "auto";
    const full = String(item.video_url || "").split("#")[0];
    if (el.getAttribute("src") !== full) {
      el.src = full;
      el.load();
    }

    const shouldPlay = () => alive && live && playing && !paused && !document.hidden;

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
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [mode, mountVideo, live, muted, paused, playing, item.video_url]);

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
    if (!playing || !live) return;
    const next = !paused;
    setPaused(next);
    showFlash(next ? "pause" : "play");
  };

  const retryPlay = () => {
    const el = video.current;
    if (!el || !playing || retries.current >= 4) {
      setFailed(true);
      return;
    }
    retries.current += 1;
    window.setTimeout(() => {
      el.load();
      el.play().catch(() => undefined);
    }, 900 * retries.current);
  };

  const videoVisible = playing && ready && !failed;

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
        if ((e.target as HTMLElement).closest("button,a,[data-reel-seek]")) return;
        if (Math.abs(e.clientY - start.y) > 12 || Date.now() - start.t > 400) return;
        togglePlayback();
      }}
    >
      {item.thumb_url ? (
        <img
          src={item.thumb_url}
          alt=""
          className="reel-video pointer-events-none"
          decoding="async"
          loading={mode === "poster" ? "lazy" : "eager"}
          draggable={false}
          style={{ zIndex: 0 }}
        />
      ) : (
        <div className="reel-video pointer-events-none" style={{ zIndex: 0, background: "#110C09" }} aria-hidden />
      )}

      {mountVideo ? (
        <video
          ref={video}
          className="reel-video pointer-events-none"
          playsInline
          loop={playing}
          muted={playing ? muted : true}
          preload="auto"
          controls={false}
          disablePictureInPicture
          style={{
            zIndex: 1,
            opacity: videoVisible ? 1 : 0,
            transition: "opacity 280ms ease",
          }}
          onLoadedData={() => {
            if (playing) setReady(true);
          }}
          onCanPlay={() => {
            if (playing) setReady(true);
          }}
          onPlaying={() => {
            if (playing) setReady(true);
          }}
          onError={() => {
            if (playing) retryPlay();
          }}
        />
      ) : null}

      {failed && playing ? (
        <div className="reel-skeleton" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", zIndex: 6 }}>
          <p className="text-sm font-semibold" style={{ color: "#FFF6ED" }}>This reel could not play on this phone</p>
        </div>
      ) : null}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2, background: "linear-gradient(180deg, rgba(17,12,9,0.22) 0%, transparent 24%, transparent 62%, rgba(17,12,9,0.2) 100%)" }}
      />
      {playing && flash ? (
        <div className="reel-flash" aria-hidden>
          <div className="reel-flash-icon">
            {flash === "pause" ? <Pause size={30} color="#FFF6ED" fill="#FFF6ED" /> : <Play size={30} color="#FFF6ED" fill="#FFF6ED" />}
          </div>
        </div>
      ) : null}
      {playing && paused && !flash ? (
        <div className="reel-flash" aria-hidden>
          <div className="reel-flash-icon reel-flash-hold">
            <Play size={30} color="#FFF6ED" fill="#FFF6ED" />
          </div>
        </div>
      ) : null}
      <div className="reel-meta" style={{ paddingBottom: 48 }}>
        <div className="min-w-0 flex-1 pointer-events-none">
          <PosterName item={item} tone="photo" />
          {item.caption ? (
            <p className="text-sm mt-2 leading-snug line-clamp-4" style={{ color: "#FFF6ED", textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}>
              {item.caption}
            </p>
          ) : null}
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,246,237,0.72)" }}>
            {playing ? (paused ? "Paused · tap to play" : "Tap to pause") : "Swipe to play"}
          </p>
        </div>
        <div className="shrink-0">
          <ReelActions item={item} />
          <button
            type="button"
            onClick={toggleSound}
            className="mt-5 mx-auto flex flex-col items-center gap-1"
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            disabled={!playing}
            style={{ opacity: playing ? 1 : 0.55 }}
          >
            {muted ? <VolumeX size={26} color="#FFF6ED" /> : <Volume2 size={26} color="#FFF6ED" />}
            <span className="text-xs font-semibold" style={{ color: "#FFF6ED" }}>{muted ? "Muted" : "Sound"}</span>
          </button>
        </div>
      </div>
      {playing ? <ReelSeek video={video} active={playing && live} /> : null}
    </section>
  );
}

export default function ReelsPage() {
  const [items, setItems] = useState<Reel[]>([]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataSaver, setDataSaver] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const path = usePathname() || "";
  const live = path === "/reels";
  const signedIn = Boolean(getAuthUser());

  useEffect(() => watchReelDataSaver(setDataSaver), []);

  useEffect(() => {
    let stop = false;
    // Metadata only — video bytes are fetched by the active/prefetch players below.
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

  const modeFor = (i: number): ReelMode => {
    if (i === active) return "play";
    if (!dataSaver && i === active + 1) return "prefetch";
    return "poster";
  };

  return (
    <main className="reel-stage">
      <header
        className="absolute top-0 left-0 right-0 z-20 px-4 flex items-center justify-center"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <div className="w-full max-w-[480px] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: "rgba(255,246,237,0.72)" }}>Jengo</p>
            <h1 className="text-3xl font-bold leading-none tracking-tight" style={{ color: "#FFF6ED" }}>Reels</h1>
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
          <p className="text-3xl font-bold mt-4 tracking-tight" style={{ color: "#FFF6ED" }}>No reels yet</p>
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
              <ReelSlide item={item} mode={modeFor(i)} live={live} muted={muted} onMutedChange={setMuted} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
