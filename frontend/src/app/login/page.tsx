"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { login as apiLogin, startGoogle } from "@/lib/api";

const slides = [
  { image: "/poster_nyumba_salama.png", title: "Chumba & Nyumba" },
  { image: "/poster_maduka_godown.png", title: "Store & Godown" },
  { image: "/poster_vifaa_ujenzi.png", title: "Apartment & Airbnb" },
  { image: "/poster_mnada_rahisi.png", title: "Frame za Maduka" },
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
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setBusy(true);
    try {
      await apiLogin(email.trim(), password);
      window.location.href = "/home";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Barua pepe au nenosiri si sahihi";
      if (msg.toLowerCase().includes("haijathibitishwa")) {
        setUnverified(true);
        setError("Barua pepe haijathibitishwa");
      } else {
        setError("Barua pepe au nenosiri si sahihi");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setGoogleMsg("");
    try {
      const redirect = `${window.location.origin}/auth/callback`;
      const res = await startGoogle(redirect);
      window.location.href = res.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google haijaunganishwa kwenye Supabase.";
      setGoogleMsg(msg);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="relative w-full md:w-1/2 h-[38vh] md:h-screen">
        {slides.map((s, i) => (
          <div key={s.image} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: slide === i ? 1 : 0 }}>
            <Image src={s.image} alt={s.title} fill className="object-cover" priority={i === 0} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.85), transparent 55%)" }} />
            <div className="absolute bottom-8 left-6">
              <h2 className="font-heading text-2xl" style={{ color: "#FFF6ED" }}>{s.title}</h2>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <h1 className="font-heading text-3xl mb-2" style={{ color: "#2E1A0F" }}>Karibu tena</h1>
          <p className="text-sm mb-8" style={{ color: "#5C4033" }}>Ingia kwa barua pepe au Google.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Barua pepe</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Nenosiri</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {show ? <EyeOff size={16} color="#8B5E3C" /> : <Eye size={16} color="#8B5E3C" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
            {unverified && (
              <Link href={`/verify?email=${encodeURIComponent(email)}`} className="block text-sm font-semibold" style={{ color: "#8B5E3C" }}>
                Tuma namba tena
              </Link>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-[18px] text-sm font-semibold">
              {busy ? "Inaingia..." : "Ingia"}
            </button>
          </form>
          <button type="button" onClick={google} className="btn-secondary w-full mt-3 py-3.5 rounded-[18px] text-sm font-semibold">
            Ingia na Google
          </button>
          {googleMsg && <p className="text-sm mt-3 font-semibold" style={{ color: "#A6452E" }}>{googleMsg}</p>}
          <p className="text-center text-sm mt-8" style={{ color: "#5C4033" }}>
            <Link href="/register" className="font-bold" style={{ color: "#8B5E3C" }}>Jisajili</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
