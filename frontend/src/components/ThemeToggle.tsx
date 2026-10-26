"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ dense = false }: { dense?: boolean }) {
  const { theme, setTheme } = useTheme();
  const night = theme === "dark";
  const Icon = night ? Moon : Sun;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label="Night mode"
      onClick={() => setTheme(night ? "light" : "dark")}
      className="flex items-center gap-3 w-full min-w-0 text-left"
    >
      <Icon
        size={dense ? 17 : 18}
        className="shrink-0"
        style={{ color: dense ? "var(--gold)" : "var(--mocha)" }}
      />
      <span
        className={`flex-1 min-w-0 text-sm ${dense ? "" : "font-semibold"}`}
        style={{ color: dense ? "inherit" : "var(--ink)" }}
      >
        Night mode
      </span>
      <span
        className="relative shrink-0"
        style={{
          width: 42,
          height: 26,
          borderRadius: 999,
          background: night ? "var(--gold)" : dense ? "rgba(196,163,90,0.22)" : "var(--ink)",
          border: `1px solid ${night || dense ? "var(--gold)" : "var(--ink)"}`,
        }}
      >
        <span
          className="absolute top-[2px] rounded-full"

          style={{
            width: 20,
            height: 20,
            left: night ? 19 : 2,
            background: night ? "var(--stamp)" : "var(--foam)",
            transition: "left 0.2s ease",
          }}
        />
      </span>
    </button>
  );
}
