"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePrefersReducedMotion } from "@/lib/motion";

export default function FeatureHero({ copy, photo }: { copy: ReactNode; photo: ReactNode }) {
  const reduce = usePrefersReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (reduce) {
      if (tiltRef.current) tiltRef.current.style.transform = "";
      if (photoRef.current) photoRef.current.style.transform = "";
      if (glintRef.current) glintRef.current.style.opacity = "0";
      return;
    }
    const photoEl = photoRef.current;
    let frame = 0;
    const paint = () => {
      frame = 0;
      if (!photoEl || dragging.current) return;
      const y = Math.max(-20, Math.min(20, -window.scrollY * 0.15));
      photoEl.style.transform = `translate3d(0, ${y}px, 20px) scale(1.1)`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    let tiltFrame = 0;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (dragging.current || !tiltRef.current) return;
      const x = Math.max(-6, Math.min(6, (e.beta || 0) / 8));
      const y = Math.max(-6, Math.min(6, (e.gamma || 0) / 8));
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = 0;
        if (!tiltRef.current || dragging.current) return;
        tiltRef.current.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
      });
    };
    const listen = () => window.addEventListener("deviceorientation", onOrient);
    const orient = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<PermissionState>;
    };
    if (typeof orient.requestPermission === "function") {
      const ask = () => {
        orient.requestPermission?.().then((state) => {
          if (state === "granted") listen();
        }).catch(() => {});
        window.removeEventListener("pointerdown", ask);
      };
      window.addEventListener("pointerdown", ask, { once: true });
      return () => {
        window.removeEventListener("pointerdown", ask);
        window.removeEventListener("deviceorientation", onOrient);
        if (tiltFrame) cancelAnimationFrame(tiltFrame);
      };
    }
    listen();
    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
    };
  }, [reduce]);

  const flat = () => {
    dragging.current = false;
    const el = tiltRef.current;
    const glint = glintRef.current;
    if (el) {
      el.style.transition = "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "rotateX(0deg) rotateY(0deg)";
      el.style.willChange = "auto";
    }
    if (glint) glint.style.opacity = "0";
  };

  const follow = (clientX: number, clientY: number) => {
    const el = tiltRef.current;
    if (!el || reduce) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const ry = Math.max(-6, Math.min(6, (px - 0.5) * 12));
    const rx = Math.max(-6, Math.min(6, (py - 0.5) * -12));
    el.style.transition = "none";
    el.style.willChange = "transform";
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    const glint = glintRef.current;
    if (glint) {
      glint.style.opacity = "0.15";
      glint.style.setProperty("--gx", `${Math.round(px * 100)}%`);
      glint.style.setProperty("--gy", `${Math.round(py * 100)}%`);
    }
  };

  return (
    <div className="hero-stage">
      <Link
        href="/kazi"
        className="feature-card"
        onPointerDown={(e) => {
          if (reduce || e.button !== 0) return;
          dragging.current = true;
          follow(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          follow(e.clientX, e.clientY);
        }}
        onPointerUp={flat}
        onPointerCancel={flat}
        onPointerLeave={flat}
      >
        <div ref={tiltRef} className="feature-tilt">
          {copy}
          <div className="feature-photo">
            <div ref={photoRef} className="feature-photo-shift">
              {photo}
            </div>
          </div>
          <span ref={glintRef} className="hero-glint" aria-hidden />
        </div>
      </Link>
    </div>
  );
}
