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
  if (text.includes("code verifier") || text.includes("pkce") || text.includes("flow state")) {
    return "Google sign-in must start and finish in the same browser. Go back to log in and try Continue with Google again.";
  }
  return raw;
}

function errorTitle(raw: string) {
  const text = raw.toLowerCase();
  if (
    text.includes("google") ||
    text.includes("exchange") ||
    text.includes("oauth") ||
    text.includes("client") ||
    text.includes("flow state") ||
    text.includes("pkce")
  ) {
    return "Google sign-in";
  }
  if (text.includes("kiungo") || text.includes("thibitisho") || text.includes("token") || text.includes("link") || text.includes("verif")) {
    return "Verification";
  }
  return "Sign in";
}

async function finishSession(accessToken: string, refreshToken?: string) {
  const user = await adoptSession(accessToken, refreshToken);
  window.location.replace(afterAuthPath(user));
}

async function finishWithCode(code: string) {
  const { data, error } = await getSupabase().auth.exchangeCodeForSession(code);
  const session = data.session;
  const token = session?.access_token;
  if (!token) throw new Error(error?.message || "Session is invalid");
  return finishSession(token, session?.refresh_token || undefined);
}

let runningKey = "";
let running: Promise<void> | null = null;

function completeCallback() {
  const { get } = readParams();
  const key =
    get("code") ||
    get("access_token") ||
    get("token_hash") ||
    get("error_description") ||
    get("error") ||
    get("msg") ||
    "empty";
  if (running && runningKey === key) return running;
  runningKey = key;
  running = (async () => {
    const err = get("error_description") || get("error") || get("msg") || "";
    if (err) throw new Error(err);
    const code = get("code");
    const token = get("access_token");
    const refresh = get("refresh_token") || undefined;
    const tokenHash = get("token_hash");
    const type = get("type") || "signup";
    if (code) {
      await finishWithCode(code);
      return;
    }
    if (token) {
      await finishSession(token, refresh);
      return;
    }
    if (tokenHash) {
      const user = await confirmEmailLink(tokenHash, type);
      window.location.replace(afterAuthPath(user));
      return;
    }
    throw new Error("Verification did not finish. Open the link from your email, or log in with email.");
  })();
  return running;
}

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    completeCallback()
      .catch((caught) => {
        const raw = caught instanceof Error ? caught.message : "Session is invalid";
        if (!cancelled) setError(googleOffMessage(raw));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "var(--paper)" }}>
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold mb-3" style={{ color: "var(--text)" }}>
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
