"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAuthUser } from "@/lib/api";
import BottomNav from "./BottomNav";

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

function hideNav(path: string) {
  if (skipUsernameGate(path)) return true;
  if (path.startsWith("/admin") || path.startsWith("/tangazo") || path.startsWith("/tuma-ombi")) return true;
  if (path.startsWith("/chat") || path.includes("/chat")) return true;
  if (path.startsWith("/messages/") && path !== "/messages") return true;
  return false;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const show = !hideNav(path);

  useEffect(() => {
    if (skipUsernameGate(path)) return;
    if (getAuthUser()?.needs_username) {
      window.location.replace("/username");
    }
  }, [path]);

  return (
    <>
      {children}
      {show && (
        <>
          <div aria-hidden style={{ height: "calc(76px + env(safe-area-inset-bottom, 0px))" }} />
          <BottomNav />
        </>
      )}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
