"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { afterAuthPath, register as apiRegister, startGoogle } from "@/lib/api";

const slides = [
  { image: "/real/room.jpg", title: "Houses / Rooms" },
  { image: "/real/warehouse.jpg", title: "Godown / Store" },
  { image: "/real/apartment.jpg", title: "Apartment & Airbnb" },
  { image: "/real/shop.jpg", title: "Shop frames" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [via, setVia] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [slide, setSlide] = useState(0);
  const [error, setError] = useState("");
  const [googleMsg, setGoogleMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, []);

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
        email: via === "email" ? email.trim() : "",
        phone: via === "phone" ? phone.trim() : "",
        password,
        username: username.trim(),
        full_name: fullName.trim(),
      });
      if (created.access_token) {
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
    try {
      await startGoogle(`${window.location.origin}/auth/callback`);
    } catch (err) {
      setGoogleMsg(err instanceof Error ? err.message : "Google is not connected in Supabase. Turn on the Google provider, or log in with email.");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
      <div className="relative h-[32vh] min-h-[200px]">
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
          <h1 className="font-heading text-[36px] leading-none mb-2" style={{ color: "var(--ink)" }}>Create account</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Sign up with phone or email. The 8-digit code is sent to email only.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              {([
                { id: "phone", label: "Phone" },
                { id: "email", label: "Email" },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVia(opt.id)}
                  className={`flex-1 py-2 text-sm ${via === opt.id ? "rounded-full" : "chip"}`}
                  style={via === opt.id ? { backgroundColor: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink)" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--mocha)" />
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Username</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jengo_duka" className="input-chocolate w-full px-4 py-3.5 text-sm" />
            </div>
            {via === "phone" ? (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Phone number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--mocha)" />
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" inputMode="tel" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--mocha)" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--mocha)" />
                <input type={show ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {show ? <EyeOff size={16} color="var(--mocha)" /> : <Eye size={16} color="var(--mocha)" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">
              {busy ? "Creating account..." : "Continue"}
            </button>
          </form>
          <button type="button" onClick={google} className="btn-secondary w-full mt-3 py-3.5 rounded-full text-sm font-semibold">
            Continue with Google
          </button>
          {googleMsg && <p className="text-sm mt-3 font-semibold" style={{ color: "var(--error)" }}>{googleMsg}</p>}
          <p className="text-center text-sm mt-6">
            <Link href="/login" className="font-bold" style={{ color: "var(--mocha)" }}>Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
