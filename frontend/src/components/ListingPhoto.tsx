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
  const sized = sizedImage(attempt, [480, 640]);

  useEffect(() => {
    watchPage();
    setAttempt(src);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    const retry = () => {
      setAttempt((cur) => (originOf(cur) === originOf(src) && cur === src ? bust(src) : cur));
    };
    mounted.set(img, retry);
    if (loadedUrls.has(src) || (img.complete && img.naturalWidth > 0)) loadedUrls.add(src);
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
      fetchPriority={priority ? "high" : "low"}
      data-origin={src}
      onLoad={(event) => {
        loadedUrls.add(src);
        loadedUrls.add(originOf(event.currentTarget.currentSrc || src));
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
