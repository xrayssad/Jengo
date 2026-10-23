"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { login as apiLogin } from "@/lib/api";

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

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apiLogin(email || "demo@jengo.app", password || "demo");
    window.location.href = "/home";
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="relative w-full md:w-1/2 h-[42vh] md:h-screen">
        {slides.map((s, i) => (
          <div key={s.image} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: slide === i ? 1 : 0 }}>
            <Image src={s.image} alt={s.title} fill className="object-cover" priority={i === 0} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.85), transparent 55%)" }} />
            <div className="absolute bottom-8 left-6">
              <h2 className="text-2xl font-bold" style={{ color: "#FFF6ED" }}>{s.title}</h2>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Karibu tena</h1>
          <p className="text-sm mb-6" style={{ color: "#5C4033" }}>
            Demo — weka chochote, kisha Ingia (auth halisi baadaye)
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Barua pepe</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@jengo.app" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Nenosiri</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {show ? <EyeOff size={16} color="#8B5E3C" /> : <Eye size={16} color="#8B5E3C" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-4 rounded-[18px] font-semibold text-sm" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
              Ingia
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: "#5C4033" }}>
            <Link href="/register" className="font-bold" style={{ color: "#8B5E3C" }}>Jisajili</Link>
            {" · "}
            <Link href="/home" className="font-bold" style={{ color: "#8B5E3C" }}>Ruka kwenda Home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
