"use client";

import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getAuthUser, hasUsableSession, startSilentRenew } from "@/lib/api";
import { hushAllReels } from "@/lib/reelsMedia";
import BottomNav from "./BottomNav";
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
  const show = !hideNav(path);
  const [holdSpace, setHoldSpace] = useState(false);

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
    return startSilentRenew();
  }, [path]);

  useEffect(() => {
    if (path === "/reels") return;
    hushAllReels();
  }, [path]);

  return (
    <MqttInbox>
      <Splash />
      <VerificationNotice />
      {children}
      {(show || holdSpace || path.startsWith("/tangazo/")) && !fullBleed(path) ? <div aria-hidden className="nav-spacer" /> : null}
      <BottomNav hidden={!show} />
    </MqttInbox>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
