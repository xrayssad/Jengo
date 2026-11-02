const live = new Set<HTMLVideoElement>();

export function armReelVideo(el: HTMLVideoElement | null | undefined) {
  if (!el) return el;
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
  el.setAttribute("x5-playsinline", "true");
  el.setAttribute("x5-video-player-type", "h5");
  el.setAttribute("x5-video-player-fullscreen", "false");
  el.playsInline = true;
  el.disablePictureInPicture = true;
  el.preload = el.preload || "metadata";
  return el;
}

export function hushVideo(el: HTMLVideoElement | null | undefined) {
  if (!el) return;
  el.pause();
}

export function watchReelVideo(el: HTMLVideoElement) {
  armReelVideo(el);
  live.add(el);
  return () => {
    hushVideo(el);
    live.delete(el);
  };
}

export function hushAllReels() {
  live.forEach(hushVideo);
}
