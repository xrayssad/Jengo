"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { afterAuthPath, resendOtp, verifyOtp } from "@/lib/api";
import OtpBoxes from "@/components/OtpBoxes";

function VerifyForm() {
  const search = useSearchParams();
  const [email, setEmail] = useState(search.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(search.get("sent") === "1" ? 60 : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code we sent");
      return;
    }
    setBusy(true);
    try {
      const user = await verifyOtp({ email: email.trim() }, code.trim());
      window.location.href = afterAuthPath(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code is incorrect");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (wait > 0) return;
    setError("");
    setInfo("");
    try {
      await resendOtp({ email: email.trim() });
      setInfo("A new code was sent. Check your email.");
      setWait(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden flex items-center justify-center px-4" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="sheet w-full max-w-sm min-w-0 p-6 rounded-[28px] fade-up">
        <p className="text-sm" style={{ color: "#8B5E3C" }}>Verification</p>
        <h1 className="font-heading text-[36px] leading-none mb-3" style={{ color: "#2E1A0F" }}>
          Verify email
        </h1>
        <p className="text-sm mb-6" style={{ color: "#5C4033" }}>
          Enter the 6-digit code we sent to your email.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-chocolate w-full px-4 py-3.5 text-sm" placeholder="Email" />
          <OtpBoxes value={code} onChange={setCode} length={6} />
          {error && <p className="text-sm font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
          {info && <p className="text-sm font-semibold" style={{ color: "#5E7F4F" }}>{info}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">
            {busy ? "Verifying..." : "Verify"}
          </button>
        </form>
        <button type="button" onClick={resend} disabled={wait > 0} className="btn-secondary w-full mt-3 py-3.5 rounded-full text-sm font-semibold">
          {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
        </button>
        <p className="text-center text-sm mt-6">
          <Link href="/login" className="font-bold" style={{ color: "#8B5E3C" }}>Back to log in</Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }} />}>
      <VerifyForm />
    </Suspense>
  );
}
