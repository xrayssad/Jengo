"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyMessagePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/messages");
  }, [router]);
  return <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }} />;
}
