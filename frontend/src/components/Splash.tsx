"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import JengoLogo from "@/components/JengoLogo";
import { fetchListings, peekListings } from "@/lib/api";
import { isLiteDevice } from "@/lib/device";
import { clearIntroPending, introPending, introShouldPlay } from "@/lib/intro";
import { useT } from "@/lib/i18n";
import { INTRO_DURATION_MS, INTRO_SKIP_AFTER_MS, INTRO_SKIPPABLE } from "@/lib/productFlags";

const LINES = ["splash.line1", "splash.line2", "splash.line3"] as const;

function finish() {
  clearIntroPending();
  document.documentElement.dataset.splash = "off";
  document.documentElement.dataset.intro = "0";
}

function hideBoot(fade: boolean) {
  const root = document.documentElement;
  if (!fade) {
    root.dataset.boot = "gone";
    return;
  }
  root.dataset.boot = "fade";
  window.setTimeout(() => {
    root.dataset.boot = "gone";
  }, 220);
}

export default function Splash() {
  const t = useT();
  const [phase, setPhase] = useState<"off" | "in" | "out">("off");
  const [canSkip, setCanSkip] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [lite, setLite] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.app = "1";
    let endTimer = 0;
    let skipTimer = 0;

    const play = () => {
      if (playing.current) return;
      if (!introShouldPlay() && document.documentElement.dataset.splash !== "on") {
        finish();
        setPhase("off");
        hideBoot(true);
        return;
      }
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      playing.current = true;
      stop.current = false;
      setReduce(motion);
      setLite(isLiteDevice());
      setCanSkip(motion);
      setPhase("in");
      document.documentElement.dataset.splash = "on";
      const duration = motion ? 1500 : INTRO_DURATION_MS;
      endTimer = window.setTimeout(() => {
        if (stop.current) return;
        playing.current = false;
        finish();
        setPhase("off");
      }, duration);
      skipTimer = window.setTimeout(() => setCanSkip(true), motion ? 0 : INTRO_SKIP_AFTER_MS);
    };

    play();
    const onLogin = () => {
      if (introPending()) play();
    };
    window.addEventListener("jengo-intro", onLogin);
    return () => {
      stop.current = true;
      playing.current = false;
      window.clearTimeout(endTimer);
      window.clearTimeout(skipTimer);
      window.removeEventListener("jengo-intro", onLogin);
    };
  }, []);

  useLayoutEffect(() => {
    if (phase !== "in") return;
    document.documentElement.dataset.intro = "1";
    hideBoot(false);
    const root = rootRef.current;
    if (!root) return;
    const seen = () => {
      root.dataset.logo = "1";
    };
    const letter = root.querySelector(".jengo-letter");
    letter?.addEventListener("animationstart", seen);
    root.addEventListener("animationstart", seen);
    const forceTimer = window.setTimeout(() => {
      if (root.dataset.logo !== "1") root.classList.add("is-forced");
    }, 800);
    return () => {
      letter?.removeEventListener("animationstart", seen);
      root.removeEventListener("animationstart", seen);
      window.clearTimeout(forceTimer);
    };
  }, [phase]);

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
      ref={rootRef}
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
      <div className="splash-brand">
        <JengoLogo variant="wordmark" size={78} animated={!reduce} title="Jengo" />
      </div>
      <div className="splash-tags">
        {(reduce ? LINES.slice(0, 1) : LINES).map((key) => (
          <p key={key} className="splash-tag">{t(key)}</p>
        ))}
      </div>
      {INTRO_SKIPPABLE ? (
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
        <span />
      </span>
    </div>
  );
}
