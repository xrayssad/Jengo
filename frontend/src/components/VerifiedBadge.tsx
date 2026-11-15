"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { VERIFIED_BADGE_ENABLED } from "@/lib/productFlags";
import { useT } from "@/lib/i18n";

const POP_KEY = "jengo_badge_pop";
const SHINE_KEY = "jengo_badge_shine";

export default function VerifiedBadge({
  size = "sm",
  type = null,
  shine = false,
}: {
  size?: "sm" | "md" | "lg";
  type?: "individual" | "business" | null;
  shine?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(false);
  const [glow, setGlow] = useState(false);
  const hold = useRef<number | null>(null);
  const root = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    try {
      if (sessionStorage.getItem(POP_KEY) !== "1") {
        sessionStorage.setItem(POP_KEY, "1");
        setPop(true);
      }
      if (shine && sessionStorage.getItem(SHINE_KEY) !== "1") {
        sessionStorage.setItem(SHINE_KEY, "1");
        setGlow(true);
      }
    } catch {
      /* ignore */
    }
  }, [shine]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => {
    if (hold.current != null) window.clearTimeout(hold.current);
  }, []);

  if (!VERIFIED_BADGE_ENABLED) return null;

  const label = t("badge.label");
  const sheet = open && root
    ? createPortal(
        <div className="badge-sheet" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="badge-sheet-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="badge-sheet-seal" aria-hidden>
              <Seal />
            </span>
            <h2 id="badge-sheet-title">{t("badge.title")}</h2>
            {type === "business" ? <p className="badge-sheet-kind">{t("badge.business")}</p> : null}
            <p>{t("badge.body")}</p>
            <p className="badge-sheet-free">{t("badge.free")}</p>
            <button type="button" className="btn-primary badge-sheet-close" onClick={() => setOpen(false)}>
              {t("close")}
            </button>
          </div>
        </div>,
        root,
      )
    : null;

  return (
    <>
      <button
        type="button"
        className={["vbadge", `is-${size}`, pop ? "is-pop" : "", glow ? "is-shine" : ""].filter(Boolean).join(" ")}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        onPointerDown={(event) => {
          if (hold.current != null) window.clearTimeout(hold.current);
          hold.current = window.setTimeout(() => {
            event.preventDefault();
            setOpen(true);
          }, 450);
        }}
        onPointerUp={() => {
          if (hold.current != null) window.clearTimeout(hold.current);
        }}
        onPointerLeave={() => {
          if (hold.current != null) window.clearTimeout(hold.current);
        }}
      >
        <Seal />
      </button>
      {sheet}
    </>
  );
}

function Seal() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="var(--verified-blue)"
        d="M12 1.15l1.55 2.05 2.52-.46 1.05 2.35 2.42.78-.18 2.55 1.95 1.72-1.15 2.28.86 2.42-2.15 1.38-.38 2.52L12 22.85l-1.64-2.11-2.52.36-.38-2.52-2.15-1.38.86-2.42L5.02 12.5l1.95-1.72-.18-2.55 2.42-.78 1.05-2.35 2.52.46L12 1.15z"
      />
      <path fill="#fff" d="M10.15 12.55 8.4 10.8l-1.15 1.15 2.9 2.9 5.45-5.45-1.15-1.15z" />
    </svg>
  );
}
