"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adoptSession, confirmEmailLink } from "@/lib/api";
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
    return "Google haijaunganishwa kwenye Supabase. Ingia kwa barua pepe, au washa Google provider.";
  }
  if (text.includes("exchange external code") || text.includes("invalid_client") || text.includes("unauthorized")) {
    return "Google imeshindwa kuthibitisha Client ID au Secret. Angalia Google Cloud na Supabase, kisha jaribu tena. Hii si OTP.";
  }
  return raw;
}

function errorTitle(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("google") || text.includes("exchange") || text.includes("oauth") || text.includes("client")) {
    return "Kuingia na Google";
  }
  if (text.includes("kiungo") || text.includes("thibitisho") || text.includes("token")) {
    return "Thibitisho";
  }
  return "Kuingia";
}

async function goHome(accessToken: string) {
  await adoptSession(accessToken);
  window.location.href = "/home";
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
            throw new Error(exchangeError?.message || "Kipindi hakikubaliki");
          }
          return goHome(data.session.access_token);
        })
        .catch((caught) => {
          setError(googleOffMessage(caught instanceof Error ? caught.message : "Kipindi hakikubaliki"));
        });
      return;
    }
    if (token) {
      goHome(token).catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Kipindi hakikubaliki");
      });
      return;
    }
    if (tokenHash) {
      confirmEmailLink(tokenHash, type)
        .then(() => {
          window.location.href = "/home";
        })
        .catch((caught) => {
          setError(caught instanceof Error ? caught.message : "Kiungo kimeisha au si sahihi");
        });
      return;
    }
    setError("Thibitisho halijakamilika. Fungua kiungo kutoka barua pepe, au ingia kwa barua pepe.");
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="text-center max-w-sm">
        <h1 className="font-heading text-2xl mb-3" style={{ color: "#2E1A0F" }}>
          {error ? errorTitle(error) : "Inakamilisha..."}
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
