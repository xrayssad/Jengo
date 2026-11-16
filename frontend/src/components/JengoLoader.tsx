"use client";

import { useId } from "react";
import JengoLogo from "@/components/JengoLogo";
import { HOUSE_PATH, PIN_PATH } from "@/lib/logo";

export default function JengoLoader({
  size = 24,
  progress,
  label = "Loading",
  text = "",
  variant = "inline",
  pull = 0,
  refreshing = false,
  done = false,
  showValue = false,
}: {
  size?: number;
  /** 0–100. Omit for the indeterminate bounce. */
  progress?: number;
  label?: string;
  text?: string;
  variant?: "inline" | "full" | "pull";
  pull?: number;
  refreshing?: boolean;
  done?: boolean;
  showValue?: boolean;
}) {
  const raw = useId();
  const clipId = `pin-fill-${raw.replace(/:/g, "")}`;
  const known = typeof progress === "number" && Number.isFinite(progress);
  const pct = known ? Math.max(0, Math.min(100, progress)) : 0;
  const top = 78 - (78 - 16) * (pct / 100);
  const classes = [
    "jengo-loader",
    variant === "full" ? "is-full" : "",
    variant === "pull" ? "is-pull" : "",
    refreshing ? "is-refresh" : "",
    done ? "is-pop" : "",
  ].filter(Boolean).join(" ");

  const mark = known ? (
    <svg className="jengo-logo is-mark" viewBox="0 14 44 70" width={Math.round((size * 44) / 70)} height={size} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={top} width="44" height={84 - top} />
        </clipPath>
      </defs>
      <path d={PIN_PATH} opacity="0.28" />
      <path d={PIN_PATH} fill="var(--logo-accent)" stroke="none" clipPath={`url(#${clipId})`} />
      <path d={HOUSE_PATH} fill="var(--logo-accent)" stroke="none" opacity={pct > 8 ? 1 : 0.35} />
    </svg>
  ) : (
    <span className="jengo-bounce" style={variant === "pull" ? { ["--pull" as string]: String(Math.max(0, Math.min(1, pull))) } : undefined}>
      <JengoLogo variant="mark" size={size} title="" />
    </span>
  );

  return (
    <span className={classes} role="status" aria-live="polite">
      <span className="sr-only">{known ? `${label} ${Math.round(pct)}%` : label}</span>
      <span className="jengo-loader-row">
        <span className="jengo-loader-pin">
          {mark}
          {variant !== "inline" && !known ? <i className="jengo-ground" aria-hidden /> : null}
        </span>
        {showValue && known ? <em className="jengo-loader-pct">{Math.round(pct)}%</em> : null}
      </span>
      {text ? <span className="jengo-loader-text">{text}</span> : null}
    </span>
  );
}
