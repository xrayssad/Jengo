"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

function hideNav(path: string) {
  if (path === "/" || path.startsWith("/login") || path.startsWith("/register")) return true;
  if (path.startsWith("/tangazo") || path.startsWith("/tuma-ombi")) return true;
  if (path.startsWith("/messages/") && path !== "/messages") return true;
  return false;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const show = !hideNav(path);

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
