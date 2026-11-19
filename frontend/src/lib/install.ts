/** Install prompt state lives here so a route change cannot drop the browser event. */

export type InstallKind = "native" | "ios" | "webview" | "safari";
export type InstallOutcome = "accepted" | "dismissed" | "later";
export type NudgeReason = "publish" | "save";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "jengo_install_hide_until";
const VISIT_KEY = "jengo_install_visits";
const SESSION_KEY = "jengo_install_session";
const NUDGE_KEY = "jengo_install_nudge";
const NUDGED_KEY = "jengo_install_nudged";
const EVENTS_KEY = "jengo_install_events";
const HIDE_MS = 14 * 24 * 60 * 60 * 1000;

let deferred: BeforeInstallPromptEvent | null = null;
let fired = false;
let bound = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeInstall(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getDeferredPrompt() {
  return deferred;
}

export function promptFired() {
  return fired;
}

export function bindInstallPrompt() {
  if (typeof window === "undefined" || bound) return;
  bound = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    fired = true;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function isDesktop() {
  if (typeof navigator === "undefined") return false;
  return !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || "");
}

export function isIosDevice(ua = "", platform = "", touchPoints = 0) {
  return /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && touchPoints > 1);
}

export function iosMajor(ua = ""): number {
  const os = ua.match(/(?:iPhone|CPU) OS (\d+)[_.]/);
  if (os) return Number(os[1]);
  const version = ua.match(/Version\/(\d+)/);
  return version ? Number(version[1]) : 0;
}

export function detectKind(hasPrompt: boolean): InstallKind | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/WhatsApp|Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance/i.test(ua)) return "webview";
  const iOS = isIosDevice(ua, navigator.platform, navigator.maxTouchPoints);
  const otherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if (iOS && otherIosBrowser) return "safari";
  if (iOS && /Safari/.test(ua)) return "ios";
  if (hasPrompt) return "native";
  return null;
}

/** Safari Private hides Add to Home Screen. Only the known private-mode error counts. */
export async function isSafariPrivate(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = isIosDevice(ua, navigator.platform, navigator.maxTouchPoints);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const getDirectory = navigator.storage?.getDirectory;
  if (!iOS || !safari || typeof getDirectory !== "function") return false;
  try {
    await Promise.race([
      getDirectory.call(navigator.storage),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error("timeout")), 1500)),
    ]);
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.toLowerCase().includes("unknown transient reason");
  }
}

export function installBlocked(path: string) {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  if (root.dataset.splash === "on" || root.dataset.intro === "1") return true;
  if (root.dataset.detailOverlay === "1") return true;
  if (path.startsWith("/weka-tangazo") || path.startsWith("/kazi/weka")) return true;
  if (path.startsWith("/tangazo/") || path.startsWith("/listing/")) return true;
  return false;
}

function readNumber(key: string) {
  try {
    return Number(localStorage.getItem(key) || "0") || 0;
  } catch {
    return 0;
  }
}

export function noteVisit() {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return readNumber(VISIT_KEY);
    sessionStorage.setItem(SESSION_KEY, "1");
    const next = readNumber(VISIT_KEY) + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function visitCount() {
  return readNumber(VISIT_KEY);
}

export function dismissedUntil() {
  try {
    return Number(localStorage.getItem(DISMISS_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

export function installDismissed() {
  return dismissedUntil() > Date.now();
}

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + HIDE_MS));
  } catch {
    /* ignore */
  }
  trackInstall("later");
}

export function queueInstallNudge(reason: NudgeReason) {
  try {
    if (localStorage.getItem(NUDGED_KEY) === "1") return;
    sessionStorage.setItem(NUDGE_KEY, reason);
  } catch {
    /* ignore */
  }
}

export function peekNudge(): NudgeReason | null {
  try {
    if (localStorage.getItem(NUDGED_KEY) === "1") return null;
    const value = sessionStorage.getItem(NUDGE_KEY);
    return value === "publish" || value === "save" ? value : null;
  } catch {
    return null;
  }
}

export function consumeNudge() {
  try {
    localStorage.setItem(NUDGED_KEY, "1");
    sessionStorage.removeItem(NUDGE_KEY);
  } catch {
    /* ignore */
  }
}

export function trackInstall(outcome: InstallOutcome) {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const list = raw ? JSON.parse(raw) as { outcome: InstallOutcome; at: string }[] : [];
    list.push({ outcome, at: new Date().toISOString() });
    localStorage.setItem(EVENTS_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jengo-install", { detail: { outcome } }));
  }
}

export async function runPrompt() {
  const event = deferred;
  deferred = null;
  emit();
  if (!event) return "dismissed" as const;
  await event.prompt();
  const choice = await event.userChoice;
  const outcome = choice.outcome === "accepted" ? "accepted" : "dismissed";
  trackInstall(outcome);
  return outcome;
}

export function registerServiceWorker(onUpdate: () => void) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  let reload = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reload) window.location.reload();
  });
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
    const watch = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) onUpdate();
      });
    };
    if (reg.waiting && navigator.serviceWorker.controller) onUpdate();
    watch(reg.installing);
    reg.addEventListener("updatefound", () => watch(reg.installing));
    (window as Window & { jengoRefresh?: () => void }).jengoRefresh = () => {
      reload = true;
      reg.waiting?.postMessage("SKIP_WAITING");
    };
  }).catch(() => {});
}
