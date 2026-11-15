"use client";

import { useEffect, useRef, useState } from "react";
import { fetchListings, peekListings } from "@/lib/api";
import { isLiteDevice } from "@/lib/device";
import { useT } from "@/lib/i18n";
import { INTRO_DURATION_MS, INTRO_EVERY_LAUNCH, INTRO_SKIP_AFTER_MS, INTRO_SKIPPABLE } from "@/lib/productFlags";

const LINES = ["splash.line1", "splash.line2", "splash.line3"] as const;

function markSeen() {
  try {
    sessionStorage.setItem("jengo_splash", "1");
  } catch {
    /* ignore */
  }
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
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saved = (() => {
      try {
        return sessionStorage.getItem("jengo_splash") === "1";
      } catch {
        return false;
      }
    })();
    const deep = window.location.pathname.startsWith("/tangazo/") || window.location.pathname.startsWith("/listing/");
    if (deep || (saved && !INTRO_EVERY_LAUNCH) || document.documentElement.dataset.splash === "off" && !INTRO_EVERY_LAUNCH) {
      setPhase("off");
      return;
    }
    setReduce(motion);
    setLite(isLiteDevice());
    setPhase("in");
    stop.current = false;
    const duration = motion ? 1500 : INTRO_DURATION_MS;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (stop.current) return;
      const elapsed = now - started;
      setProgress(Math.max(0, Math.min(1, elapsed / duration)));
      if (!motion) {
        if (elapsed >= 1200 && elapsed < 2800) setLine(0);
        else if (elapsed >= 2800 && elapsed < 4400) setLine(1);
        else if (elapsed >= 4400) setLine(2);
        if (INTRO_SKIPPABLE && elapsed >= INTRO_SKIP_AFTER_MS) setCanSkip(true);
        if (elapsed >= duration - 300) setPhase("out");
      }
      if (elapsed >= duration) {
        markSeen();
        setPhase("off");
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      stop.current = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const skip = () => {
    if (!canSkip && !reduce) return;
    stop.current = true;
    setPhase("out");
    window.setTimeout(() => {
      markSeen();
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
