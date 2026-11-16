"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Check, Plus, Share } from "lucide-react";
import JengoLogo from "@/components/JengoLogo";
import { useT } from "@/lib/i18n";
import {
  bindInstallPrompt,
  consumeNudge,
  detectKind,
  dismissInstall,
  getDeferredPrompt,
  installBlocked,
  installDismissed,
  isDesktop,
  isStandalone,
  noteVisit,
  peekNudge,
  promptFired,
  registerServiceWorker,
  runPrompt,
  subscribeInstall,
  visitCount,
  type InstallKind,
  type NudgeReason,
} from "@/lib/install";

type InstallApi = {
  canInstall: boolean;
  open: () => void;
};

const InstallCtx = createContext<InstallApi>({ canInstall: false, open: () => {} });

export function useInstallPrompt() {
  return useContext(InstallCtx);
}

type DebugReport = {
  manifest: string;
  icons: string;
  standalone: boolean;
  prompt: boolean;
  secure: boolean;
  sw: string;
  reason: string;
};

function kindNow(): InstallKind | null {
  return detectKind(Boolean(getDeferredPrompt()));
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const t = useT();
  const [ready, setReady] = useState(false);
  const [rev, setRev] = useState(0);
  const [standalone, setStandalone] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [gate, setGate] = useState(0);
  const [banner, setBanner] = useState(false);
  const [nudge, setNudge] = useState<NudgeReason | null>(null);
  const [sheet, setSheet] = useState<InstallKind | null>(null);
  const [fromMenu, setFromMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [update, setUpdate] = useState(false);
  const [debug, setDebug] = useState<DebugReport | null>(null);
  const autoOpened = useRef(false);
  const kind = kindNow();
  const quiet = isDesktop();

  useEffect(() => {
    setReady(true);
    bindInstallPrompt();
    noteVisit();
    setStandalone(isStandalone());
    const unsub = subscribeInstall(() => setRev((n) => n + 1));
    registerServiceWorker(() => setUpdate(true));
    const media = window.matchMedia("(display-mode: standalone)");
    const onMode = () => setStandalone(isStandalone());
    media.addEventListener("change", onMode);
    let touched = false;
    let elapsed = false;
    const arm = () => {
      if (visitCount() >= 2 || (touched && elapsed)) setEngaged(true);
    };
    const onTouch = () => {
      touched = true;
      arm();
    };
    window.addEventListener("pointerdown", onTouch);
    window.addEventListener("keydown", onTouch);
    const timer = window.setTimeout(() => {
      elapsed = true;
      arm();
    }, 30000);
    if (visitCount() >= 2) setEngaged(true);
    const obs = new MutationObserver(() => setGate((n) => n + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-splash", "data-intro", "data-detail-overlay"] });
    return () => {
      unsub();
      media.removeEventListener("change", onMode);
      window.removeEventListener("pointerdown", onTouch);
      window.removeEventListener("keydown", onTouch);
      window.clearTimeout(timer);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (standalone || installBlocked(path)) {
      setBanner(false);
      setSheet(null);
      return;
    }
    const current = kindNow();
    if (!current) {
      setBanner(false);
      return;
    }
    const pending = peekNudge();
    if (pending) setNudge(pending);
    const showNudge = Boolean(pending);
    if (!showNudge && (!engaged || installDismissed())) {
      setBanner(false);
      return;
    }
    if (current === "native") {
      setBanner(true);
      return;
    }
    if (!autoOpened.current) {
      autoOpened.current = true;
      setFromMenu(false);
      setSheet(current);
    }
  }, [path, engaged, rev, standalone, gate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debugPwa") !== "1") return;
    let cancel = false;
    const report = async () => {
      let manifest = "missing";
      let reason = "";
      try {
        const res = await fetch("/manifest.webmanifest");
        const type = res.headers.get("content-type") || "";
        const data = await res.json();
        manifest = res.ok && type.includes("manifest") ? `ok ${data.name || ""}` : `bad ${res.status}`;
        if (!data.icons?.length) reason = "Manifest has no icons";
      } catch {
        manifest = "failed";
        reason = "Manifest request failed";
      }
      const icons = await Promise.all(["/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"].map(async (src) => {
        try {
          const img = new Image();
          img.src = src;
          await img.decode();
          return `${img.naturalWidth}x${img.naturalHeight}`;
        } catch {
          return `${src} failed`;
        }
      }));
      const sw = "serviceWorker" in navigator
        ? (await navigator.serviceWorker.getRegistration()) ? "registered" : "not registered"
        : "unsupported";
      const secure = window.isSecureContext;
      const prompt = promptFired();
      const alone = isStandalone();
      const current = kindNow();
      if (!reason) {
        if (!secure) reason = "Not a secure context";
        else if (alone) reason = "Already installed";
        else if (current === "ios") reason = "iOS Safari uses the share sheet";
        else if (current === "safari") reason = "Open this page in Safari to install";
        else if (current === "webview") reason = "In-app browser cannot install";
        else if (!prompt) reason = "Chrome has not offered install yet";
        else reason = "Install prompt is ready";
      }
      const next = { manifest, icons: icons.join(", "), standalone: alone, prompt, secure, sw, reason };
      if (!cancel) {
        setDebug(next);
        console.info("[jengo pwa]", next);
      }
    };
    void report();
    return () => {
      cancel = true;
    };
  }, [rev, path]);

  const install = async () => {
    consumeNudge();
    const outcome = await runPrompt();
    setBanner(false);
    setNudge(null);
    if (outcome === "accepted") setStandalone(true);
  };

  const later = () => {
    consumeNudge();
    if (!nudge) dismissInstall();
    setBanner(false);
    setNudge(null);
  };

  const open = () => {
    const current = kindNow();
    if (!current || isStandalone()) return;
    autoOpened.current = true;
    if (current === "native") {
      void install();
      return;
    }
    setFromMenu(true);
    setSheet(current);
  };

  const closeSheet = () => {
    consumeNudge();
    if (!fromMenu) dismissInstall();
    setFromMenu(false);
    setSheet(null);
    setNudge(null);
  };

  const copyLink = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const input = document.createElement("textarea");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
  };

  const canInstall = ready && !standalone && Boolean(kind);
  const chrome = (
    <>
      {update ? (
        <div className="install-update" role="status">
          <p>{t("install.update")}</p>
          <button type="button" onClick={() => (window as Window & { jengoRefresh?: () => void }).jengoRefresh?.()}>{t("install.refresh")}</button>
        </div>
      ) : null}
      {banner && kind === "native" ? (
        <aside className={quiet ? "install-card is-quiet" : "install-card"} role="dialog" aria-label={t("install.title")}>
          <span className="install-mark" aria-hidden>
            <JengoLogo variant="mark" size={36} title="" />
          </span>
          <div className="install-copy">
            <p className="install-title">{nudge === "publish" ? t("install.nudgePost") : nudge === "save" ? t("install.nudgeSave") : t("install.title")}</p>
            <p className="install-body">{t("install.body")}</p>
            <div className="install-actions">
              <button type="button" className="install-go" onClick={() => { void install(); }}>{t("install.action")}</button>
              <button type="button" className="install-later" onClick={later}>{t("install.later")}</button>
            </div>
          </div>
        </aside>
      ) : null}
      {sheet ? (
        <div className="install-sheet" role="presentation" onClick={closeSheet}>
          <div
            className="install-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t(sheet === "ios" ? "install.iosTitle" : "install.openTitle")}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="install-mark" aria-hidden>
              <JengoLogo variant="mark" size={42} title="" />
            </span>
            {sheet === "ios" ? (
              <>
                <p className="install-title">{t("install.iosTitle")}</p>
                <ol className="install-steps">
                  <li><Share size={18} aria-hidden /> {t("install.ios1")}</li>
                  <li><Plus size={18} aria-hidden /> {t("install.ios2")}</li>
                  <li><Check size={18} aria-hidden /> {t("install.ios3")}</li>
                </ol>
              </>
            ) : (
              <>
                <p className="install-title">{sheet === "safari" ? t("install.safari") : t("install.webview")}</p>
                <button type="button" className="install-go" onClick={() => { void copyLink(); }}>
                  {copied ? t("install.copied") : t("install.copy")}
                </button>
              </>
            )}
            <button type="button" className="install-later" onClick={closeSheet}>{t("install.later")}</button>
          </div>
        </div>
      ) : null}
      {debug ? (
        <pre className="install-debug" role="status">
{`manifest: ${debug.manifest}
icons: ${debug.icons}
standalone: ${debug.standalone}
beforeinstallprompt: ${debug.prompt}
secure: ${debug.secure}
service worker: ${debug.sw}
${debug.reason}`}
        </pre>
      ) : null}
    </>
  );

  return (
    <InstallCtx.Provider value={{ canInstall, open }}>
      {children}
      {ready ? createPortal(chrome, document.body) : null}
    </InstallCtx.Provider>
  );
}

export function InstallMenuItem({ variant = "drawer" }: { variant?: "drawer" | "profile" }) {
  const { canInstall, open } = useInstallPrompt();
  const t = useT();
  if (!canInstall) return null;
  if (variant === "profile") {
    return (
      <button type="button" className="install-menu sheet" onClick={open}>
        <span className="soft-icon-btn shrink-0" aria-hidden>
          <JengoLogo variant="mark" size={18} title="" />
        </span>
        <span className="install-menu-copy">
          <span>{t("install.menu")}</span>
          <span>{t("install.menuHint")}</span>
        </span>
      </button>
    );
  }
  return (
    <button type="button" className="install-menu is-drawer" onClick={open}>
      <JengoLogo variant="mark" size={18} title="" />
      <span>{t("install.menu")}</span>
    </button>
  );
}
