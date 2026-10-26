"use client";

import { useRef } from "react";

export default function OtpBoxes({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, "").slice(0, length).split("");

  const fill = (raw: string, start = 0) => {
    const chars = raw.replace(/\D/g, "").slice(0, length - start);
    if (!chars) {
      const next = Array.from({ length }, (_, i) => (i === start ? "" : digits[i] || ""));
      onChange(next.join(""));
      return;
    }
    const next = Array.from({ length }, (_, i) => digits[i] || "");
    for (let i = 0; i < chars.length; i += 1) next[start + i] = chars[i];
    onChange(next.join(""));
    refs.current[Math.min(start + chars.length, length - 1)]?.focus();
  };

  return (
    <div
      className="otp-row"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`,
        gap: 8,
        width: "100%",
        minWidth: 0,
      }}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          size={1}
          maxLength={i === 0 ? length : 1}
          aria-label={`Tarakimu ${i + 1} kati ya ${length}`}
          value={digits[i] || ""}
          onChange={(e) => fill(e.target.value, i)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              const next = Array.from({ length }, (_, j) => digits[j] || "");
              next[i - 1] = "";
              onChange(next.join(""));
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            fill(e.clipboardData.getData("text"), 0);
          }}
          className="otp-box"
          style={{
            boxSizing: "border-box",
            width: "100%",
            height: 48,
            minWidth: 0,
            maxWidth: "100%",
            padding: 0,
            margin: 0,
            textAlign: "center",
            fontSize: "1.125rem",
            fontWeight: 700,
            lineHeight: "48px",
            borderRadius: 14,
            border: "1px solid rgba(210, 166, 121, 0.55)",
            backgroundColor: "rgba(255, 246, 237, 0.92)",
            color: "#2E1A0F",
            outline: "none",
            appearance: "none",
          }}
        />
      ))}
    </div>
  );
}
