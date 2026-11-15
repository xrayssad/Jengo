"use client";

import { useEffect, useRef, useState } from "react";
import { fetchListings, peekListings } from "@/lib/api";
import { isLiteDevice } from "@/lib/device";
import { clearIntroPending, introPending, introShouldPlay } from "@/lib/intro";
import { useT } from "@/lib/i18n";
import { INTRO_DURATION_MS, INTRO_SKIP_AFTER_MS, INTRO_SKIPPABLE } from "@/lib/productFlags";

const LINES = ["splash.line1", "splash.line2", "splash.line3"] as const;

function finish() {
  clearIntroPending();
  document.documentElement.dataset.splash = "off";
}

export default function Splash() {
  const t = useT();
  const [phase, setPhase] = useState<"off" | "in" | "out">("off");
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [lite, setLite] = useState(false);
  const stop = useRef(false);
  const playing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const job = fetchListings({ status: "active", limit: 40 }).catch(() => ({ items: peekListings({ status: "active", limit: 40 }) }));
    void job.then((res) => {
      if (cancelled) return;
      const urls = (res.items || []).flatMap((item) => item.images || []).filter(Boolean).slice(0, 4);
      for (const url of urls) {
        const img = new Image();
        img.decoding = "async";
        img.src = url;
      }
    });
    void document.fonts?.ready;
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const play = () => {
      if (playing.current) return;
      if (!introShouldPlay() && document.documentElement.dataset.splash !== "on") {
        finish();
        setPhase("off");
        return;
      }
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      playing.current = true;
      stop.current = false;
      setReduce(motion);
      setLite(isLiteDevice());
      setProgress(0);
      setLine(0);
      setCanSkip(false);
      setPhase("in");
      document.documentElement.dataset.splash = "on";
      const duration = motion ? 1500 : INTRO_DURATION_MS;
      const started = performance.now();
      const tick = (now: number) => {
        if (stop.current) return;
        const elapsed = now - started;
        setProgress(Math.max(0, Math.min(1, elapsed / duration)));
        if (!motion) {
          if (elapsed < 2800) setLine(0);
          else if (elapsed < 4400) setLine(1);
          else setLine(2);
          if (INTRO_SKIPPABLE && elapsed >= INTRO_SKIP_AFTER_MS) setCanSkip(true);
          if (elapsed >= duration - 300) setPhase("out");
        }
        if (elapsed >= duration) {
          playing.current = false;
          finish();
          setPhase("off");
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    play();
    const onLogin = () => {
      if (introPending()) play();
    };
    window.addEventListener("jengo-intro", onLogin);
    return () => {
      stop.current = true;
      playing.current = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("jengo-intro", onLogin);
    };
  }, []);

  const skip = () => {
    if (!canSkip && !reduce) return;
    stop.current = true;
    playing.current = false;
    setPhase("out");
    window.setTimeout(() => {
      finish();
      setPhase("off");
    }, 300);
  };

  if (phase === "off") return null;

  const dots = lite || reduce ? [] : Array.from({ length: 22 }, (_, i) => i);

  return (
    <div
      className={["splash", phase === "out" ? "is-out" : "", reduce ? "is-static" : ""].filter(Boolean).join(" ")}
      role="dialog"
      aria-label="Jengo"
      onClick={() => {
        if (canSkip || reduce) skip();
      }}
    >
      {dots.length ? (
        <span className="splash-field" aria-hidden>
          {dots.map((i) => (
            <span key={i} className="splash-dot" style={{ left: `${6 + ((i * 17) % 90)}%`, animationDelay: `${(i % 8) * 0.35}s` }} />
          ))}
        </span>
      ) : null}
      <p className="splash-logo">Jengo</p>
      {reduce ? <p className="splash-tag">{t("splash.line1")}</p> : (
        <p className="splash-tag" key={line}>{t(LINES[line])}</p>
      )}
      {INTRO_SKIPPABLE && canSkip ? (
        <button
          type="button"
          className="splash-skip"
          onClick={(event) => {
            event.stopPropagation();
            skip();
          }}
        >
          {t("splash.skip")}
        </button>
      ) : null}
      <span className="splash-progress" aria-hidden>
        <span style={{ transform: `scaleX(${progress})` }} />
      </span>
    </div>
  );
}
