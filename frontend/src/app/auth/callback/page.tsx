"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adoptSession } from "@/lib/api";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const query = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
    const params = new URLSearchParams(hash || query);
    const token = params.get("access_token");
    if (!token) {
      setError("Google haijatoa kipindi. Hakikisha provider imeunganishwa.");
      return;
    }
    adoptSession(token)
      .then(() => {
        window.location.href = "/home";
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Kipindi hakikubaliki");
      });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="text-center max-w-sm">
        <h1 className="font-heading text-2xl mb-3" style={{ color: "#2E1A0F" }}>
          {error ? "Google" : "Inakamilisha..."}
        </h1>
        {error ? (
          <>
            <p className="text-sm mb-6" style={{ color: "#A6452E" }}>{error}</p>
            <Link href="/login" className="btn-primary inline-block px-6 py-3 rounded-[16px] text-sm font-semibold">Rudi kuingia</Link>
          </>
        ) : (
          <p className="text-sm" style={{ color: "#5C4033" }}>Subiri kidogo.</p>
        )}
      </div>
    </main>
  );
}
