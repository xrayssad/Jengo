"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resendOtp, verifyEmail } from "@/lib/api";

function VerifyForm() {
  const search = useSearchParams();
  const initial = search.get("email") || "";
  const [email, setEmail] = useState(initial);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await verifyEmail(email.trim(), code.trim());
      window.location.href = "/home";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Namba si sahihi");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    setInfo("");
    try {
      await resendOtp(email.trim());
      setInfo("Thibitisho limetumwa tena. Angalia namba au kiungo kwenye barua pepe.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kutuma");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-3xl mb-2" style={{ color: "#2E1A0F" }}>Thibitisha barua pepe</h1>
        <p className="text-sm mb-8" style={{ color: "#5C4033" }}>
          Ikiwa barua pepe ina namba, iweke hapa. Ikiwa ina kiungo cha kuthibitisha, bonyeza kiungo hicho.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-chocolate w-full px-4 py-3.5 text-sm" placeholder="Barua pepe" />
          <input required value={code} onChange={(e) => setCode(e.target.value)} className="input-chocolate w-full px-4 py-3.5 text-sm tracking-[0.3em]" placeholder="Namba" />
          {error && <p className="text-sm font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
          {info && <p className="text-sm font-semibold" style={{ color: "#5E7F4F" }}>{info}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-[18px] text-sm font-semibold">
            {busy ? "Inathibitisha..." : "Thibitisha"}
          </button>
        </form>
        <button type="button" onClick={resend} className="btn-secondary w-full mt-3 py-3.5 rounded-[18px] text-sm font-semibold">
          Tuma namba tena
        </button>
        <p className="text-center text-sm mt-8">
          <Link href="/login" className="font-bold" style={{ color: "#8B5E3C" }}>Rudi kuingia</Link>
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
