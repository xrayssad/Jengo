"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, hasUsableSession, refreshAuth, rememberReturn } from "@/lib/api";

export default function AuthGate({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let stop = false;

    (async () => {
      const local = getAuthUser();
      if (!local?.access_token && !local?.refresh_token) {
        rememberReturn();
        router.replace("/login");
        return;
      }
      if (local.needs_username) {
        router.replace("/username");
        return;
      }
      if (admin && !local.is_admin) {
        // Confirm with the server before bouncing admins away.
      } else if (local.access_token) {
        // Show protected UI immediately when a stored access token exists.
        setOk(true);
      }

      try {
        const me = await refreshAuth();
        if (stop) return;
        // Only bounce to login when the session is truly gone (definitive expiry cleared tokens,
        // or there was never a usable local session). Transient renew/network failures keep tokens.
        if (!hasUsableSession()) {
          rememberReturn();
          router.replace("/login");
          return;
        }
        const live = me || getAuthUser();
        if (!live) {
          rememberReturn();
          router.replace("/login");
          return;
        }
        if (live.needs_username) {
          router.replace("/username");
          return;
        }
        if (admin && !live.is_admin) {
          router.replace("/home");
          return;
        }
        setOk(true);
      } catch (err) {
        if (stop) return;
        if (!hasUsableSession()) {
          const status = err && typeof err === "object" && "status" in err ? Number((err as { status?: number }).status) : 0;
          if (!(admin && status !== 401)) rememberReturn();
          router.replace(admin && status !== 401 ? "/home" : "/login");
          return;
        }
        const localAdmin = getAuthUser();
        if (admin && !localAdmin?.is_admin) {
          router.replace("/home");
          return;
        }
        setOk(true);
      }
    })();

    return () => {
      stop = true;
    };
  }, [admin, router]);

  if (!ok) {
    return <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }} />;
  }
  return <>{children}</>;
}
