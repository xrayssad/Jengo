const live = new Set<HTMLVideoElement>();

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function connection(): NetworkInformationLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

/** Save-Data or very slow cellular — skip speculative video preload. */
export function isReelDataSaver(): boolean {
  const conn = connection();
  if (!conn) return false;
  if (conn.saveData) return true;
  const t = (conn.effectiveType || "").toLowerCase();
  return t === "slow-2g" || t === "2g";
}

export function watchReelDataSaver(onChange: (saver: boolean) => void) {
  const read = () => onChange(isReelDataSaver());
  read();
  const conn = connection();
  conn?.addEventListener?.("change", read);
  return () => conn?.removeEventListener?.("change", read);
}

/** Short start fragment so the next reel can warm a few seconds without pulling the whole file. */
export function reelPrefetchSrc(url: string) {
  const base = String(url || "").split("#")[0];
  if (!base) return "";
  return `${base}#t=0,2`;
}

export function armReelVideo(el: HTMLVideoElement | null | undefined) {
  if (!el) return el;
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
  el.setAttribute("x5-playsinline", "true");
  el.setAttribute("x5-video-player-type", "h5");
  el.setAttribute("x5-video-player-fullscreen", "false");
  el.playsInline = true;
  el.disablePictureInPicture = true;
  return el;
}

export function hushVideo(el: HTMLVideoElement | null | undefined) {
  if (!el) return;
  try {
    el.pause();
  } catch {
    /* ignore */
  }
}

/** Drop buffered media so inactive reels stop downloading. */
export function unloadVideo(el: HTMLVideoElement | null | undefined) {
  if (!el) return;
  hushVideo(el);
  try {
    el.removeAttribute("src");
    el.src = "";
    el.srcObject = null;
    while (el.firstChild) el.removeChild(el.firstChild);
    el.load();
  } catch {
    /* ignore */
  }
}

/** Register a mounted player only — cleanup unloads it from the registry. */
export function watchReelVideo(el: HTMLVideoElement) {
  armReelVideo(el);
  live.add(el);
  return () => {
    unloadVideo(el);
    live.delete(el);
  };
}

export function hushAllReels() {
  live.forEach((el) => {
    unloadVideo(el);
  });
}
