"use client";

import { useEffect, useState } from "react";

export default function PerfDebug() {
  const [text, setText] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (new URLSearchParams(window.location.search).get("debugPerf") !== "1") return;
    let frames = 0;
    let last = performance.now();
    let fps = 0;
    let longTask = 0;
    let raf = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 500) {
        fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
        setText(`${fps} fps${longTask ? ` · ${longTask}ms` : ""}`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > longTask) longTask = Math.round(entry.duration);
        }
      });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      observer = null;
    }
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);

  if (!text) return null;
  return <p className="perf-debug">{text}</p>;
}
