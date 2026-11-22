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
    let lcp = 0;
    let cls = 0;
    let raf = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 500) {
        fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
        setText(`${fps} fps · LCP ${lcp || "—"} · CLS ${cls.toFixed(3)}${longTask ? ` · ${longTask}ms` : ""}`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const observers: PerformanceObserver[] = [];
    const watch = (type: string, onEntry: (entry: PerformanceEntry) => void) => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) onEntry(entry);
        });
        observer.observe({ type, buffered: true });
        observers.push(observer);
      } catch {
        /* this browser does not expose the metric */
      }
    };
    watch("longtask", (entry) => {
      if (entry.duration > longTask) longTask = Math.round(entry.duration);
    });
    watch("largest-contentful-paint", (entry) => {
      lcp = Math.round(entry.startTime);
    });
    watch("layout-shift", (entry) => {
      const row = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!row.hadRecentInput) cls += row.value || 0;
    });
    return () => {
      cancelAnimationFrame(raf);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  if (!text) return null;
  return <p className="perf-debug">{text}</p>;
}
