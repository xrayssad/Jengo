const live = new Set<HTMLVideoElement>();

export function hushVideo(el: HTMLVideoElement | null | undefined) {
  if (!el) return;
  el.pause();
}

export function watchReelVideo(el: HTMLVideoElement) {
  live.add(el);
  return () => {
    hushVideo(el);
    live.delete(el);
  };
}

export function hushAllReels() {
  live.forEach(hushVideo);
}
