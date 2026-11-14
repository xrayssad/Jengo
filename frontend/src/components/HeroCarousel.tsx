"use client";

import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/lib/api";
import { pickFeatured } from "@/lib/browse";
import { isLiteDevice } from "@/lib/device";
import { usePrefersReducedMotion } from "@/lib/motion";
import ListingCard from "./ListingCard";

export default function HeroCarousel({ items, loading }: { items: Listing[]; loading?: boolean }) {
  const reduce = usePrefersReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const pause = useRef(false);
  const [active, setActive] = useState(0);
  const featured = pickFeatured(items);

  useEffect(() => {
    const el = scroller.current;
    if (!el || loading) return;
    const lite = isLiteDevice();
    let raf = 0;
    const update = () => {
      const slides = Array.from(el.querySelectorAll<HTMLElement>(".hero-slide"));
      if (!slides.length) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let best = Number.POSITIVE_INFINITY;
      slides.forEach((slide, index) => {
        const center = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < best) {
          best = dist;
          closest = index;
        }
        const t = Math.min(dist / Math.max(slide.offsetWidth, 1), 1);
        const frame = slide.querySelector<HTMLElement>(".hero-slide-frame");
        if (!frame) return;
        if (reduce) {
          frame.style.transform = "";
          frame.style.opacity = "";
        } else {
          frame.style.transform = `translateY(${t * 10}px) scale(${1 - t * 0.12})`;
          frame.style.opacity = String(1 - t * 0.3);
        }
        const img = slide.querySelector("img");
        if (img) {
          if (reduce || lite) img.style.transform = "";
          else {
            const signed = (center - mid) / Math.max(slide.offsetWidth, 1);
            const shift = Math.max(-8, Math.min(8, signed * -8));
            img.style.transform = `translateX(${shift}%) scale(1.12)`;
          }
        }
      });
      setActive((cur) => (cur === closest ? cur : closest));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [featured.length, loading, reduce]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || reduce || featured.length < 2) return;
    const tick = () => {
      if (pause.current || document.hidden) return;
      const slide = el.querySelector<HTMLElement>(".hero-slide");
      const step = (slide?.offsetWidth || 0) + 12;
      if (!step) return;
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + step >= max - 8 ? 0 : el.scrollLeft + step;
      el.scrollTo({ left: next, behavior: "smooth" });
    };
    const id = window.setInterval(tick, 5000);
    const hold = () => {
      pause.current = true;
    };
    const release = () => {
      window.setTimeout(() => {
        pause.current = false;
      }, 800);
    };
    const vis = () => {
      pause.current = document.hidden;
    };
    el.addEventListener("pointerdown", hold);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.clearInterval(id);
      el.removeEventListener("pointerdown", hold);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", release);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [featured.length, reduce]);

  const go = (index: number) => {
    const el = scroller.current;
    const slide = el?.querySelectorAll<HTMLElement>(".hero-slide")[index];
    if (!el || !slide) return;
    el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  };

  if (!loading && featured.length === 0) return null;

  return (
    <section className="hero-block bleed-cancel" aria-label="Featured">
      <div ref={scroller} className="hero-carousel no-scrollbar">
        {loading && featured.length === 0
          ? [0, 1].map((n) => (
              <div key={n} className="hero-slide" aria-hidden>
                <div className="hero-slide-frame">
                  <div className="hero-skel" />
                </div>
              </div>
            ))
          : featured.map((item, index) => (
              <div key={item.id} className="hero-slide">
                <div className="hero-slide-frame">
                  <ListingCard item={item} frame="hero" eager={index < 2} />
                </div>
              </div>
            ))}
      </div>
      {featured.length > 1 ? (
        <div className="hero-dots" role="tablist" aria-label="Featured">
          {featured.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? "hero-dot is-on" : "hero-dot"}
              aria-label={`${index + 1}`}
              aria-selected={index === active}
              onClick={() => go(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
