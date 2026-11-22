"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";

export default function ResetPage() {
  const t = useT();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const access = hash.get("access_token") || "";
    const refresh = hash.get("refresh_token") || "";
    if (!access) {
      setError(t("auth.recoverFail"));
      return;
    }
    getSupabase()
      .auth.setSession({ access_token: access, refresh_token: refresh })
      .then(({ error: sessionError }) => {
        if (sessionError) setError(sessionError.message);
        else setReady(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("auth.recoverFail")));
  }, [t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("auth.shortPassword"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.recoverFail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <h1>{t("auth.resetTitle")}</h1>
      {done ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>{t("auth.resetDone")}</p>
      ) : (
        <form onSubmit={submit} className="auth-form">
          <label className="float-field">
            <input required type="password" minLength={8} autoComplete="new-password" enterKeyHint="go" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " className="input-chocolate" disabled={!ready} />
            <span>Password</span>
          </label>
          {error ? <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p> : null}
          <button type="submit" disabled={!ready || busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">{t("auth.resetSave")}</button>
        </form>
      )}
      <p className="text-center text-sm mt-6">
        <Link href="/login?form=1" className="font-bold" style={{ color: "var(--mocha)" }}>{t("auth.enter")}</Link>
      </p>
    </main>
  );
}
