"use client";

import { Suspense, use, useLayoutEffect, useSyncExternalStore } from "react";
import DetailsClient from "@/app/tangazo/[id]/DetailsClient";
import { DetailSkeleton } from "@/components/Skeletons";

let overlayLocks = 0;
let overlayY = 0;
let overlayOverflow = "";
let overlayLocked = false;

function Lock() {
  useLayoutEffect(() => {
    const wide = window.matchMedia("(min-width: 900px)");
    const apply = () => {
      const lock = !wide.matches;
      overlayLocked = lock;
      document.body.style.overflow = lock ? "hidden" : overlayOverflow;
    };
    if (document.documentElement.dataset.detailOverlay !== "1") {
      overlayY = window.scrollY;
      overlayOverflow = document.body.style.overflow;
      document.documentElement.dataset.detailOverlay = "1";
    }
    apply();
    overlayLocks += 1;
    wide.addEventListener("change", apply);
    return () => {
      wide.removeEventListener("change", apply);
      overlayLocks = Math.max(0, overlayLocks - 1);
      if (overlayLocks > 0) return;
      delete document.documentElement.dataset.detailOverlay;
      document.body.style.overflow = overlayOverflow;
      if (overlayLocked) window.scrollTo(0, overlayY);
    };
  }, []);
  return null;
}

function Body({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const left = useSyncExternalStore(
    (cb) => {
      window.addEventListener("popstate", cb);
      return () => window.removeEventListener("popstate", cb);
    },
    () => !window.location.pathname.startsWith("/tangazo/"),
    () => false,
  );
  if (left) return null;
  return (
    <div className="detail-overlay">
      <Lock />
      <DetailsClient id={id} overlay />
    </div>
  );
}

export default function InterceptedListing({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="detail-overlay"><DetailSkeleton /></div>}>
      <Body params={params} />
    </Suspense>
  );
}
