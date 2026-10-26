"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { register as apiRegister, startGoogle } from "@/lib/api";

const slides = [
  { image: "/real/room.jpg", title: "Chumba & Nyumba" },
  { image: "/real/warehouse.jpg", title: "Store & Godown" },
  { image: "/real/apartment.jpg", title: "Apartment & Airbnb" },
  { image: "/real/shop.jpg", title: "Frame za Maduka" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      setError("Nenosiri liwe angalau herufi 8");
      return;
    }
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username.trim())) {
      setError("Username: herufi 3–20, herufi, namba au _");
      return;
    }
    setBusy(true);
    try {
      await apiRegister({
        email: email.trim(),
        password,
        username: username.trim(),
        full_name: fullName.trim(),
      });
      router.push(`/verify?email=${encodeURIComponent(email.trim())}&sent=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kujisajili");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setGoogleMsg("");
    try {
      await startGoogle(`${window.location.origin}/auth/callback`);
    } catch (err) {
      setGoogleMsg(err instanceof Error ? err.message : "Google haijaunganishwa kwenye Supabase. Washa provider ya Google, au ingia kwa barua pepe.");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="relative h-[32vh] min-h-[200px]">
        {slides.map((s, i) => (
          <div key={s.image} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: slide === i ? 1 : 0 }}>
            <Image src={s.image} alt="" fill className="object-cover" priority={i === 0} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(46,26,15,0.62), rgba(46,26,15,0.12) 70%, transparent)" }} />
          </div>
        ))}
      </div>
      <div className="px-5 -mt-14 relative z-10 pb-12">
        <div className="sheet max-w-sm mx-auto p-6 rounded-[28px] fade-up">
          <p className="text-sm" style={{ color: "#8B5E3C" }}>Jengo</p>
          <h1 className="font-heading text-[36px] leading-none mb-2" style={{ color: "#2E1A0F" }}>Fungua akaunti</h1>
          <p className="text-sm mb-6" style={{ color: "#5C4033" }}>Baada ya kujisajili, weka namba kutoka barua pepe ili akaunti ianze kufanya kazi.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Jina kamili</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Username</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jengo_duka" className="input-chocolate w-full px-4 py-3.5 text-sm" />
            </div>
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
                <input type={show ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {show ? <EyeOff size={16} color="#8B5E3C" /> : <Eye size={16} color="#8B5E3C" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">
              {busy ? "Inasajili..." : "Endelea"}
            </button>
          </form>
          <button type="button" onClick={google} className="btn-secondary w-full mt-3 py-3.5 rounded-full text-sm font-semibold">
            Ingia na Google
          </button>
          {googleMsg && <p className="text-sm mt-3 font-semibold" style={{ color: "#A6452E" }}>{googleMsg}</p>}
          <p className="text-center text-sm mt-6">
            <Link href="/login" className="font-bold" style={{ color: "#8B5E3C" }}>Ingia</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
