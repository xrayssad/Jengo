"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAuth } from "@/lib/api";

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
        const status = err && typeof err === "object" && "status" in err ? Number((err as { status?: number }).status) : 0;
        router.replace(admin && status !== 401 ? "/home" : "/login");
      }
    })();
    return () => {
      stop = true;
    };
  }, [admin, router]);

  if (!ok) {
    return <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }} />;
  }
  return <>{children}</>;
}
