"use client";

import { useRef } from "react";

export default function OtpBoxes({
  value,
  onChange,
  length = 8,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, "").slice(0, length).split("");

  const setAt = (index: number, char: string) => {
    const next = Array.from({ length }, (_, i) => digits[i] || "");
    next[index] = char.replace(/\D/g, "").slice(-1);
    onChange(next.join(""));
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  };

  return (
    <div className="flex gap-1.5 justify-between">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            onChange(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length));
          }}
          className="input-chocolate w-9 h-11 text-center text-sm font-semibold"
        />
      ))}
    </div>
  );
}
