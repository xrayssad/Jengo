"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adoptSession, afterAuthPath } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { postPopupToken, readPopupToken } from "@/lib/googleAuth";

export default function GooglePopupPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const { credential, error: googleError } = readPopupToken();
    if (googleError) {
      if (postPopupToken({ error: googleError })) return;
      setError(googleError);
      return;
    }
    if (!credential) {
      const msg = "Google sign-in did not finish";
      if (postPopupToken({ error: msg })) return;
      setError(msg);
      return;
    }
    if (postPopupToken({ credential })) return;
    getSupabase()
      .auth.signInWithIdToken({ provider: "google", token: credential })
      .then(({ data, error: exchangeError }) => {
        if (exchangeError || !data.session?.access_token) {
          throw new Error(exchangeError?.message || "Session is invalid");
        }
        return adoptSession(data.session.access_token);
      })
      .then((user) => {
        window.location.href = afterAuthPath(user);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Google sign-in did not finish");
      });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "var(--paper)" }}>
      <div className="text-center max-w-sm">
        <h1 className="font-heading text-2xl mb-3" style={{ color: "var(--ink)" }}>
          {error ? "Google sign-in" : "Finishing..."}
        </h1>
        {error ? (
          <>
            <p className="text-sm mb-6" style={{ color: "var(--error)" }}>{error}</p>
            <Link href="/login" className="btn-primary inline-block px-6 py-3 rounded-[16px] text-sm font-semibold">
              Back to log in
            </Link>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Just a moment.</p>
        )}
      </div>
    </main>
  );
}
