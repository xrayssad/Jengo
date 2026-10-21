"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const slides = [
  {
    id: 1,
    image: "/poster_nyumba_salama.png",
    title: "Jiunge Nasi",
    subtitle: "Anza kuuza na kununua kwa urahisi",
  },
  {
    id: 2,
    image: "/poster_maduka_godown.png",
    title: "Maduka & Godown",
    subtitle: "Frame na nafasi za biashara",
  },
  {
    id: 3,
    image: "/poster_vifaa_ujenzi.png",
    title: "Vifaa vya Ujenzi",
    subtitle: "Bei wazi, ubora unaoonekana",
  },
  {
    id: 4,
    image: "/poster_mnada_rahisi.png",
    title: "Mnada Rahisi",
    subtitle: "Bei bora inashinda",
  },
];

function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      <span
        className="inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-pulse"
        style={{ backgroundColor: "#D2A679" }}
      />
    </span>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      alert("Jaza sehemu zote");
      return;
    }
    alert("Usajili utafungwa na backend hivi karibuni");
    window.location.href = "/";
  };

  const slide = slides[current];

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FFF6ED" }}>
      <div
        className="w-full max-w-4xl rounded-[24px] overflow-hidden flex flex-col md:flex-row"
        style={{
          border: "1.5px solid #3D2415",
          boxShadow: "0 0 0 1px rgba(46,26,15,0.15), 0 20px 50px rgba(46,26,15,0.18), 0 0 40px rgba(139,94,60,0.1)",
          minHeight: "560px",
        }}
      >
        {/* LEFT – Form */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-10 flex flex-col justify-center relative">
          <Link href="/" className="absolute top-5 left-5 btn-secondary w-9 h-9 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={16} strokeWidth={2.2} />
          </Link>

          <div className="mt-6">
            <h1 className="text-3xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Jisajili</h1>
            <p className="text-sm mb-8" style={{ color: "#5C4033" }}>Fungua akaunti yako bure</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jina kamili" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>

              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Namba ya simu" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nenosiri" className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff size={16} color="#8B5E3C" /> : <Eye size={16} color="#8B5E3C" />}
                </button>
              </div>

              <button type="submit" className="btn-primary w-full py-3.5 rounded-[16px] font-semibold text-[15px] mt-1">
                Anza Sasa
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: "#5C4033" }}>
              Una akaunti?{" "}
              <Link href="/login" className="font-bold" style={{ color: "#8B5E3C" }}>Ingia</Link>
            </p>
          </div>
        </div>

        {/* RIGHT – Slideshow */}
        <div className="w-full md:w-1/2 relative overflow-hidden min-h-[300px] md:min-h-0 bg-[#1A0F08]">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: current === i ? 1 : 0 }}
            >
              <Image
                src={s.image}
                alt={s.title}
                fill
                className="object-cover"
                style={{
                  transform: current === i ? "scale(1.08)" : "scale(1)",
                  transition: current === i ? "transform 7s ease-out" : "none",
                }}
                priority={i === 0}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.85) 0%, rgba(26,15,8,0.25) 50%, transparent 100%)" }} />
            </div>
          ))}

          <div className="absolute bottom-14 left-0 right-0 px-6 z-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#FFF6ED" }}>
              <Typewriter text={slide.title} key={`t-${current}`} />
            </h2>
            <p className="text-sm md:text-base" style={{ color: "#D2A679" }}>
              <Typewriter text={slide.subtitle} key={`s-${current}`} />
            </p>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: current === i ? "#D2A679" : "rgba(255,246,237,0.35)",
                  width: current === i ? 20 : 8,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
