"use client";

import { useRef, useState, type ReactNode } from "react";

export type SwipeAction = {
  id: string;
  label: string;
  tone?: "danger";
  onClick: () => void;
};

export default function SwipeRow({ actions, children }: { actions: SwipeAction[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const face = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const start = useRef(0);
  const dragged = useRef(false);
  const width = actions.length * 84;

  const paint = (next: number) => {
    x.current = next;
    if (face.current) face.current.style.transform = `translateX(${next}px)`;
  };

  return (
    <div className="swipe-row">
      <div className="swipe-actions" style={{ width }}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={action.tone === "danger" ? "is-danger" : ""}
            onClick={() => {
              setOpen(false);
              paint(0);
              action.onClick();
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div
        ref={face}
        className="swipe-face"
        data-open={open ? "1" : "0"}
        onPointerDown={(event) => {
          dragged.current = false;
          start.current = event.clientX - x.current;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const next = Math.min(0, Math.max(-width, event.clientX - start.current));
          if (Math.abs(next - x.current) > 4) dragged.current = true;
          paint(next);
        }}
        onPointerUp={() => {
          const snap = x.current < -width / 2;
          setOpen(snap);
          paint(snap ? -width : 0);
        }}
        onClickCapture={(event) => {
          if (!dragged.current) return;
          event.preventDefault();
          event.stopPropagation();
          dragged.current = false;
        }}
      >
        {children}
      </div>
    </div>
  );
}
