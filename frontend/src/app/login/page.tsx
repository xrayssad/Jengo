"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { afterAuthPath, login as apiLogin, resendOtp, startGoogle } from "@/lib/api";
import { markIntroPending } from "@/lib/intro";
import AuthCollage from "@/components/AuthCollage";
import Brand from "@/components/Brand";
import SignedInHome from "@/components/SignedInHome";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const t = useT();
  const [mode, setMode] = useState<"welcome" | "form">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [googleMsg, setGoogleMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("form") === "1") setMode("form");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setBusy(true);
    try {
      const user = await apiLogin(email.trim(), password);
      markIntroPending();
      window.location.href = afterAuthPath(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Username or password is incorrect";
      if (msg.toLowerCase().includes("haijathibitishwa") || msg.toLowerCase().includes("not verified")) {
        setUnverified(true);
        setError("Account not verified. Resend the code to confirm it.");
      } else {
        setError("Username or password is incorrect");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setGoogleMsg("");
    setBusy(true);
    try {
      await startGoogle(`${window.location.origin}/auth/callback`);
    } catch (err) {
      setGoogleMsg(err instanceof Error ? err.message : "Google is not connected in Supabase. Turn on the Google provider, or log in with email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <SignedInHome />
      <AuthCollage />
      <div className="auth-brand">
        <Brand variant="mark" size={56} />
        <p className="auth-word">Jengo</p>
      </div>
      {mode === "welcome" ? (
        <div className="auth-welcome">
          <h1>{t("auth.headline")}</h1>
          <Link href="/register" className="btn-primary w-full py-4 rounded-full text-sm font-semibold">{t("auth.join")}</Link>
          <button type="button" className="btn-secondary w-full mt-3 py-3.5 rounded-full text-sm font-semibold" onClick={() => setMode("form")}>{t("auth.enter")}</button>
          <Link href="/home" className="auth-guest">{t("auth.guest")}</Link>
        </div>
      ) : null}
      {mode === "form" ? (
        <>
      <button type="button" className="auth-back" onClick={() => setMode("welcome")}>{t("back")}</button>
      <h1>{t("auth.welcomeBack")}</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="float-field">
          <User size={16} aria-hidden />
          <input required value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " autoComplete="username" enterKeyHint="next" className="input-chocolate" />
          <span>Username</span>
        </label>
        <label className="float-field">
          <Lock size={16} aria-hidden />
          <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " autoComplete="current-password" enterKeyHint="go" className="input-chocolate" />
          <span>Password</span>
          <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </label>
        <p className="text-sm">
          <Link href="/recover" className="font-semibold" style={{ color: "var(--mocha)" }}>{t("auth.forgot")} {t("auth.recover")}</Link>
        </p>
        {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
        {unverified && (
          <button
            type="button"
            className="block text-sm font-semibold"
            style={{ color: "var(--mocha)" }}
            onClick={async () => {
              try {
                const sent = await resendOtp({ email: email.trim() });
                const inbox = sent.email || email.trim();
                window.location.href = `/verify?email=${encodeURIComponent(inbox)}&sent=1`;
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Could not send";
                if (msg.toLowerCase().includes("60") || msg.toLowerCase().includes("baadaye") || msg.toLowerCase().includes("later")) {
                  window.location.href = `/verify?email=${encodeURIComponent(email.trim())}&sent=1`;
                  return;
                }
                setError(msg);
              }
            }}
          >
            Resend code
          </button>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>
      <button type="button" onClick={google} disabled={busy} className="btn-secondary w-full mt-3 py-3.5 rounded-full text-sm font-semibold">
        {busy ? "Opening Google..." : "Continue with Google"}
      </button>
      {googleMsg && <p className="text-sm mt-3 font-semibold" style={{ color: "var(--error)" }}>{googleMsg}</p>}
      <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
        <Link href="/register" className="font-bold" style={{ color: "var(--mocha)" }}>{t("auth.join")}</Link>
      </p>
        </>
      ) : null}
    </main>
  );
}
