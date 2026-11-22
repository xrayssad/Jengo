"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { cachedImage, rememberImage } from "@/lib/imageCache";
import { sizedImage } from "@/lib/images";
import { useT } from "@/lib/i18n";

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

function PhotoMiss({ detail = false }: { detail?: boolean }) {
  const t = useT();
  return (
    <div className="photo-miss">
      <div className="photo-miss-blur" aria-hidden />
      <MapPin size={22} aria-hidden />
      {detail ? <span>{t("photo.missing")}</span> : null}
    </div>
  );
}

export default function ListingPhoto({
  src,
  eager = false,
  priority = false,
  ratio,
  sizes = "(max-width: 900px) 92vw, 480px",
  detail = false,
  fill = false,
}: {
  src: string;
  eager?: boolean;
  priority?: boolean;
  ratio: [number, number];
  sizes?: string;
  detail?: boolean;
  fill?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState(src);
  const [plain, setPlain] = useState(false);
  const [failed, setFailed] = useState(false);
  const sized = plain || attempt.startsWith("blob:") ? { src: attempt } : sizedImage(attempt, [480, 640]);

  useEffect(() => {
    watchPage();
    setAttempt(src);
    setPlain(false);
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
    return <PhotoMiss detail={detail} />;
  }

  return (
    <img
      ref={ref}
      src={sized.src}
      srcSet={"srcSet" in sized && attempt === src ? sized.srcSet : undefined}
      sizes={sizes}
      alt=""
      className={fill ? "photo-fill" : undefined}
      width={ratio[0]}
      height={ratio[1]}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      data-origin={src}
      onLoad={(event) => {
        const shown = event.currentTarget.currentSrc || attempt;
        loadedUrls.add(src);
        loadedUrls.add(originOf(shown));
        if (event.currentTarget.naturalWidth > 0) {
          rememberImage(src);
          if (shown && shown !== src) rememberImage(originOf(shown));
        }
      }}
      onError={() => {
        if (!plain && sized.src !== src) {
          setPlain(true);
          setAttempt(src);
          return;
        }
        void cachedImage(src).then((blobUrl) => {
          if (blobUrl) {
            setAttempt(blobUrl);
            return;
          }
          setFailed(true);
          if (ref.current) ref.current.dataset.gaveUp = "1";
        });
      }}
    />
  );
}
