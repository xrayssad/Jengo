"use client";

import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { bootPreferences, getAuthUser, hasUsableSession, startSilentRenew } from "@/lib/api";
import "@/lib/viewState";
import { SHOW_LANDING_PAGE } from "@/lib/productFlags";
import { hushAllReels } from "@/lib/reelsMedia";
import BottomNav from "./BottomNav";
import SideDrawer from "./SideDrawer";
import NativeChrome from "./NativeChrome";
import PerfDebug from "./PerfDebug";
import { InstallProvider } from "./InstallUI";
import MqttInbox from "./MqttInbox";
import Splash from "./Splash";
import VerificationNotice from "./VerificationNotice";

function skipUsernameGate(path: string) {
  return (
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/verify") ||
    path.startsWith("/auth") ||
    path.startsWith("/username")
  );
}

const NAV_HIDDEN = ["/admin", "/tangazo", "/tuma-ombi", "/chat", "/weka-tangazo", "/picha", "/reels/new", "/kazi/weka"];

function hideNav(path: string) {
  if (skipUsernameGate(path)) return true;
  if (NAV_HIDDEN.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix))) return true;
  if (path.includes("/chat")) return true;
  if (path.startsWith("/messages/") && path !== "/messages") return true;
  return false;
}

function fullBleed(path: string) {
  return path === "/reels";
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const showNav = !hideNav(path);
  const [holdSpace, setHoldSpace] = useState(false);
  const [searching, setSearching] = useState(false);
  const show = showNav && !searching;

  useLayoutEffect(() => {
    if (path === "/" && !SHOW_LANDING_PAGE) window.location.replace("/home");
  }, [path]);

  useLayoutEffect(() => {
    const sync = () => setSearching(document.documentElement.dataset.searchOverlay === "1");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-search-overlay"] });
    return () => obs.disconnect();
  }, []);

  useLayoutEffect(() => {
    const sync = () => setHoldSpace(document.documentElement.dataset.detailOverlay === "1");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-detail-overlay"] });
    return () => obs.disconnect();
  }, [path]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (show) root.style.removeProperty("--nav-offset");
    else root.style.setProperty("--nav-offset", "0px");
    return () => {
      root.style.removeProperty("--nav-offset");
    };
  }, [show]);

  useEffect(() => {
    if (skipUsernameGate(path)) return;
    if (getAuthUser()?.needs_username) {
      window.location.replace("/username");
    }
  }, [path]);

  useEffect(() => {
    if (!hasUsableSession()) return;
    void bootPreferences();
  }, []);

  useEffect(() => {
    if (!hasUsableSession()) return;
    return startSilentRenew();
  }, [path]);

  useEffect(() => {
    if (path === "/reels") return;
    hushAllReels();
  }, [path]);

  useEffect(() => {
    const rootTab = path === "/home" || path === "/reels" || path === "/messages" || path === "/profile";
    let startX = 0;
    let startY = 0;
    let armed = false;
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      armed = touch.clientX < 28 && document.documentElement.dataset.sheet !== "1" && document.documentElement.dataset.drawer !== "1";
      startX = touch.clientX;
      startY = touch.clientY;
    };
    const onEnd = (event: TouchEvent) => {
      if (!armed) return;
      armed = false;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (dx <= 72 || Math.abs(dy) >= 48) return;
      if (document.documentElement.dataset.drawer === "1") {
        window.dispatchEvent(new Event("jengo-drawer-close"));
        return;
      }
      if (rootTab) {
        window.dispatchEvent(new Event("jengo-drawer-open"));
        return;
      }
      window.history.back();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [path]);

  return (
    <InstallProvider>
      <MqttInbox>
        <NativeChrome />
        <SideDrawer />
        <PerfDebug />
        <Splash />
        <VerificationNotice />
        {children}
        {(show || holdSpace || path.startsWith("/tangazo/")) && !fullBleed(path) ? <div aria-hidden className="nav-spacer" /> : null}
        <BottomNav hidden={!show} />
      </MqttInbox>
    </InstallProvider>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
