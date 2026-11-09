"use client";

import { Heart } from "lucide-react";

export default function HeartMark({
  on,
  burst,
  size,
}: {
  on: boolean;
  burst: "like" | "unlike" | null;
  size: number;
}) {
  return (
    <span className={`heart-mark${burst === "like" ? " is-like" : ""}${burst === "unlike" ? " is-unlike" : ""}`}>
      <Heart size={size} color={on ? "var(--primary)" : "currentColor"} fill={on ? "var(--primary)" : "none"} strokeWidth={1.8} />
      {burst === "like" ? (
        <span className="heart-burst" aria-hidden>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="heart-bit" style={{ ["--p" as string]: String(i) }} />
          ))}
        </span>
      ) : null}
    </span>
  );
}
