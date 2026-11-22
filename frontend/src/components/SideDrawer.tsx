"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  CircleHelp,
  FileText,
  Home,
  Info,
  LogOut,
  MessageCircle,
  Plus,
  Shield,
  SunMoon,
} from "lucide-react";
import { clearAuth, getAuthUser, isSignedIn } from "@/lib/api";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "./ThemeProvider";
import { InstallMenuItem, useInstallPrompt } from "./InstallUI";
import { useInboxLive } from "./MqttInbox";
import VerifiedBadge from "./VerifiedBadge";
import type { ThemeChoice } from "@/lib/theme";

const APP_VERSION = "0.1.0";

export default function SideDrawer() {
  const { t, lang, setLang } = useI18n();
  const { preference, setTheme } = useTheme();
  const { canInstall } = useInstallPrompt();
  const inbox = useInboxLive();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    const show = () => {
      setAuthed(isSignedIn());
      setOpen(true);
    };
    const hide = () => {
      if (openRef.current) setOpen(false);
    };
    window.addEventListener("jengo-drawer-open", show);
    window.addEventListener("jengo-drawer-close", hide);
    return () => {
      window.removeEventListener("jengo-drawer-open", show);
      window.removeEventListener("jengo-drawer-close", hide);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.drawer = "1";
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const state = { ...(window.history.state || {}), jengoDrawer: 1 };
    window.history.pushState(state, "");
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    const node = panel.current;
    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>("a,button,input,select,textarea,[tabindex]:not([tabindex='-1'])") || []).filter(
        (el) => !el.hasAttribute("disabled"),
      );
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (window.history.state?.jengoDrawer) window.history.back();
        else setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    node?.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      node?.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      if (root.dataset.drawer === "1") delete root.dataset.drawer;
    };
  }, [open]);

  const requestClose = () => {
    if (window.history.state?.jengoDrawer) window.history.back();
    else setOpen(false);
  };

  const leave = () => {
    if (window.history.state?.jengoDrawer) {
      const state = { ...(window.history.state || {}) };
      delete state.jengoDrawer;
      window.history.replaceState(state, "");
    }
    setOpen(false);
  };

  const drag = useRef({ x: 0, on: false });
  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, on: true };
  };
  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.on || !panel.current) return;
    const next = Math.min(0, event.clientX - drag.current.x);
    panel.current.style.transform = `translateX(${next}px)`;
  };
  const onDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.on) return;
    drag.current.on = false;
    const dx = event.clientX - drag.current.x;
    if (panel.current) panel.current.style.transform = "";
    if (dx < -72) requestClose();
  };

  const user = open ? getAuthUser() : null;
  const name = user?.full_name || user?.username || "";
  const role = user?.is_admin || user?.role === "admin" ? t("profile.admin") : user?.role && user.role !== "user" ? user.role : "";

  if (!open) return null;

  return (
    <div className="drawer-root" role="presentation">
      <button type="button" className="drawer-scrim" aria-label={t("close")} onClick={requestClose} />
      <div
        ref={panel}
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        tabIndex={-1}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <header className="drawer-head">
          {authed && user ? (
            <>
              <div className="drawer-avatar" aria-hidden>{(name || "J").slice(0, 1).toUpperCase()}</div>
              <div className="drawer-id">
                <p>
                  <span>{name || t("nav.profile")}</span>
                  {user.is_verified ? <VerifiedBadge size="sm" type={user.verified_type || null} /> : null}
                </p>
                {role ? <span className="drawer-role">{role}</span> : null}
                <Link href="/profile" onClick={leave}>{t("drawer.profile")}</Link>
              </div>
            </>
          ) : (
            <div className="drawer-guest">
              <Link href="/login" className="btn-primary" onClick={leave}>{t("drawer.login")}</Link>
              <Link href="/register" className="btn-secondary" onClick={leave}>{t("drawer.register")}</Link>
            </div>
          )}
        </header>
        <nav className="drawer-list">
          <DrawerLink href="/home" icon={<Home size={18} />} label={t("nav.home")} onClick={leave} />
          <DrawerLink href="/mypost" icon={<FileText size={18} />} label={t("drawer.mine")} onClick={leave} />
          <DrawerLink href="/favorites" icon={<Bookmark size={18} />} label={t("drawer.saved")} onClick={leave} />
          <DrawerLink href="/messages" icon={<MessageCircle size={18} />} label={t("messages")} badge={inbox.unread} onClick={leave} />
          <DrawerLink href="/weka-tangazo" icon={<Plus size={18} />} label={t("post")} onClick={leave} />
          <DrawerLink href="/hakiki" icon={<BadgeCheck size={18} />} label={t("verify.menu")} onClick={leave} />
          <DrawerLink href="/messages" icon={<Bell size={18} />} label={t("notes")} onClick={leave} />
          <div className="drawer-row">
            <span className="drawer-ico" aria-hidden><span>Aa</span></span>
            <span className="drawer-label">{t("language")}</span>
            <span className="lang-pair">
              {(["sw", "en"] as Lang[]).map((code) => (
                <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)}>{code.toUpperCase()}</button>
              ))}
            </span>
          </div>
          <div className="drawer-row drawer-theme">
            <span className="drawer-ico" aria-hidden><SunMoon size={18} /></span>
            <span className="drawer-label">{t("drawer.theme")}</span>
            <span className="lang-pair">
              {(["light", "dark", "system"] as ThemeChoice[]).map((choice) => (
                <button key={choice} type="button" aria-pressed={preference === choice} onClick={() => setTheme(choice)}>
                  {t(`drawer.theme.${choice}`)}
                </button>
              ))}
            </span>
          </div>
          {canInstall ? (
            <div className="drawer-row">
              <InstallMenuItem />
            </div>
          ) : null}
          <DrawerLink href="/about" icon={<CircleHelp size={18} />} label={t("drawer.help")} onClick={leave} />
          <DrawerLink href="/about" icon={<Info size={18} />} label={t("drawer.about")} onClick={leave} />
          <DrawerLink href="/about" icon={<FileText size={18} />} label={t("drawer.policy")} onClick={leave} />
          <DrawerLink href="/about" icon={<Shield size={18} />} label={t("drawer.privacy")} onClick={leave} />
          {authed ? (
            <button
              type="button"
              className="drawer-row is-out"
              onClick={() => {
                leave();
                clearAuth();
                window.location.href = "/login";
              }}
            >
              <span className="drawer-ico" aria-hidden><LogOut size={18} /></span>
              <span className="drawer-label">{t("settings.logout")}</span>
            </button>
          ) : null}
        </nav>
        <p className="drawer-version">{t("drawer.version", { version: APP_VERSION })}</p>
      </div>
    </div>
  );
}

function DrawerLink({
  href,
  icon,
  label,
  badge = false,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: boolean;
  onClick: () => void;
}) {
  return (
    <Link href={href} className="drawer-row" onClick={onClick}>
      <span className="drawer-ico" aria-hidden>{icon}</span>
      <span className="drawer-label">{label}</span>
      {badge ? <i className="drawer-badge" /> : null}
    </Link>
  );
}
