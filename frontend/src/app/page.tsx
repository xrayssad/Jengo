"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home, Store, BrickWall, Gavel, ArrowRight, Shield,
  BadgeCheck, Search, MapPin, Users, Building2, ChevronRight
} from "lucide-react";

const heroSlides = [
  { img: "/real/room.jpg", label: "Nyumba Salama" },
  { img: "/real/shop.jpg", label: "Maduka & Godown" },
  { img: "/real/materials.jpg", label: "Vifaa vya Ujenzi" },
  { img: "/real/market.jpg", label: "Mnada Rahisi" },
];

const services = [
  {
    icon: Home,
    title: "Nyumba & Vyumba",
    desc: "Tafuta chumba, apartment au nyumba ya kupanga. Bei wazi, wenye nyumba waliothibitishwa.",
    img: "/real/apartment.jpg",
    href: "/register",
  },
  {
    icon: Store,
    title: "Maduka & Godown",
    desc: "Frame za maduka, showroom na godown za biashara — karibu na soko lako.",
    img: "/real/warehouse.jpg",
    href: "/register",
  },
  {
    icon: BrickWall,
    title: "Vifaa vya Ujenzi",
    desc: "Saruji, chuma, matofali na vifaa vingine kutoka wauzaji wa uhakika.",
    img: "/real/materials.jpg",
    href: "/register",
  },
  {
    icon: Gavel,
    title: "Mnada",
    desc: "Shindana kwa bei bora. Mnada wa nyumba, maduka na vifaa — uwazi kamili.",
    img: "/real/market.jpg",
    href: "/register",
  },
];

const stats = [
  { icon: Building2, value: "500+", label: "Matangazo" },
  { icon: Users, value: "1,200+", label: "Watumiaji" },
  { icon: MapPin, value: "Dar & Zaidi", label: "Maeneo" },
  { icon: BadgeCheck, value: "100%", label: "Uhakiki" },
];

export default function LandingPage() {
  const [slide, setSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
        style={{
          backgroundColor: "rgba(255,246,237,0.88)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(210,166,121,0.25)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #8B5E3C, #2E1A0F)" }}>
              <Home size={18} color="#FFF6ED" strokeWidth={2} />
            </div>
            <div>
              <span className="font-bold text-lg block leading-none" style={{ color: "#2E1A0F" }}>Jengo</span>
              <span className="text-[10px] tracking-[0.15em] uppercase font-medium" style={{ color: "#8B5E3C" }}>App</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold px-4 py-2" style={{ color: "#2E1A0F" }}>Ingia</Link>
            <Link href="/register" className="text-sm font-semibold px-5 py-2.5 rounded-full transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED", boxShadow: "0 4px 14px rgba(46,26,15,0.25)" }}>
              Jisajili
            </Link>
          </div>
        </div>
      </header>

      {/* HERO – picha za kweli */}
      <section className="relative pt-16 min-h-[85vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.map((s, i) => (
            <div key={s.img} className="absolute inset-0 transition-opacity duration-[1200ms]" style={{ opacity: slide === i ? 1 : 0 }}>
              <Image
                src={s.img}
                alt={s.label}
                fill
                className="object-cover"
                style={{
                  transform: slide === i ? "scale(1.06)" : "scale(1)",
                  transition: slide === i ? "transform 5s ease-out" : "none",
                }}
                priority={i === 0}
              />
            </div>
          ))}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, #1A0F08 0%, rgba(26,15,8,0.7) 40%, rgba(26,15,8,0.25) 70%, rgba(46,26,15,0.15) 100%)",
          }} />
        </div>

        <div className={`relative z-10 max-w-5xl mx-auto px-4 pb-12 w-full transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "#D2A679" }}>Marketplace ya Tanzania</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] mb-4 max-w-xl" style={{ color: "#FFF6ED" }}>
            Nyumba, maduka na vifaa — yote mahali pamoja
          </h1>
          <p className="text-sm sm:text-base leading-relaxed mb-8 max-w-md" style={{ color: "rgba(255,246,237,0.85)" }}>
            Jengo inaunganisha wapangaji, wenye nyumba na wauzaji wa vifaa. Tafuta, weka tangazo, au shiriki mnada — kwa uaminifu na urahisi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-[16px] font-semibold text-[15px] transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: "#D2A679", color: "#2E1A0F", boxShadow: "0 8px 24px rgba(210,166,121,0.35)" }}>
              Anza Bure <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center py-4 px-8 rounded-[16px] font-semibold text-[15px]"
              style={{ backgroundColor: "rgba(255,246,237,0.12)", color: "#FFF6ED", border: "1.5px solid rgba(255,246,237,0.35)", backdropFilter: "blur(8px)" }}>
              Nina akaunti
            </Link>
          </div>
          <div className="flex gap-2 mt-8">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: slide === i ? 24 : 8, backgroundColor: slide === i ? "#D2A679" : "rgba(255,246,237,0.35)" }} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 -mt-6 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-[22px] p-4 sm:p-5"
          style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.1)", boxShadow: "0 16px 40px rgba(46,26,15,0.1)" }}>
          {stats.map((s) => (
            <div key={s.label} className="text-center py-2">
              <s.icon size={20} color="#8B5E3C" className="mx-auto mb-1.5" />
              <p className="text-lg font-bold" style={{ color: "#2E1A0F" }}>{s.value}</p>
              <p className="text-[11px]" style={{ color: "#5C4033" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="px-4 py-14 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "#8B5E3C" }}>Huduma zetu</p>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "#2E1A0F" }}>Kila kitu unachohitaji</h2>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "#5C4033" }}>
            Kutoka chumba cha kupanga hadi vifaa vya ujenzi — jukwaa moja linatosha
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <Link key={svc.title} href={svc.href}
                className="group relative rounded-[22px] overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                style={{ boxShadow: "0 8px 28px rgba(46,26,15,0.1)", border: "1px solid rgba(61,36,21,0.12)" }}>
                <div className="relative h-48 overflow-hidden">
                  <Image src={svc.img} alt={svc.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.8) 0%, transparent 60%)" }} />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(210,166,121,0.3)", backdropFilter: "blur(8px)" }}>
                        <Icon size={18} color="#F5E6D3" />
                      </div>
                      <h3 className="font-bold text-[15px]" style={{ color: "#FFF6ED" }}>{svc.title}</h3>
                    </div>
                    <ChevronRight size={18} color="#D2A679" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-4" style={{ backgroundColor: "white" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#5C4033" }}>{svc.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* STEPS */}
      <section className="px-4 py-12" style={{ backgroundColor: "rgba(210,166,121,0.12)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "#8B5E3C" }}>Rahisi</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "#2E1A0F" }}>Hatua 3 tu</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { n: "01", t: "Jisajili bure", d: "Fungua akaunti kwa namba ya simu — hakuna ada ya kujiunga." },
              { n: "02", t: "Tafuta au weka", d: "Chagua kategoria, tafuta kinachohitajika, au weka tangazo lako." },
              { n: "03", t: "Wasiliana", d: "Tuma ombi au piga simu — maliza biashara kwa uaminifu." },
            ].map((step) => (
              <div key={step.n} className="rounded-[20px] p-5 transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.1)", boxShadow: "0 6px 20px rgba(46,26,15,0.06)" }}>
                <span className="text-3xl font-bold block mb-3" style={{ color: "#D2A679" }}>{step.n}</span>
                <h3 className="font-bold text-base mb-1.5" style={{ color: "#2E1A0F" }}>{step.t}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#5C4033" }}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="rounded-[24px] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6"
          style={{ background: "linear-gradient(145deg, #3D2415 0%, #2E1A0F 60%, #1A0F08 100%)", boxShadow: "0 16px 40px rgba(46,26,15,0.3)" }}>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
              <Shield size={22} color="#D2A679" />
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#D2A679" }}>Uaminifu kwanza</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: "#FFF6ED" }}>Wauzaji waliothibitishwa, bei wazi</h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,246,237,0.7)" }}>
              Kila mwenye nyumba na tangazo hufanyiwa ukaguzi. Hakuna ada za siri.
            </p>
          </div>
          <Link href="/register" className="shrink-0 inline-flex items-center gap-2 py-3.5 px-7 rounded-[14px] font-semibold text-sm transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: "#D2A679", color: "#2E1A0F" }}>
            Anza sasa <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="px-4 pb-16 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#2E1A0F" }}>Tayari kuanza?</h2>
        <p className="text-sm mb-6" style={{ color: "#5C4033" }}>Jisajili bure — tafuta ndani ya dakika chache</p>
        <Link href="/register" className="btn-primary pulse-cta inline-flex items-center justify-center gap-2 w-full py-4 rounded-[18px] font-semibold text-[15px]">
          Fungua Akaunti Bure <ArrowRight size={18} />
        </Link>
        <p className="text-sm mt-4" style={{ color: "#5C4033" }}>
          Una akaunti? <Link href="/login" className="font-bold" style={{ color: "#8B5E3C" }}>Ingia</Link>
        </p>
        <p className="text-xs mt-8" style={{ color: "#8B5E3C" }}>© 2026 Jengo App · Tanzania</p>
      </section>
    </main>
  );
}
