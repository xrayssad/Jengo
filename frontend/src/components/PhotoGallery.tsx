"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import ListingPhoto from "./ListingPhoto";

export default function PhotoGallery({
  images,
  fallback,
  onEdge,
  onDismiss,
}: {
  images?: string[] | null;
  fallback: ReactNode;
  onEdge?: (dir: 1 | -1) => void;
  onDismiss?: () => void;
}) {
  const photos = (images || []).filter(Boolean);
  const scroller = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, y: 0, i: 0, active: false });
  const swallow = useRef(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const lite = document.documentElement.dataset.lite === "1";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lite || reduce) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (document.querySelector(".detail-page.is-stage")) return;
        const y = Math.max(0, Math.min(window.scrollY * 0.5, node.clientHeight * 0.35));
        node.style.setProperty("--parallax", `${y}px`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setI((n) => Math.min(photos.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, photos.length]);

  if (!photos.length) return <div className="detail-hero">{fallback}</div>;

  const go = (n: number) => {
    const next = Math.max(0, Math.min(photos.length - 1, n));
    setI(next);
    const el = scroller.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const lightbox = (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "var(--ink)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <p className="text-sm" style={{ color: "var(--gold)" }}>
          {i + 1} / {photos.length}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-10 h-10 flex items-center justify-center"
          style={{ border: "1px solid var(--gold)" }}
          aria-label="Close"
        >
          <X size={18} color="var(--gold)" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-3 min-h-0">
        <img src={photos[i]} alt="" className="max-w-full max-h-full object-contain" />
      </div>
      {photos.length > 1 && (
        <div className="flex items-center justify-between px-4 py-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
            className="w-11 h-11 flex items-center justify-center"
            style={{ border: "1px solid var(--gold)", opacity: i === 0 ? 0.35 : 1 }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} color="var(--gold)" />
          </button>
          <p className="text-sm" style={{ color: "var(--caramel)" }}>
            Look until you are sure
          </p>
          <button
            type="button"
            onClick={() => setI((n) => Math.min(photos.length - 1, n + 1))}
            disabled={i === photos.length - 1}
            className="w-11 h-11 flex items-center justify-center"
            style={{ border: "1px solid var(--gold)", opacity: i === photos.length - 1 ? 0.35 : 1 }}
            aria-label="Next photo"
          >
            <ChevronRight size={20} color="var(--gold)" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={root} className="relative detail-hero">
      <div
        ref={scroller}
        className="flex h-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain no-scrollbar"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, i, active: true };
        }}
        onPointerUp={(event) => {
          if (!drag.current.active || !onEdge) {
            drag.current.active = false;
            return;
          }
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          drag.current.active = false;
          if (onDismiss && dy > 72 && dy > Math.abs(dx) * 1.2) {
            swallow.current = true;
            onDismiss();
            return;
          }
          if (Math.abs(dx) > 12) swallow.current = true;
          if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
          const atStart = drag.current.i <= 0;
          const atEnd = drag.current.i >= photos.length - 1;
          if (dx > 0 && atStart) {
            swallow.current = true;
            onEdge(-1);
          } else if (dx < 0 && atEnd) {
            swallow.current = true;
            onEdge(1);
          }
        }}
        onPointerCancel={() => {
          drag.current.active = false;
        }}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (!el.clientWidth) return;
          const next = Math.round(el.scrollLeft / el.clientWidth);
          setI((cur) => (cur === next ? cur : next));
        }}
      >
        {photos.map((src, n) => (
          <button
            key={`${src}-${n}`}
            type="button"
            className="min-w-full h-full snap-center shrink-0"
            onClick={() => {
              if (swallow.current) {
                swallow.current = false;
                return;
              }
              setI(n);
              setOpen(true);
            }}
            aria-label={`View photo ${n + 1}`}
          >
            <ListingPhoto src={src} ratio={[4, 3]} eager={n === 0} priority={n === 0} detail fill />
          </button>
        ))}
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
        <div className="flex gap-1.5 pointer-events-auto">
          {photos.length > 1 &&
            photos.map((_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => go(n)}
                className={n === i ? "photo-dot is-on" : "photo-dot"}
                aria-label={`Photo ${n + 1}`}
              />
            ))}
        </div>
        {photos.length > 1 ? (
          <p key={i} className="photo-count photo-count-swap">
            {i + 1} / {photos.length}
          </p>
        ) : null}
      </div>
      {open && typeof document !== "undefined" ? createPortal(lightbox, document.body) : null}
    </div>
  );
}
