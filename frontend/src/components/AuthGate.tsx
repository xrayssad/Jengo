"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, refreshAuth } from "@/lib/api";

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
      if (!local?.access_token) {
        router.replace("/login");
        return;
      }
      if (local.needs_username) {
        router.replace("/username");
        return;
      }
      if (admin && !local.is_admin) {
        // Confirm with the server before bouncing admins away.
      } else {
        setOk(true);
      }

      try {
        const me = await refreshAuth();
        if (stop) return;
        if (!me?.access_token) {
          router.replace("/login");
          return;
        }
        if (me.needs_username) {
          router.replace("/username");
          return;
        }
        if (admin && !me.is_admin) {
          router.replace("/home");
          return;
        }
        setOk(true);
      } catch (err) {
        if (stop) return;
        // Keep the saved session on network errors; only leave when the token is gone.
        if (!getAuthUser()?.access_token) {
          const status = err && typeof err === "object" && "status" in err ? Number((err as { status?: number }).status) : 0;
          router.replace(admin && status !== 401 ? "/home" : "/login");
          return;
        }
        if (admin && !getAuthUser()?.is_admin) {
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
