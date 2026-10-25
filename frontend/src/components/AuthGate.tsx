"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser } from "@/lib/api";

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
    const user = getAuthUser();
    if (!user?.access_token) {
      router.replace("/login");
      return;
    }
    if (user.needs_username) {
      router.replace("/username");
      return;
    }
    if (admin && !user.is_admin) {
      router.replace("/home");
      return;
    }
    setOk(true);
  }, [admin, router]);

  if (!ok) {
    return <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }} />;
  }
  return <>{children}</>;
}
