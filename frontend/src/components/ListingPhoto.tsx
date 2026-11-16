"use client";

import { useEffect, useRef, useState } from "react";
import JengoLogo from "@/components/JengoLogo";
import { sizedImage } from "@/lib/images";

const loadedUrls = new Set<string>();
const mounted = new Map<HTMLImageElement, () => void>();
let watching = false;

function originOf(src: string) {
  return src.replace(/([?&])r=\d+/, "").replace(/[?&]$/, "");
}

function bust(src: string) {
  const clean = originOf(src);
  return `${clean}${clean.includes("?") ? "&" : "?"}r=${Date.now()}`;
}

function watchPage() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  const recheck = () => {
    for (const [img, retry] of mounted) {
      if (img.dataset.gaveUp === "1" || img.dataset.retried === "1") continue;
      if (img.complete && img.naturalWidth === 0) {
        img.dataset.retried = "1";
        retry();
      }
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) recheck();
  });
  window.addEventListener("pageshow", recheck);
}

export default function ListingPhoto({
  src,
  eager = false,
  priority = false,
  ratio,
  sizes = "(max-width: 900px) 92vw, 480px",
}: {
  src: string;
  eager?: boolean;
  priority?: boolean;
  ratio: [number, number];
  sizes?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState(src);
  const [failed, setFailed] = useState(false);
  const [fade, setFade] = useState(false);
  const sized = sizedImage(attempt, [480, 800, 1200]);

  useEffect(() => {
    watchPage();
    setAttempt(src);
    setFailed(false);
    setFade(false);
  }, [src]);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    const retry = () => {
      setAttempt((cur) => (originOf(cur) === originOf(src) && cur === src ? bust(src) : cur));
    };
    mounted.set(img, retry);
    const known = loadedUrls.has(src) || (img.complete && img.naturalWidth > 0);
    if (known) loadedUrls.add(src);
    else {
      void img.decode?.().then(() => {
        if (img.naturalWidth > 0) loadedUrls.add(src);
      }).catch(() => {});
    }
    return () => {
      mounted.delete(img);
    };
  }, [src, attempt]);

  if (!src || failed) {
    return (
      <div className="market-photo-empty">
        <JengoLogo variant="mark" size={28} title="" />
      </div>
    );
  }

  return (
    <img
      ref={ref}
      src={sized.src}
      srcSet={attempt === src ? sized.srcSet : undefined}
      sizes={sizes}
      alt=""
      width={ratio[0]}
      height={ratio[1]}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={fade ? "is-incoming" : undefined}
      data-origin={src}
      onLoad={(event) => {
        const first = !loadedUrls.has(src);
        loadedUrls.add(src);
        loadedUrls.add(originOf(event.currentTarget.currentSrc || src));
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (first && !reduce) setFade(true);
      }}
      onError={() => {
        if (attempt === src) {
          setAttempt(bust(src));
          return;
        }
        setFailed(true);
        if (ref.current) ref.current.dataset.gaveUp = "1";
      }}
    />
  );
}
