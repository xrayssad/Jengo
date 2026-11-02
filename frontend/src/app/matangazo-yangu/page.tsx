"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/mypost");
  }, [router]);
  return <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }} />;
}
