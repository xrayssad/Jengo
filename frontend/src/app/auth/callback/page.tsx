"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adoptSession, afterAuthPath, confirmEmailLink } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

function readParams() {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  const query = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
  const fromHash = new URLSearchParams(hash);
  const fromQuery = new URLSearchParams(query);
  const get = (key: string) => fromQuery.get(key) || fromHash.get(key);
  return { get };
}

function googleOffMessage(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("provider") || text.includes("validation_failed") || text.includes("not enabled")) {
    return "Google is not connected in Supabase. Log in with email, or turn on the Google provider.";
  }
  if (text.includes("exchange external code") || text.includes("invalid_client") || text.includes("unauthorized")) {
    return "Google could not verify the Client ID or Secret. Check Google Cloud and Supabase, then try again. This is not OTP.";
  }
  return raw;
}

function errorTitle(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("google") || text.includes("exchange") || text.includes("oauth") || text.includes("client")) {
    return "Google sign-in";
  }
  if (text.includes("kiungo") || text.includes("thibitisho") || text.includes("token") || text.includes("link") || text.includes("verif")) {
    return "Verification";
  }
  return "Sign in";
}

async function finishSession(accessToken: string) {
  const user = await adoptSession(accessToken);
  window.location.href = afterAuthPath(user);
}

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const { get } = readParams();
    const err = get("error_description") || get("error") || get("msg") || "";
    if (err) {
      setError(googleOffMessage(err));
      return;
    }
    const code = get("code");
    const token = get("access_token");
    const tokenHash = get("token_hash");
    const type = get("type") || "signup";
    if (code) {
      getSupabase()
        .auth.exchangeCodeForSession(code)
        .then(({ data, error: exchangeError }) => {
          if (exchangeError || !data.session?.access_token) {
            throw new Error(exchangeError?.message || "Session is invalid");
          }
          return finishSession(data.session.access_token);
        })
        .catch((caught) => {
          setError(googleOffMessage(caught instanceof Error ? caught.message : "Session is invalid"));
        });
      return;
    }
    if (token) {
      finishSession(token).catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Session is invalid");
      });
      return;
    }
    if (tokenHash) {
      confirmEmailLink(tokenHash, type)
        .then((user) => {
          window.location.href = afterAuthPath(user);
        })
        .catch((caught) => {
          setError(caught instanceof Error ? caught.message : "Link expired or is invalid");
        });
      return;
    }
    setError("Verification did not finish. Open the link from your email, or log in with email.");
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "var(--paper)" }}>
      <div className="text-center max-w-sm">
        <h1 className="font-heading text-2xl mb-3" style={{ color: "var(--ink)" }}>
          {error ? errorTitle(error) : "Finishing..."}
        </h1>
        {error ? (
          <>
            <p className="text-sm mb-6" style={{ color: "var(--error)" }}>{error}</p>
            <Link href="/login" className="btn-primary inline-block px-6 py-3 rounded-[16px] text-sm font-semibold">Back to log in</Link>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Just a moment.</p>
        )}
      </div>
    </main>
  );
}
