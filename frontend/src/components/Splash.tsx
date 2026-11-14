"use client";

import { useLayoutEffect, useState } from "react";
import { useT } from "@/lib/i18n";

const DOTS = [
  [8, 18], [18, 70], [28, 30], [36, 82], [46, 12], [54, 58],
  [62, 24], [70, 78], [78, 40], [86, 16], [14, 48], [24, 90],
  [40, 44], [58, 86], [72, 8], [90, 62], [32, 64], [84, 34],
  [6, 40], [48, 72], [66, 50], [94, 22],
];

export default function Splash() {
  const t = useT();
  const [phase, setPhase] = useState<"off" | "in" | "out">("off");

  useLayoutEffect(() => {
    if (document.documentElement.dataset.splash === "off") return;
    setPhase("in");
    const out = window.setTimeout(() => setPhase("out"), 1300);
    const done = window.setTimeout(() => {
      try {
        sessionStorage.setItem("jengo_splash", "1");
      } catch {
        /* ignore */
      }
      document.documentElement.dataset.splash = "off";
      setPhase("off");
    }, 1600);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, []);

  const skip = () => {
    if (phase !== "in") return;
    setPhase("out");
    window.setTimeout(() => {
      try {
        sessionStorage.setItem("jengo_splash", "1");
      } catch {
        /* ignore */
      }
      document.documentElement.dataset.splash = "off";
      setPhase("off");
    }, 300);
  };

  if (phase === "off") return null;

  return (
    <button type="button" className={phase === "out" ? "splash is-out" : "splash"} onClick={skip} aria-label={t("splash.skip")}>
      <span className="splash-field" aria-hidden>
        {DOTS.map(([left, delay], i) => (
          <span key={i} className="splash-dot" style={{ left: `${left}%`, animationDelay: `${delay / 80}s` }} />
        ))}
      </span>
      <span className="splash-logo">Jengo</span>
      <span className="splash-tag">{t("splash.tag")}</span>
    </button>
  );
}
