"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function PhotoGallery({
  images,
  fallback,
}: {
  images?: string[] | null;
  fallback: ReactNode;
}) {
  const photos = (images || []).filter(Boolean);
  const scroller = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);

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

  if (!photos.length) return <>{fallback}</>;

  const go = (n: number) => {
    const next = Math.max(0, Math.min(photos.length - 1, n));
    setI(next);
    const el = scroller.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <div className="relative" style={{ height: "78vh", minHeight: 420 }}>
        <div
          ref={scroller}
          className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (!el.clientWidth) return;
            setI(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((src, n) => (
            <button
              key={`${src}-${n}`}
              type="button"
              className="min-w-full h-full snap-center shrink-0"
              onClick={() => {
                setI(n);
                setOpen(true);
              }}
              aria-label={`View photo ${n + 1}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <div className="absolute bottom-20 left-4 right-4 flex items-end justify-between">
          <div className="flex gap-1.5">
            {photos.length > 1 &&
              photos.map((_, n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => go(n)}
                  className="block"
                  style={{
                    width: n === i ? 18 : 7,
                    height: 7,
                    borderRadius: 99,
                    backgroundColor: n === i ? "var(--gold)" : "rgba(var(--paper-rgb),0.55)",
                  }}
                  aria-label={`Photo ${n + 1}`}
                />
              ))}
          </div>
          <p className="text-sm px-2.5 py-1" style={{ color: "var(--foam)", backgroundColor: "rgba(var(--veil-rgb),0.55)" }}>
            {i + 1} / {photos.length}
          </p>
        </div>
      </div>

      {open && (
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
      )}
    </>
  );
}
