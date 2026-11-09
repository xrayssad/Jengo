"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GooglePopupPage() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "var(--paper)" }}>
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold mb-3" style={{ color: "var(--text)" }}>
          Google sign-in
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Continue from the log in page.
        </p>
        <Link href="/login" className="btn-primary inline-block px-6 py-3 rounded-[16px] text-sm font-semibold">
          Back to log in
        </Link>
      </div>
    </main>
  );
}
