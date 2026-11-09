"use client";

import { useEffect, useState } from "react";

export const motionDur = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const tapSpring = { type: "spring" as const, stiffness: 380, damping: 30 };
export const moveSpring = { type: "spring" as const, stiffness: 260, damping: 28 };

export function haptic(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported */
  }
}

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduce;
}
