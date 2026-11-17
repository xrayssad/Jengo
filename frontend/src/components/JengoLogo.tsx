import type { CSSProperties } from "react";
import { HOUSE_PATH, PIN_PATH } from "@/lib/logo";

const draw = (on: boolean, delay: string) => (on ? { className: "jengo-letter", style: { animationDelay: delay }, pathLength: 100 } : {});

type Variant = "wordmark" | "mark" | "icon" | "lockup";

function labelProps(title: string) {
  if (!title) return { "aria-hidden": true as const };
  return { role: "img" as const, "aria-label": title };
}

function box(size: number, width: number, height: number): CSSProperties {
  return { height: size, width: Math.round((size * width) / height) };
}

export default function JengoLogo({
  variant = "wordmark",
  size = 32,
  title = "Jengo",
  animated = false,
  className = "",
}: {
  variant?: Variant;
  size?: number;
  title?: string;
  animated?: boolean;
  className?: string;
}) {
  if (variant === "lockup") {
    return (
      <span className={["jengo-lockup", className].filter(Boolean).join(" ")} {...labelProps(title)}>
        <JengoLogo variant="mark" size={size} title="" />
        <JengoLogo variant="wordmark" size={Math.max(18, Math.round(size * 0.62))} title="" animated={animated} />
      </span>
    );
  }

  if (variant === "icon") {
    return (
      <svg
        className={["jengo-logo", "is-icon", className].filter(Boolean).join(" ")}
        viewBox="0 0 80 80"
        width={size}
        height={size}
        {...labelProps(title)}
      >
        <rect width="80" height="80" rx="20" fill="#4F5A3A" />
        <g transform="translate(40 40) scale(1.05) translate(-22 -48.5)" fill="none" stroke="#F2EDE4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d={PIN_PATH} />
          <path d={HOUSE_PATH} fill="#D4A95A" stroke="none" />
        </g>
      </svg>
    );
  }

  if (variant === "mark") {
    return (
      <svg
        className={["jengo-logo", "is-mark", animated ? "is-draw" : "", className].filter(Boolean).join(" ")}
        viewBox="0 14 44 70"
        style={box(size, 44, 70)}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...labelProps(title)}
      >
        <g className={animated ? "jengo-pin" : undefined}>
          <path d={PIN_PATH} />
          {animated ? <circle className="jengo-ripple" cx="22" cy="40" r="16" fill="none" stroke="currentColor" strokeWidth="2" /> : null}
          <path className={animated ? "jengo-house" : undefined} d={HOUSE_PATH} fill="var(--logo-accent)" stroke="none" />
        </g>
      </svg>
    );
  }

  const drawn = animated;
  return (
    <svg
      className={["jengo-logo", "is-word", drawn ? "is-draw" : "", className].filter(Boolean).join(" ")}
      viewBox="0 -4 260 96"
      style={box(size, 260, 96)}
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...labelProps(title)}
    >
      <path {...draw(drawn, "0ms")} d="M28 2V42C28 54 20 62 8 62" />
      <g transform="translate(42 0)">
        <path {...draw(drawn, "80ms")} d="M2 40H42A20 20 0 1 0 36 54" />
      </g>
      <g transform="translate(98 0)">
        <path {...draw(drawn, "160ms")} d="M2 20V60M2 36C2 26 10 20 22 20C34 20 42 27 42 38V60" />
      </g>
      <g transform="translate(154 0)">
        <circle {...draw(drawn, "240ms")} cx="22" cy="40" r="20" />
        <path {...draw(drawn, "240ms")} d="M42 20V66C42 80 32 86 20 86C12 86 6 83 2 78" />
      </g>
      <g transform="translate(210 0)">
        <g className={drawn ? "jengo-pin" : undefined}>
          <path d={PIN_PATH} />
          {drawn ? <circle className="jengo-ripple" cx="22" cy="40" r="16" fill="none" stroke="currentColor" strokeWidth="2" /> : null}
          <path className={drawn ? "jengo-house" : undefined} d={HOUSE_PATH} fill="var(--logo-accent)" stroke="none" />
        </g>
      </g>
    </svg>
  );
}
