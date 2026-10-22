"use client";

import { useState, useEffect } from "react";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const slides = [
  { id: 1, image: "/poster_nyumba_salama.png", title: "Nyumba Salama", subtitle: "Pata chumba cha kuaminika" },
  { id: 2, image: "/poster_maduka_godown.png", title: "Maduka & Godown", subtitle: "Frame na nafasi za biashara" },
  { id: 3, image: "/poster_vifaa_ujenzi.png", title: "Vifaa vya Ujenzi", subtitle: "Bei wazi, ubora unaoonekana" },
  { id: 4, image: "/poster_mnada_rahisi.png", title: "Mnada Rahisi", subtitle: "Bei bora inashinda" },
];

function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 45);
    return () => clearInterval(t);
  }, [text]);
  return (
    <span>
      {displayed}
      <span className="inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-pulse" style={{ backgroundColor: "#D2A679" }} />
    </span>
  );
}

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/home";
  };

  const slide = slides[current];

  return (
    <main className="min-h-screen flex flex-col md:flex-row md:items-center md:justify-center md:p-4" style={{ backgroundColor: "#FFF6ED" }}>
      <div
        className="w-full md:max-w-4xl flex flex-col md:flex-row md:rounded-[24px] md:overflow-hidden md:min-h-[520px]"
        style={{ boxShadow: "0 20px 50px rgba(46,26,15,0.12)" }}
      >
        {/* SLIDESHOW – juu kwenye simu */}
        <div className="w-full md:w-1/2 relative h-[40vh] md:h-auto md:min-h-[520px] bg-[#1A0F08] shrink-0">
          {slides.map((s, i) => (
            <div key={s.id} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: current === i ? 1 : 0 }}>
              <Image
                src={s.image}
                alt={s.title}
                fill
                className="object-cover"
                style={{
                  transform: current === i ? "scale(1.06)" : "scale(1)",
                  transition: current === i ? "transform 7s ease-out" : "none",
                }}
                priority={i === 0}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.9) 0%, rgba(26,15,8,0.2) 55%, transparent 100%)" }} />
            </div>
          ))}
          <div className="absolute bottom-10 left-0 right-0 px-5 z-20 text-center">
            <h2 className="text-xl font-bold mb-1" style={{ color: "#FFF6ED" }}>
              <Typewriter text={slide.title} key={"t-" + current} />
            </h2>
            <p className="text-sm" style={{ color: "#D2A679" }}>
              <Typewriter text={slide.subtitle} key={"s-" + current} />
            </p>
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: current === i ? "#D2A679" : "rgba(255,246,237,0.35)",
                  width: current === i ? 16 : 6,
                }}
              />
            ))}
          </div>
        </div>

        {/* FORM – chini kwenye simu */}
        <div className="w-full md:w-1/2 bg-white px-5 py-6 md:p-10 flex flex-col justify-center flex-1 rounded-t-[24px] md:rounded-none -mt-5 md:mt-0 relative z-10">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Ingia</h1>
          <p className="text-sm mb-6" style={{ color: "#5C4033" }}>Karibu tena kwenye Jengo</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Namba ya simu"
                className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nenosiri"
                className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {showPass ? <EyeOff size={16} color="#8B5E3C" /> : <Eye size={16} color="#8B5E3C" />}
              </button>
            </div>
            <button type="submit" className="btn-primary w-full py-3.5 rounded-[16px] font-semibold text-[15px]">
              Ingia
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: "#5C4033" }}>
            Huna akaunti?{" "}
            <Link href="/register" className="font-bold" style={{ color: "#8B5E3C" }}>
              Jisajili
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
