"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const LIGHT = "#F4E7C9";
const DARK = "#14231A";

function paintThemeColor() {
  const dark = document.documentElement.dataset.theme === "dark" || document.documentElement.classList.contains("dark");
  const color = dark ? DARK : LIGHT;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", color);
  });
}

export default function NativeChrome() {
  const path = usePathname() || "";

  useEffect(() => {
    paintThemeColor();
    const obs = new MutationObserver(paintThemeColor);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    window.addEventListener("jengo-theme", paintThemeColor);
    return () => {
      obs.disconnect();
      window.removeEventListener("jengo-theme", paintThemeColor);
    };
  }, [path]);

  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const open = inset > 80;
      root.style.setProperty("--keyboard-inset", open ? `${Math.round(inset)}px` : "0px");
      root.dataset.keyboard = open ? "1" : "0";
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    const onFocus = (event: FocusEvent) => {
      const node = event.target;
      if (!(node instanceof HTMLElement)) return;
      if (node.tagName !== "INPUT" && node.tagName !== "TEXTAREA") return;
      window.setTimeout(() => node.scrollIntoView({ block: "center", behavior: "smooth" }), 160);
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      document.removeEventListener("focusin", onFocus);
      root.style.removeProperty("--keyboard-inset");
      delete root.dataset.keyboard;
    };
  }, []);

  useEffect(() => {
    const mark = (dir: "forward" | "back") => {
      document.documentElement.dataset.nav = dir;
      window.setTimeout(() => {
        if (document.documentElement.dataset.nav === dir) delete document.documentElement.dataset.nav;
      }, 420);
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (link) mark("forward");
    };
    const onPop = () => mark("back");
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!standalone) return;
    if (path === "/home" && !window.history.state?.jengoStay) {
      window.history.pushState({ ...(window.history.state || {}), jengoStay: 1 }, "");
    }
    const onPop = () => {
      if (document.documentElement.dataset.searchOverlay === "1") return;
      if (document.documentElement.dataset.sheet === "1") return;
      if (window.location.pathname === "/home") {
        window.history.pushState({ ...(window.history.state || {}), jengoStay: 1 }, "");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [path]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let lastX = 0;
    let lastT = 0;
    const page = () => document.querySelector<HTMLElement>(".page-motion");
    const reset = (node: HTMLElement | null) => {
      if (!node) return;
      node.style.transition = reduce ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
      node.style.transform = "";
      window.setTimeout(() => node.style.removeProperty("transition"), 240);
    };
    const onDown = (event: PointerEvent) => {
      if (event.clientX > 24 || event.button !== 0) return;
      if (window.location.pathname === "/home" || window.location.pathname === "/") return;
      if (document.documentElement.dataset.searchOverlay === "1") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, .hero-carousel, .fresh-rail, .loc-rail, .date-strip")) return;
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      lastT = event.timeStamp;
    };
    const onMove = (event: PointerEvent) => {
      if (!tracking) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        tracking = false;
        reset(page());
        return;
      }
      if (dx < 0) return;
      const node = page();
      if (!node || reduce) return;
      node.style.transition = "none";
      node.style.transform = `translate3d(${Math.min(dx, window.innerWidth)}px, 0, 0)`;
      lastX = event.clientX;
      lastT = event.timeStamp;
    };
    const onUp = (event: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dt = Math.max(1, event.timeStamp - lastT);
      const velocity = (event.clientX - lastX) / dt;
      const node = page();
      if (dx > 88 || velocity > 0.55) {
        document.documentElement.dataset.nav = "back";
        if (node) node.style.transform = "";
        window.history.back();
        return;
      }
      reset(node);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [path]);

  return null;
}
