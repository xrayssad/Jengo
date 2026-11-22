"use client";

import { useState } from "react";
import Link from "next/link";
import { recoverPassword } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function RecoverPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError(t("auth.needEmail"));
      return;
    }
    setBusy(true);
    try {
      await recoverPassword(email.trim(), `${window.location.origin}/reset`);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.recoverFail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <h1>{t("auth.recoverTitle")}</h1>
      {sent ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>{t("auth.recoverSent")}</p>
      ) : (
        <form onSubmit={submit} className="auth-form">
          <label className="float-field">
            <input required type="email" inputMode="email" autoComplete="email" enterKeyHint="go" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " className="input-chocolate" />
            <span>Email</span>
          </label>
          {error ? <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p> : null}
          <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">{busy ? "…" : t("auth.recover")}</button>
        </form>
      )}
      <p className="text-center text-sm mt-6">
        <Link href="/login?form=1" className="font-bold" style={{ color: "var(--mocha)" }}>{t("auth.enter")}</Link>
      </p>
    </main>
  );
}
