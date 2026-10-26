"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { afterAuthPath, login as apiLogin, resendOtp, startGoogle } from "@/lib/api";

const slides = [
  { image: "/real/room.jpg", title: "Houses / Rooms" },
  { image: "/real/warehouse.jpg", title: "Godown / Store" },
  { image: "/real/apartment.jpg", title: "Apartment & Airbnb" },
  { image: "/real/shop.jpg", title: "Shop frames" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [slide, setSlide] = useState(0);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [googleMsg, setGoogleMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setBusy(true);
    try {
      const user = await apiLogin(email.trim(), password);
      window.location.href = afterAuthPath(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Email, phone or password is incorrect";
      if (msg.toLowerCase().includes("haijathibitishwa") || msg.toLowerCase().includes("not verified")) {
        setUnverified(true);
        setError("Account not verified. Resend the code to confirm it.");
      } else {
        setError("Phone, email or password is incorrect");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setGoogleMsg("");
    try {
      await startGoogle(`${window.location.origin}/auth/callback`);
    } catch (err) {
      setGoogleMsg(err instanceof Error ? err.message : "Google is not connected in Supabase. Turn on the Google provider, or log in with email.");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
      <div className="relative h-[36vh] min-h-[220px]">
        {slides.map((s, i) => (
          <div key={s.image} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: slide === i ? 1 : 0 }}>
            <Image src={s.image} alt="" fill className="object-cover" priority={i === 0} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(var(--veil-rgb),0.62), rgba(var(--veil-rgb),0.12) 70%, transparent)" }} />
          </div>
        ))}
      </div>
      <div className="px-5 -mt-14 relative z-10 pb-12">
        <div className="sheet max-w-sm mx-auto p-6 rounded-[28px] fade-up">
          <p className="text-sm" style={{ color: "var(--mocha)" }}>Jengo</p>
          <h1 className="font-heading text-[36px] leading-none mb-2" style={{ color: "var(--ink)" }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Log in with phone, email or Google.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Phone or email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--mocha)" />
                <input required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="0712 345 678 or email" inputMode="email" autoComplete="username" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--mocha)" />
                <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {show ? <EyeOff size={16} color="var(--mocha)" /> : <Eye size={16} color="var(--mocha)" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
            {unverified && (
              <button
                type="button"
                className="block text-sm font-semibold"
                style={{ color: "var(--mocha)" }}
                onClick={async () => {
                  try {
                    if (!email.includes("@")) {
                      setError("OTP is sent to email only. Log in with email to verify.");
                      return;
                    }
                    await resendOtp({ email: email.trim() });
                    window.location.href = `/verify?email=${encodeURIComponent(email.trim())}&sent=1`;
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
          <button type="button" onClick={google} className="btn-secondary w-full mt-3 py-3.5 rounded-full text-sm font-semibold">
            Continue with Google
          </button>
          {googleMsg && <p className="text-sm mt-3 font-semibold" style={{ color: "var(--error)" }}>{googleMsg}</p>}
          <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
            <Link href="/register" className="font-bold" style={{ color: "var(--mocha)" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
