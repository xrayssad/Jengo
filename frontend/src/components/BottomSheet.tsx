"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const drag = useRef({ y: 0, start: 0, on: false });
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.sheet = "1";
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const state = { ...(window.history.state || {}), jengoSheet: 1 };
    window.history.pushState(state, "");
    const onPop = () => closeRef.current();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (window.history.state?.jengoSheet) window.history.back();
        else closeRef.current();
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      if (root.dataset.sheet === "1") delete root.dataset.sheet;
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (window.history.state?.jengoSheet) window.history.back();
    else onClose();
  };

  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, textarea")) return;
    drag.current = { y: 0, start: event.clientY, on: true };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.on || !panel.current) return;
    const next = Math.max(0, event.clientY - drag.current.start);
    drag.current.y = next;
    panel.current.style.transform = `translateY(${next}px)`;
  };
  const onDragEnd = () => {
    if (!drag.current.on) return;
    drag.current.on = false;
    if (drag.current.y > 96) close();
    else if (panel.current) panel.current.style.transform = "";
  };

  return (
    <div className="sheet-root" role="presentation" onClick={close}>
      <div
        ref={panel}
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="sheet-grab"
          aria-hidden
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        />
        <div
          className="sheet-head"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <p>{title}</p>
          <button type="button" className="soft-icon-btn" aria-label="Close" onClick={close}>
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
