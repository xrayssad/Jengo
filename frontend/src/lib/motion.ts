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

const HAPTIC_KEY = "jengo_haptics";

export function hapticPref() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(HAPTIC_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setHapticPref(on: boolean) {
  try {
    localStorage.setItem(HAPTIC_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function hapticsEnabled() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return hapticPref();
}

export function haptic(kind: "light" | "medium" | "success" | number = "light") {
  if (!hapticsEnabled()) return;
  const pattern: number | number[] =
    kind === "success" ? [8, 30, 12] : kind === "medium" ? 16 : kind === "light" ? 8 : Math.max(0, kind);
  try {
    navigator.vibrate?.(pattern);
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
