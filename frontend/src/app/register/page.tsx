"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { afterAuthPath, register as apiRegister, startGoogle } from "@/lib/api";
import { markIntroPending } from "@/lib/intro";
import AuthCollage from "@/components/AuthCollage";
import Brand from "@/components/Brand";
import SignedInHome from "@/components/SignedInHome";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [googleMsg, setGoogleMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username.trim())) {
      setError("Username: 3–20 characters, letters, numbers or _");
      return;
    }
    setBusy(true);
    try {
      const created = await apiRegister({
        email: email.trim(),
        password,
        username: username.trim(),
        full_name: fullName.trim(),
      });
      if (created.access_token) {
        markIntroPending();
        window.location.href = afterAuthPath(created);
        return;
      }
      if (created.email) {
        router.push(`/verify?email=${encodeURIComponent(created.email)}&sent=1`);
        return;
      }
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account");
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
      <h1>Create account</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="float-field">
          <User size={16} aria-hidden />
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder=" " autoComplete="name" className="input-chocolate" />
          <span>Full name</span>
        </label>
        <label className="float-field">
          <User size={16} aria-hidden />
          <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder=" " autoComplete="username" className="input-chocolate" />
          <span>Username</span>
        </label>
        <label className="float-field">
          <Mail size={16} aria-hidden />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " autoComplete="email" className="input-chocolate" />
          <span>Email</span>
        </label>
        <label className="float-field">
          <Lock size={16} aria-hidden />
          <input type={show ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " autoComplete="new-password" className="input-chocolate" />
          <span>Password</span>
          <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </label>
        {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">
          {busy ? "Creating account..." : "Continue"}
        </button>
      </form>
      <button type="button" onClick={google} disabled={busy} className="btn-secondary w-full mt-3 py-3.5 rounded-full text-sm font-semibold">
        {busy ? "Opening Google..." : "Continue with Google"}
      </button>
      {googleMsg && <p className="text-sm mt-3 font-semibold" style={{ color: "var(--error)" }}>{googleMsg}</p>}
      <p className="text-center text-sm mt-6">
        <Link href="/login" className="font-bold" style={{ color: "var(--mocha)" }}>Log in</Link>
      </p>
    </main>
  );
}
