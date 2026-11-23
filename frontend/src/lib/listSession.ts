"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { prepareFreshView } from "./viewState";

const KEY = "jengo_list_session_v1";

export type FrozenList = {
  source: string;
  ids: string[];
  index: number;
  missing: string[];
};

type SessionShape = {
  lastViewedId: string | null;
  armed: boolean;
  frozen: FrozenList | null;
  carousel: Record<string, number>;
  rails: Record<string, number>;
};

let memory: SessionShape | null = null;
let swapDir: "next" | "prev" | "" = "";
let pulseId = "";
let pulseFrame = "";
let pulseTimer = 0;
const pulseListeners = new Set<() => void>();
let openId = "";
const openListeners = new Set<() => void>();

function setOpenListing(id: string) {
  if (openId === id) return;
  openId = id;
  openListeners.forEach((fn) => fn());
}

export function useOpenListing(id: string) {
  return useSyncExternalStore(
    (cb) => {
      openListeners.add(cb);
      return () => openListeners.delete(cb);
    },
    () => openId === id,
    () => false,
  );
}

function empty(): SessionShape {
  return { lastViewedId: null, armed: false, frozen: null, carousel: {}, rails: {} };
}

function load(): SessionShape {
  if (memory) return memory;
  memory = empty();
  if (typeof window === "undefined") return memory;
  prepareFreshView();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return memory;
    const data = JSON.parse(raw) as Partial<SessionShape>;
    memory = {
      lastViewedId: typeof data.lastViewedId === "string" ? data.lastViewedId : null,
      armed: Boolean(data.armed),
      frozen: data.frozen && Array.isArray(data.frozen.ids)
        ? {
            source: data.frozen.source || "feed",
            ids: data.frozen.ids.filter((id) => typeof id === "string"),
            index: Number(data.frozen.index) || 0,
            missing: Array.isArray(data.frozen.missing) ? data.frozen.missing.filter((id) => typeof id === "string") : [],
          }
        : null,
      carousel: data.carousel && typeof data.carousel === "object" ? data.carousel : {},
      rails: data.rails && typeof data.rails === "object" ? data.rails : {},
    };
  } catch {
    memory = empty();
  }
  return memory;
}

function save(next: SessionShape) {
  memory = next;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function listRoute(path: string) {
  if (!path || path.startsWith("/tangazo/")) return "";
  return path;
}

export function freezeBrowse(source: string, ids: string[], id: string) {
  const unique = ids.filter((item, index) => item && ids.indexOf(item) === index);
  const index = Math.max(0, unique.indexOf(id));
  const next = load();
  next.frozen = { source, ids: unique, index, missing: [] };
  next.lastViewedId = id;
  next.armed = true;
  save(next);
  setOpenListing(id);
}

export function moveBrowse(id: string) {
  const next = load();
  if (next.frozen) {
    const index = next.frozen.ids.indexOf(id);
    if (index >= 0) next.frozen.index = index;
  }
  next.lastViewedId = id;
  next.armed = true;
  save(next);
  setOpenListing(id);
}

export function markMissing(id: string) {
  const next = load();
  if (!next.frozen || next.frozen.missing.includes(id)) return;
  next.frozen.missing = [...next.frozen.missing, id];
  save(next);
}

export function readFrozen(): FrozenList | null {
  if (typeof window === "undefined") return null;
  const frozen = load().frozen;
  if (!frozen?.ids.length) return null;
  return frozen;
}

export function listingHref(id: string, source: string) {
  if (source === "hero" || source === "rail") return `/tangazo/${id}?from=${source}`;
  return `/tangazo/${id}`;
}

export function peekReturn(): string | null {
  const data = load();
  if (!data.armed || !data.lastViewedId) return null;
  return data.lastViewedId;
}

export function returnFrame(): string {
  return load().frozen?.source || "feed";
}

export function disarmReturn() {
  const next = load();
  if (!next.armed) return;
  next.armed = false;
  save(next);
}

export function pulseReturn(id: string, frame: string) {
  pulseId = id;
  pulseFrame = frame;
  pulseListeners.forEach((fn) => fn());
  window.clearTimeout(pulseTimer);
  pulseTimer = window.setTimeout(() => {
    pulseId = "";
    pulseFrame = "";
    pulseListeners.forEach((fn) => fn());
  }, 600);
}

export function useReturnPulse(id: string, frame: string) {
  return useSyncExternalStore(
    (cb) => {
      pulseListeners.add(cb);
      return () => pulseListeners.delete(cb);
    },
    () => pulseId === id && pulseFrame === frame,
    () => false,
  );
}

export function setBrowseDir(dir: "next" | "prev") {
  swapDir = dir;
}

export function takeBrowseDir() {
  const dir = swapDir;
  queueMicrotask(() => {
    if (swapDir === dir) swapDir = "";
  });
  return dir;
}

export function readCarousel(route: string) {
  const value = load().carousel[route];
  return typeof value === "number" ? value : 0;
}

export function writeCarousel(route: string, index: number) {
  if (!route) return;
  const next = load();
  if (next.carousel[route] === index) return;
  next.carousel = { ...next.carousel, [route]: index };
  save(next);
}

export function readRail(name: string) {
  const value = load().rails[name];
  return typeof value === "number" ? value : 0;
}

export function writeRail(name: string, left: number) {
  if (!name) return;
  const next = load();
  if (next.rails[name] === left) return;
  next.rails = { ...next.rails, [name]: left };
  save(next);
}

export function usePersistentScroll(name: string, ref: RefObject<HTMLElement | null>, ready: boolean) {
  const path = usePathname() || "/";
  const route = listRoute(path);
  const routeRef = useRef(route);
  if (route) routeRef.current = route;

  useLayoutEffect(() => {
    const el = ref.current;
    const savedRoute = routeRef.current;
    if (!el || !route || !savedRoute || !ready) return;
    el.scrollLeft = readRail(`${savedRoute}:${name}`);
  }, [ref, route, name, ready]);

  useEffect(() => {
    const el = ref.current;
    const savedRoute = routeRef.current;
    if (!el || !savedRoute || !ready) return;
    const onScroll = () => writeRail(`${savedRoute}:${name}`, el.scrollLeft);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref, route, name, ready]);
}
